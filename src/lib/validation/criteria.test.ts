import { describe, expect, it } from "vitest";

import {
  criteriaFieldErrors,
  criteriaRowsFromFormData,
  criteriaSchema,
} from "./criteria";

function form(rows: [string, string, string][]) {
  const data = new FormData();
  for (const [name, weight, max] of rows) {
    data.append("name", name);
    data.append("weightPercent", weight);
    data.append("maxScore", max);
  }
  return data;
}

describe("criteriaSchema", () => {
  it("parses rows in order, trimming names and coercing numbers", () => {
    const rows = criteriaRowsFromFormData(
      form([
        [" Innovation ", "60", "10"],
        ["Pitch", "40", "5"],
      ]),
    );
    expect(criteriaSchema.parse(rows)).toEqual([
      { name: "Innovation", weightPercent: 60, maxScore: 10 },
      { name: "Pitch", weightPercent: 40, maxScore: 5 },
    ]);
  });

  it("puts each message on its row and field (TC-59)", () => {
    const rows = criteriaRowsFromFormData(
      form([
        ["", "120", "0"],
        ["Pitch", "1.5", "abc"],
        ["x".repeat(61), "", "10"],
      ]),
    );
    const result = criteriaSchema.safeParse(rows);
    expect(result.success).toBe(false);
    expect(criteriaFieldErrors(result.error!)).toEqual({
      "0.name": ["Enter a criterion name."],
      "0.weightPercent": ["Weight must be a whole number from 1 to 100."],
      "0.maxScore": ["Max score must be a whole number of at least 1."],
      "1.weightPercent": ["Weight must be a whole number from 1 to 100."],
      "1.maxScore": ["Max score must be a whole number of at least 1."],
      "2.name": ["Keep the name to 60 characters or fewer."],
      "2.weightPercent": ["Weight must be a whole number from 1 to 100."],
    });
  });
});
