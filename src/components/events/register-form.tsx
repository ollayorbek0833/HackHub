"use client";

import { useActionState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * The "Register" button on /events/[eventId]. On success the page re-renders
 * in the registered state and this form unmounts, so the toast is raised as
 * soon as the result arrives rather than from an effect.
 */
export function RegisterForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (result?.ok && result.message) toast.success(result.message);
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 md:items-end">
      {state?.ok === false && state.formError && (
        <Alert variant="destructive" className="md:max-w-xs">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        aria-busy={pending}
        className="h-11 w-full px-6 text-base md:w-auto"
      >
        {pending ? "Registering…" : "Register"}
      </Button>
    </form>
  );
}
