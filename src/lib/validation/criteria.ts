import { z } from "zod";

import { CRITERIA_MESSAGES } from "@/lib/domain/criteria";

// Per-row rules and messages from docs/08 > Criteria and weights. Rules across
// rows (unique names, total 100, at least one) are in lib/domain/criteria.ts.

const wholeNumber = (message: string) =>
  z.coerce.number({ error: message }).int({ error: message });

export const criterionRowSchema = z.object({
  name: z
    .string({ error: "Enter a criterion name." })
    .trim()
    .min(1, "Enter a criterion name.")
    .max(60, "Keep the name to 60 characters or fewer."),
  weightPercent: wholeNumber(CRITERIA_MESSAGES.weight)
    .min(1, CRITERIA_MESSAGES.weight)
    .max(100, CRITERIA_MESSAGES.weight),
  maxScore: wholeNumber(CRITERIA_MESSAGES.maxScore).min(
    1,
    CRITERIA_MESSAGES.maxScore,
  ),
});

export const criteriaSchema = z.array(criterionRowSchema);

/** The raw rows of the criteria form: one name, weight and max score per row, in order. */
export function criteriaRowsFromFormData(formData: FormData) {
  const names = formData.getAll("name");
  const weights = formData.getAll("weightPercent");
  const maxScores = formData.getAll("maxScore");
  return names.map((name, i) => ({
    name: typeof name === "string" ? name : "",
    weightPercent: typeof weights[i] === "string" ? weights[i] : "",
    maxScore: typeof maxScores[i] === "string" ? maxScores[i] : "",
  }));
}

/** The key a row's error is stored under in `fieldErrors`, e.g. "2.weightPercent". */
export function rowErrorKey(row: number, field: string) {
  return `${row}.${field}`;
}

/** Zod issues as `fieldErrors` keyed by row and field. */
export function criteriaFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const [row, field] = issue.path;
    if (typeof row !== "number" || typeof field !== "string") continue;
    const key = rowErrorKey(row, field);
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}
