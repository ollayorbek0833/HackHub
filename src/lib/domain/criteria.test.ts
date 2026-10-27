import { describe, expect, it } from "vitest";

import {
  CRITERIA_MESSAGES,
  describeWeightTotal,
  isCriteriaLocked,
  validateCriteria,
  weightTotal,
  type CriterionInput,
} from "./criteria";

const row = (
  name: string,
  weightPercent: number,
  maxScore = 10,
): CriterionInput => ({ name, weightPercent, maxScore });

describe("validateCriteria", () => {
  it("accepts weights that total exactly 100 (TC-60)", () => {
    expect(
      validateCriteria([row("Innovation", 40), row("Design", 35), row("Pitch", 25)]),
    ).toEqual([]);
    expect(validateCriteria([row("Everything", 100, 1)])).toEqual([]);
  });

  it("needs at least one criterion", () => {
    expect(validateCriteria([])).toEqual([{ message: CRITERIA_MESSAGES.none }]);
  });

  it("refuses a total under or over 100 and says what it is (TC-63)", () => {
    expect(validateCriteria([row("A", 50), row("B", 40)])).toEqual([
      { message: "Weights must add up to 100%. They add up to 90% now." },
    ]);
    expect(validateCriteria([row("A", 60), row("B", 50)])).toEqual([
      { message: "Weights must add up to 100%. They add up to 110% now." },
    ]);
  });

  it("refuses weights outside 1–100 or not whole", () => {
    const issues = validateCriteria([row("A", 0), row("B", 100.5), row("C", -0.5)]);
    expect(issues.filter((i) => i.field === "weightPercent").map((i) => i.row)).toEqual([
      0, 1, 2,
    ]);
    expect(validateCriteria([row("A", 101), row("B", -1)])[0]).toEqual({
      row: 0,
      field: "weightPercent",
      message: CRITERIA_MESSAGES.weight,
    });
  });

  it("refuses a max score below 1 or not whole (Decision 6)", () => {
    expect(validateCriteria([row("A", 50, 0), row("B", 50, 2.5)])).toEqual([
      { row: 0, field: "maxScore", message: CRITERIA_MESSAGES.maxScore },
      { row: 1, field: "maxScore", message: CRITERIA_MESSAGES.maxScore },
    ]);
  });

  it("marks every row with a repeated name, ignoring case and spaces", () => {
    expect(validateCriteria([row("Design", 50), row(" design ", 30), row("Pitch", 20)])).toEqual([
      { row: 0, field: "name", message: CRITERIA_MESSAGES.duplicateName },
      { row: 1, field: "name", message: CRITERIA_MESSAGES.duplicateName },
    ]);
  });
});

describe("weightTotal and describeWeightTotal", () => {
  it("adds the weights, ignoring blanks", () => {
    expect(weightTotal([row("A", 30), row("B", Number.NaN), row("C", 60)])).toBe(90);
  });

  it("says in words what is left or over", () => {
    expect(describeWeightTotal(90)).toBe("Total 90%: 10% left to assign");
    expect(describeWeightTotal(100)).toBe("Total 100%: exactly 100%, ready to save");
    expect(describeWeightTotal(120)).toBe("Total 120%: 20% over 100%");
  });
});

describe("isCriteriaLocked (TC-61)", () => {
  it("locks once any score exists", () => {
    expect(isCriteriaLocked(0)).toBe(false);
    expect(isCriteriaLocked(1)).toBe(true);
  });
});
