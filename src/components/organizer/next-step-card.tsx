"use client";

import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { ArrowRightIcon } from "lucide-react";
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
import type { NextStep } from "@/lib/domain/event-readiness";
import { cn } from "@/lib/utils";

// The command centre's one "Next step" (redesign): what to do now, what it
// changes, and a confirm dialog before it happens. The action is one of the
// overview's existing ones (open or close a switch, or publish), bound by the
// page; the server checks the same rules as before.

type Props = {
  step: NextStep;
  /** For the steps that change the event: the bound server action and the switch value it sends. */
  run?: {
    action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
    open?: boolean;
  };
  /** For the steps that are a page: where to go. */
  href?: string;
  /** Shown in the publish dialog: check the ranking preview first. */
  rankingHref?: string;
};

export function NextStepCard({ step, run, href, rankingHref }: Props) {
  const id = useId();
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6",
        // An amber edge only while there's something to do.
        step.kind !== "viewResults" && "border-primary/40",
      )}
    >
      <div className="flex flex-col gap-2">
        <h2 id={`${id}-title`} className="text-xl font-semibold text-balance">
          {step.title}
        </h2>
        <p className="text-sm text-muted-foreground">{step.effect}</p>
        {step.note && <p className="text-sm text-foreground">{step.note}</p>}
      </div>
      {run && step.confirm ? (
        <RunStep
          step={step}
          run={run}
          rankingHref={rankingHref}
          reasonId={`${id}-reason`}
        />
      ) : href ? (
        <Button
          asChild
          size="lg"
          variant={step.kind === "viewResults" ? "outline" : "default"}
          className="h-11 self-start px-4"
        >
          <Link href={href}>
            {step.action}
            <ArrowRightIcon aria-hidden />
          </Link>
        </Button>
      ) : null}
    </section>
  );
}

function RunStep({
  step,
  run,
  rankingHref,
  reasonId,
}: {
  step: NextStep;
  run: NonNullable<Props["run"]>;
  rankingHref?: string;
  reasonId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const confirm = step.confirm!;

  // The action is called directly rather than through useActionState: once it
  // succeeds the page refreshes with the next step, and this component may
  // unmount before an effect could show the toast.
  function go() {
    const formData = new FormData();
    if (run.open !== undefined) formData.set("open", String(run.open));
    setError(null);
    startTransition(async () => {
      const result = await run.action(null, formData);
      if (result?.ok) toast.success(result.message ?? "Saved.");
      else if (result?.formError && result.formError !== step.blocker) {
        setError(result.formError);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="lg"
            className="h-11 self-start px-4 motion-safe:transition-transform motion-safe:active:scale-[0.97]"
            disabled={pending || Boolean(step.blocker)}
            aria-describedby={step.blocker ? reasonId : undefined}
          >
            {pending ? "Saving…" : step.action}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2">
                <p>{confirm.description}</p>
                {step.note && <p className="text-foreground">{step.note}</p>}
                {step.kind === "publishResults" && rankingHref && (
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
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={go}>{confirm.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {step.blocker && (
        <p id={reasonId} className="text-sm text-muted-foreground">
          {step.blocker}
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
