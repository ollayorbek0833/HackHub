"use client";

import { useActionState, useEffect, useId } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  to: "PARTICIPANT" | "JUDGE";
  /** Why the change isn't allowed; the button is then disabled with this text. */
  disabledReason?: string;
};

/** "Make judge" / "Make participant" on one row of /organizer/users. */
export function RoleButton({ action, to, disabledReason }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const reasonId = useId();

  useEffect(() => {
    if (state?.ok && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="role" value={to} />
      <Button
        type="submit"
        variant="outline"
        disabled={pending || !!disabledReason}
        aria-describedby={disabledReason ? reasonId : undefined}
        className="h-11 md:h-9"
      >
        {pending ? "Saving…" : to === "JUDGE" ? "Make judge" : "Make participant"}
      </Button>
      {disabledReason && (
        <p id={reasonId} className="max-w-64 text-xs text-muted-foreground">
          {disabledReason}
        </p>
      )}
      {state?.ok === false && state.formError && (
        <p role="alert" className="max-w-64 text-xs text-destructive">
          {state.formError}
        </p>
      )}
    </form>
  );
}

