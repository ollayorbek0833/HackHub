"use client";

import { LogOutIcon } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { useToastAction, type FormAction } from "./use-toast-action";

/**
 * "Leave team" with the docs/08 confirm dialog. Secondary and destructive.
 * After submitting, it's disabled with the reason shown: the server refuses
 * a leave anyway (Decision 9).
 */
export function LeaveTeamButton({
  action,
  teamName,
  isLastMember,
  submitted,
}: {
  action: FormAction;
  teamName: string;
  isLastMember: boolean;
  submitted: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useToastAction(async (prev, data) => {
    const result = await action(prev, data);
    // On success this component unmounts; on a refusal, show it on the page.
    setOpen(false);
    return result;
  });

  if (submitted) {
    return (
      <div className="flex flex-col gap-2 sm:items-start">
        <Button
          variant="destructive"
          size="lg"
          disabled
          aria-describedby="leave-disabled-reason"
          className="h-11 w-full sm:w-auto"
        >
          <LogOutIcon aria-hidden />
          Leave team
        </Button>
        <p id="leave-disabled-reason" className="text-sm text-muted-foreground">
          You can&apos;t leave after your team has submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:items-start">
      {state?.ok === false && state.formError && (
        <Alert variant="destructive">
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      )}
      <AlertDialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="lg"
            className="h-11 w-full sm:w-auto"
          >
            <LogOutIcon aria-hidden />
            Leave team
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave {teamName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {isLastMember
                ? `You're the last member, so leaving deletes ${teamName}.`
                : "You can join or create another team in this event."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={formAction}>
            <AlertDialogFooter>
              {/* Radix focuses Cancel first (docs/08 > Confirm dialog). */}
              <AlertDialogCancel
                size="lg"
                disabled={pending}
                className="h-11"
              >
                Cancel
              </AlertDialogCancel>
              <Button
                type="submit"
                variant="destructive"
                size="lg"
                disabled={pending}
                className="h-11"
              >
                {pending ? "Leaving…" : "Leave team"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
