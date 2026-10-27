// Judging criteria rules (docs/07 > lib/domain, docs/02 Decision 6). Pure
// functions: no Prisma or Next.js imports, so the save action, the criteria
// form and Vitest all share them.

export type CriterionInput = {
  name: string;
  weightPercent: number;
  maxScore: number;
};

export type CriterionField = keyof CriterionInput;

/** One broken rule. `row` and `field` are set when it belongs to one input. */
export type CriteriaIssue = {
  row?: number;
  field?: CriterionField;
  message: string;
};

export const CRITERIA_MESSAGES = {
  none: "Add at least one criterion.",
  duplicateName: "Each criterion needs a different name.",
  weight: "Weight must be a whole number from 1 to 100.",
  maxScore: "Max score must be a whole number of at least 1.",
  total: (total: number) =>
    `Weights must add up to 100%. They add up to ${total}% now.`,
  locked: "Criteria are locked because judges have started scoring.",
} as const;

/** The sum of the weights, ignoring anything that isn't a number yet. */
export function weightTotal(list: Pick<CriterionInput, "weightPercent">[]) {
  return list.reduce(
    (sum, { weightPercent }) =>
      sum + (Number.isFinite(weightPercent) ? weightPercent : 0),
    0,
  );
}

/**
 * The running total in words, so it never relies on colour (docs/08 >
 * Criteria and weights): "Total 90%: 10% left to assign".
 */
export function describeWeightTotal(total: number): string {
  if (total === 100) return "Total 100%: exactly 100%, ready to save";
  if (total < 100) return `Total ${total}%: ${100 - total}% left to assign`;
  return `Total ${total}%: ${total - 100}% over 100%`;
}

/**
 * Every rule a saved list must meet: at least one criterion, unique names
 * (ignoring case and surrounding spaces), whole-number weights from 1 to 100
 * that total exactly 100, and a whole-number max score of at least 1.
 * Returns no issues when the list can be saved.
 */
export function validateCriteria(list: CriterionInput[]): CriteriaIssue[] {
  if (list.length === 0) return [{ message: CRITERIA_MESSAGES.none }];

  const issues: CriteriaIssue[] = [];
  const rowsByName = new Map<string, number[]>();

  list.forEach((criterion, row) => {
    const key = criterion.name.trim().toLowerCase();
    rowsByName.set(key, [...(rowsByName.get(key) ?? []), row]);

    const { weightPercent, maxScore } = criterion;
    if (!Number.isInteger(weightPercent) || weightPercent < 1 || weightPercent > 100) {
      issues.push({ row, field: "weightPercent", message: CRITERIA_MESSAGES.weight });
    }
    if (!Number.isInteger(maxScore) || maxScore < 1) {
      issues.push({ row, field: "maxScore", message: CRITERIA_MESSAGES.maxScore });
    }
  });

  for (const rows of rowsByName.values()) {
    if (rows.length < 2) continue;
    for (const row of rows) {
      issues.push({ row, field: "name", message: CRITERIA_MESSAGES.duplicateName });
    }
  }

  const total = weightTotal(list);
  if (total !== 100) issues.push({ message: CRITERIA_MESSAGES.total(total) });

  return issues;
}

/** Criteria lock once any judge has scored any team in the event (Decision 6). */
export function isCriteriaLocked(scoreCount: number): boolean {
  return scoreCount > 0;
}
