"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, toFieldErrors } from "@/lib/forms";
import { ForbiddenError, UnauthorizedError, requirePermission } from "@/modules/auth/permissions";
import {
  createAdminRole,
  createAdminUser,
  createBootstrapOwner,
  setUserActive,
  updateAdminRole,
  updateAdminUser,
} from "./rbac.service";

const userFormSchema = z.object({
  userId: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required").max(160),
  username: z.string().trim().min(1, "Username is required").max(80),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  password: z.string().trim().min(6, "Password must be at least 6 characters").max(200).optional().or(z.literal("")),
  isActive: z.string().optional(),
  primaryRoleId: z.string().uuid("Select a primary role"),
  roleIds: z.array(z.string().uuid()).min(1, "Select at least one role"),
});

const roleFormSchema = z.object({
  roleId: z.string().uuid().optional(),
  code: z.string().trim().min(1, "Code is required").max(80),
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  isActive: z.string().optional(),
  permissionCodes: z.array(z.string().min(1)).min(1, "Select at least one permission"),
});

const bootstrapSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  username: z.string().trim().min(1, "Username is required").max(80),
  password: z.string().trim().min(6, "Password must be at least 6 characters").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export async function saveUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await requirePermission("admin.users.manage", { onDenied: "throw" });
    const roleIds = formData.getAll("roleIds").map((value) => String(value));
    const primaryRoleId = formData.get("primaryRoleId") ? String(formData.get("primaryRoleId")) : roleIds[0];
    const parsed = userFormSchema.safeParse({
      userId: formData.get("userId") ? String(formData.get("userId")) : undefined,
      name: formData.get("name"),
      username: formData.get("username"),
      phone: formData.get("phone") || undefined,
      password: formData.get("password") || undefined,
      isActive: formData.get("isActive") ? "on" : undefined,
      primaryRoleId,
      roleIds,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return {
        status: "error",
        message: flat.formErrors[0] ?? "Please correct the highlighted fields.",
        fieldErrors: toFieldErrors(flat.fieldErrors),
      };
    }

    const payload = {
      name: parsed.data.name,
      username: parsed.data.username,
      phone: parsed.data.phone || undefined,
      password: parsed.data.password || undefined,
      isActive: Boolean(parsed.data.isActive),
      primaryRoleId: parsed.data.primaryRoleId,
      roleIds: parsed.data.roleIds,
    };

    if (parsed.data.userId) {
      await updateAdminUser(parsed.data.userId, payload, actor);
      revalidatePath("/admin/users");
      revalidatePath(`/admin/users/${parsed.data.userId}`);
    } else {
      if (!payload.password) {
        return { status: "error", message: "Password is required when creating a user." };
      }
      const user = await createAdminUser({ ...payload, password: payload.password }, actor);
      revalidatePath("/admin/users");
      revalidatePath(`/admin/users/${user.id}`);
    }

    revalidatePath("/admin/roles");
    revalidatePath("/admin/permissions");
    return { status: "success", message: "User saved successfully." };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "You do not have permission to manage users." };
    }
    if (error instanceof UnauthorizedError) {
      return { status: "error", message: "Your session is no longer valid." };
    }
    return { status: "error", message: error instanceof Error ? error.message : "Failed to save user." };
  }
}

export async function saveRoleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await requirePermission("admin.roles.manage", { onDenied: "throw" });
    const permissionCodes = formData.getAll("permissionCodes").map((value) => String(value));
    const parsed = roleFormSchema.safeParse({
      roleId: formData.get("roleId") ? String(formData.get("roleId")) : undefined,
      code: formData.get("code"),
      name: formData.get("name"),
      description: formData.get("description") || undefined,
      isActive: formData.get("isActive") ? "on" : undefined,
      permissionCodes,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return {
        status: "error",
        message: flat.formErrors[0] ?? "Please correct the highlighted fields.",
        fieldErrors: toFieldErrors(flat.fieldErrors),
      };
    }

    const payload = {
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null,
      isActive: Boolean(parsed.data.isActive),
      permissionCodes: parsed.data.permissionCodes,
    };

    if (parsed.data.roleId) {
      await updateAdminRole(parsed.data.roleId, payload, actor);
      revalidatePath("/admin/roles");
      revalidatePath(`/admin/roles/${parsed.data.roleId}`);
    } else {
      const role = await createAdminRole(payload, actor);
      revalidatePath("/admin/roles");
      revalidatePath(`/admin/roles/${role.id}`);
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/permissions");
    return { status: "success", message: "Role saved successfully." };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "You do not have permission to manage roles." };
    }
    if (error instanceof UnauthorizedError) {
      return { status: "error", message: "Your session is no longer valid." };
    }
    return { status: "error", message: error instanceof Error ? error.message : "Failed to save role." };
  }
}

export async function bootstrapOwnerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = bootstrapSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      status: "error",
      message: flat.formErrors[0] ?? "Please correct the highlighted fields.",
      fieldErrors: toFieldErrors(flat.fieldErrors),
    };
  }

  try {
    const user = await createBootstrapOwner(parsed.data);
    revalidatePath("/login");
    revalidatePath("/admin/users");
    return { status: "success", message: `Owner user ${user.username} created.` };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? error.message : "Failed to bootstrap owner." };
  }
}

export async function bootstrapAndRedirectAction(formData: FormData) {
  const result = await bootstrapOwnerAction({ status: "idle" }, formData);
  if (result.status === "success") {
    redirect("/login?bootstrap=1");
  }
  return result;
}

export async function toggleUserActiveAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const actor = await requirePermission("admin.users.manage", { onDenied: "throw" });
    const userId = z.string().uuid().parse(formData.get("userId"));
    const nextActive = String(formData.get("nextActive")) === "true";
    await setUserActive(userId, nextActive, actor);
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { status: "success", message: `User ${nextActive ? "activated" : "deactivated"} successfully.` };
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return { status: "error", message: "You do not have permission to manage users." };
    }
    if (error instanceof UnauthorizedError) {
      return { status: "error", message: "Your session is no longer valid." };
    }
    return { status: "error", message: error instanceof Error ? error.message : "Failed to update user status." };
  }
}

export async function toggleUserActiveSubmitAction(formData: FormData) {
  return toggleUserActiveAction({ status: "idle" }, formData);
}
