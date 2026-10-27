"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/action-state";

export type ScoreRow = {
  id: string;
  /** The input name, "score:<criterionId>". */
  field: string;
  name: string;
  weightPercent: number;
  maxScore: number;
  value: number | null;
};

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  criteria: ScoreRow[];
  /** "Last saved 26 Oct 2026, 14:05", or null before the first save. */
  lastSaved: string | null;
};

/**
 * docs/08 > Score a team: one whole-number input per criterion with its range
 * next to it. Criteria may be left empty ("In progress"). The server checks
 * every range again.
 */
export function ScoreForm({ action, criteria, lastSaved }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const [dirty, setDirty] = useState(false);
  const failed = state?.ok === false ? state : null;

  useEffect(() => {
    if (state?.ok) toast.success("Scores saved.");
  }, [state]);

  // "Leave without saving your scores?" when closing or reloading the tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form
      action={formAction}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
      noValidate
      className="flex flex-col gap-4"
    >
      {failed?.formError && (
        <Alert variant="destructive">
          <AlertDescription>{failed.formError}</AlertDescription>
        </Alert>
      )}

      <ul className="flex flex-col gap-3">
        {criteria.map((c) => {
          const errors = failed?.fieldErrors?.[c.field]?.map((message) => ({ message }));
          const rangeId = `${c.field}-range`;
          return (
            <li key={c.id}>
              <Field data-invalid={!!errors}>
                <FieldLabel htmlFor={c.field} className="flex-wrap">
                  {c.name}
                  <span className="font-normal text-muted-foreground">({c.weightPercent}%)</span>
                </FieldLabel>
                <div className="flex items-center gap-3">
                  <Input
                    id={c.field}
                    name={c.field}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={c.maxScore}
                    step={1}
                    defaultValue={failed?.values?.[c.field] ?? c.value ?? ""}
                    className="h-11 w-24"
                    aria-invalid={!!errors}
                    aria-describedby={rangeId}
                  />
                  <FieldDescription id={rangeId} className="tabular-nums">
                    0–{c.maxScore}
                  </FieldDescription>
                </div>
                <FieldError errors={errors} />
              </Field>
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-muted-foreground">
        {lastSaved ? `Last saved ${lastSaved}` : "Not saved yet. You can leave criteria empty and come back."}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" name="intent" value="save" disabled={pending} className="h-11 px-6">
          {pending ? "Saving…" : "Save scores"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="next"
          variant="outline"
          disabled={pending}
          className="h-11 px-6"
        >
          Save and go to next team
        </Button>
      </div>
    </form>
  );
}
