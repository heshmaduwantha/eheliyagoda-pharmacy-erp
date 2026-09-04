/** Shared shape returned by form server actions for useActionState consumers. */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string; paymentId?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export const idleFormState: FormState = { status: "idle" };

/** Builds a field-error map from a Zod flattened error result. */
export function toFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) result[key] = messages[0];
  }
  return result;
}
