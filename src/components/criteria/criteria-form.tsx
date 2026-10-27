"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/action-state";
import { describeWeightTotal, weightTotal } from "@/lib/domain/criteria";

export type CriterionRow = {
  name: string;
  weightPercent: number;
  maxScore: number;
};

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial: CriterionRow[];
};

/** A row as the inputs hold it: strings, so a half-typed number survives. */
type DraftRow = { key: number; name: string; weightPercent: string; maxScore: string };

const emptyRow = (key: number): DraftRow => ({
  key,
  name: "",
  weightPercent: "",
  maxScore: "10", // Decision 6: a new row's max score defaults to 10.
});

function toDraft(rows: CriterionRow[]): DraftRow[] {
  if (rows.length === 0) return [emptyRow(0)];
  return rows.map((row, key) => ({
    key,
    name: row.name,
    weightPercent: String(row.weightPercent),
    maxScore: String(row.maxScore),
  }));
}

type SavedState = ActionState | { ok: true; message?: string; saved: string };

const snapshot = (rows: Omit<DraftRow, "key">[]) =>
  JSON.stringify(rows.map(({ name, weightPercent, maxScore }) => [name, weightPercent, maxScore]));

const snapshotForm = (formData: FormData) => {
  const weights = formData.getAll("weightPercent");
  const maxScores = formData.getAll("maxScore");
  return snapshot(
    formData.getAll("name").map((name, i) => ({
      name: String(name),
      weightPercent: String(weights[i] ?? ""),
      maxScore: String(maxScores[i] ?? ""),
    })),
  );
};

/**
 * docs/08 > Criteria and weights: add and remove rows, a running total that
 * stays on screen while editing, and one save for the whole list. The server
 * checks every rule again; this form only helps.
 */
export function CriteriaForm({ action, initial }: Props) {
  // A successful result carries what was saved, to tell when there are
  // unsaved changes.
  const [state, formAction, pending] = useActionState(
    async (prev: SavedState, formData: FormData): Promise<SavedState> => {
      const result = await action(prev, formData);
      return result?.ok ? { ...result, saved: snapshotForm(formData) } : result;
    },
    null,
  );
  const [rows, setRows] = useState(() => toDraft(initial));
  const [initialSnapshot] = useState(() => snapshot(toDraft(initial)));
  const saved = state?.ok && "saved" in state ? state.saved : initialSnapshot;
  // Errors refer to row positions; once rows are added or removed they're stale.
  const [errorsStale, setErrorsStale] = useState(false);
  const nextKey = useRef(rows.length);
  const totalId = useId();

  const dirty = snapshot(rows) !== saved;
  const total = weightTotal(rows.map((r) => ({ weightPercent: Number(r.weightPercent) })));
  const failed = state?.ok === false ? state : null;
  const fieldErrors = errorsStale ? {} : (failed?.fieldErrors ?? {});

  useEffect(() => {
    if (state?.ok) toast.success("Criteria saved.");
  }, [state]);

  // "Discard your changes to the criteria?" when closing or reloading the tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (key: number, field: keyof Omit<DraftRow, "key">, value: string) =>
    setRows((current) => current.map((r) => (r.key === key ? { ...r, [field]: value } : r)));

  const addRow = () => {
    setRows((current) => [...current, emptyRow(nextKey.current++)]);
    setErrorsStale(true);
  };

  const removeRow = (key: number) => {
    setRows((current) => current.filter((r) => r.key !== key));
    setErrorsStale(true);
  };

  const errorsFor = (row: number, field: string) =>
    fieldErrors[`${row}.${field}`]?.map((message) => ({ message }));

  return (
    <form
      action={formAction}
      onSubmit={() => setErrorsStale(false)}
      noValidate
      className="flex flex-col gap-4"
    >
      {failed?.formError && !errorsStale && (
        <Alert variant="destructive">
          <AlertDescription>{failed.formError}</AlertDescription>
        </Alert>
      )}

      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Add at least one criterion.
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const nameErrors = errorsFor(index, "name");
          const weightErrors = errorsFor(index, "weightPercent");
          const maxErrors = errorsFor(index, "maxScore");
          const label = row.name.trim() || `criterion ${index + 1}`;
          return (
            <li
              key={row.key}
              className="grid gap-3 rounded-xl border bg-card p-4 text-card-foreground md:grid-cols-[1fr_8rem_8rem_auto] md:items-start"
            >
              <Field data-invalid={!!nameErrors}>
                <FieldLabel htmlFor={`name-${row.key}`}>Name</FieldLabel>
                <Input
                  id={`name-${row.key}`}
                  name="name"
                  value={row.name}
                  maxLength={60}
                  onChange={(e) => update(row.key, "name", e.target.value)}
                  className="h-11"
                  aria-invalid={!!nameErrors}
                />
                <FieldError errors={nameErrors} />
              </Field>
              <div className="grid grid-cols-2 gap-3 md:contents">
                <Field data-invalid={!!weightErrors}>
                  <FieldLabel htmlFor={`weight-${row.key}`}>Weight (%)</FieldLabel>
                  <Input
                    id={`weight-${row.key}`}
                    name="weightPercent"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    step={1}
                    value={row.weightPercent}
                    onChange={(e) => update(row.key, "weightPercent", e.target.value)}
                    className="h-11"
                    aria-invalid={!!weightErrors}
                    aria-describedby={totalId}
                  />
                  <FieldError errors={weightErrors} />
                </Field>
                <Field data-invalid={!!maxErrors}>
                  <FieldLabel htmlFor={`max-${row.key}`}>Max score</FieldLabel>
                  <Input
                    id={`max-${row.key}`}
                    name="maxScore"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={row.maxScore}
                    onChange={(e) => update(row.key, "maxScore", e.target.value)}
                    className="h-11"
                    aria-invalid={!!maxErrors}
                  />
                  <FieldError errors={maxErrors} />
                </Field>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeRow(row.key)}
                className="h-11 justify-self-start md:mt-6"
                aria-label={`Remove ${label}`}
              >
                <Trash2Icon aria-hidden />
                <span className="md:sr-only">Remove</span>
              </Button>
            </li>
          );
        })}
      </ol>

      <Button type="button" variant="outline" onClick={addRow} className="h-11 self-start">
        <PlusIcon aria-hidden />
        Add criterion
      </Button>

      {/* Sticky, so the total stays visible while editing, also on phone. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p id={totalId} aria-live="polite" className="text-sm font-medium">
          {total === 100 ? "✓ " : ""}
          {describeWeightTotal(total)}
        </p>
        <Button type="submit" disabled={pending} className="h-11 px-6">
          {pending ? "Saving…" : "Save criteria"}
        </Button>
      </div>
    </form>
  );
}
