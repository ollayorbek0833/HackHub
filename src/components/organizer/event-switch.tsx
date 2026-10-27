"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useOptimistic,
  useState,
} from "react";
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
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ActionState } from "@/lib/action-state";

// A switch with its state written next to it (docs/08 > Shared components >
// Switch with status). It flips at once and shows "Saving…" until the server
// confirms; on a refusal it goes back and the reason stays under it.

type Props = {
  label: string;
  help?: string;
  checked: boolean;
  /** Why the switch can't change right now; shown under it. */
  disabledReason?: string | null;
  /** Disabled without a reason of its own (results published: the page says so). */
  disabled?: boolean;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  /** Ask before switching off (closing submissions). */
  confirmOff?: { title: string; description: string; confirm: string };
};

export function EventSwitch({
  label,
  help,
  checked,
  disabledReason,
  disabled,
  action,
  confirmOff,
}: Props) {
  const id = useId();
  const [state, dispatch, pending] = useActionState(action, null);
  const [shown, setShown] = useOptimistic(checked);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (state?.ok && state.message) toast.success(state.message);
  }, [state]);

  function send(open: boolean) {
    const formData = new FormData();
    formData.set("open", String(open));
    startTransition(() => {
      setShown(open);
      dispatch(formData);
    });
  }

  // After a refusal the page refreshes, and the reason usually becomes the
  // note under the control; don't say it twice.
  const error =
    state?.ok === false && state.formError !== disabledReason
      ? state.formError
      : null;
  const note = disabledReason ?? help;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={id} className="min-h-11 flex-1 text-base">
          {label}
        </Label>
        <span
          className="text-sm text-muted-foreground"
          aria-live="polite"
        >
          {pending ? "Saving…" : shown ? "Open" : "Closed"}
        </span>
        <Switch
          id={id}
          checked={shown}
          disabled={pending || disabled || Boolean(disabledReason)}
          aria-describedby={note ? `${id}-note` : undefined}
          onCheckedChange={(open) =>
            !open && confirmOff ? setConfirming(true) : send(open)
          }
        />
      </div>
      {note && (
        <p id={`${id}-note`} className="text-sm text-muted-foreground">
          {note}
        </p>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {confirmOff && (
        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmOff.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmOff.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => send(false)}>
                {confirmOff.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
