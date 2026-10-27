import type { ActionState } from "@/lib/action-state";

/** An action's field errors in the shape <FieldError errors={…}> takes. */
export function fieldErrorsFor(
  state: Extract<ActionState, { ok: false }> | null,
): Record<string, { message: string }[] | undefined> {
  const result: Record<string, { message: string }[]> = {};
  for (const [field, messages] of Object.entries(state?.fieldErrors ?? {})) {
    result[field] = messages.map((message) => ({ message }));
  }
  return result;
}
