"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { setPerformanceStatus, withPerformanceTrace } from "@/lib/performance";
import { prisma } from "@/lib/prisma";
import { clearSession, createSession } from "./session";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

const invalidLoginUrl = "/login?error=invalid";

export async function loginAction(formData: FormData) {
  return withPerformanceTrace({ route: "/login", method: "ACTION" }, async () => {
    const parsed = loginSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      setPerformanceStatus(401);
      redirect(invalidLoginUrl);
    }

    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: { id: true, passwordHash: true, isActive: true },
    });
    if (!user?.isActive || !(await compare(parsed.data.password, user.passwordHash))) {
      setPerformanceStatus(401);
      redirect(invalidLoginUrl);
    }

    await createSession(user.id);
    setPerformanceStatus(303);
    redirect("/dashboard");
  });
}

export async function logoutAction() {
  return withPerformanceTrace({ route: "/logout", method: "ACTION" }, async () => {
    await clearSession();
    setPerformanceStatus(303);
    redirect("/login");
  });
}
