"use client";

import { useActionState } from "react";
import { toast } from "sonner";

import type { ActionState } from "@/lib/action-state";

export type FormAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/**
 * useActionState that shows `message` as a success toast when the action
 * succeeds. Raised as soon as the result arrives, not from an effect: on
 * success the team page re-renders into another state and the form that
 * started the action has already unmounted.
 */
export function useToastAction(action: FormAction) {
  return useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    if (result?.ok && result.message) toast.success(result.message);
    return result;
  }, null);
}

/** The first error for a field, if the last result was a failure. */
export function fieldError(state: ActionState, field: string) {
  return state?.ok === false ? state.fieldErrors?.[field]?.[0] : undefined;
}

/** The submitted value to put back after a failure (React resets the form). */
export function previousValue(state: ActionState, field: string) {
  return state?.ok === false ? state.values?.[field] : undefined;
}
