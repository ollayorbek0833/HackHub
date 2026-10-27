"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useId } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";

// "Publish results" with its confirm dialog (docs/08 > Event overview,
// Decision 3). Publishing can't be undone, so the dialog also reminds the
// organizer to check the ranking preview: HackHub doesn't track whether every
// team has been scored. The ranking preview can render this button too.

type Props = {
  eventName: string;
  rankingHref: string;
  /** Why publishing isn't possible yet; the button is disabled and this shows under it. */
  disabledReason?: string | null;
  /** Disabled without a reason of its own (results published: the page says so). */
  disabled?: boolean;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

export function PublishResultsButton({
  eventName,
  rankingHref,
  disabledReason,
  disabled,
  action,
}: Props) {
  const id = useId();
  const [state, dispatch, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.ok) toast.success(state.message ?? "Results published.");
  }, [state]);

  // After a refusal the page refreshes, and the reason usually becomes the
  // note under the control; don't say it twice.
  const error =
    state?.ok === false && state.formError !== disabledReason
      ? state.formError
      : null;

  return (
    <div className="flex flex-col gap-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            className="min-h-11 self-start"
            disabled={pending || disabled || Boolean(disabledReason)}
            aria-describedby={disabledReason ? `${id}-reason` : undefined}
          >
            {pending ? "Publishing…" : "Publish results"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish results for {eventName}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2">
                <p>
                  Everyone will see the ranking, and judges can&apos;t change
                  scores any more. This can&apos;t be undone.
                </p>
                <p>
                  HackHub doesn&apos;t track whether every team has been
                  scored. Ask your judges, and check the{" "}
                  <Link
                    href={rankingHref}
                    className="text-foreground underline underline-offset-4"
                  >
                    ranking preview
                  </Link>{" "}
                  first.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                startTransition(() => dispatch(new FormData()))
              }
            >
              Publish results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {disabledReason && (
        <p id={`${id}-reason`} className="text-sm text-muted-foreground">
          {disabledReason}
        </p>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
