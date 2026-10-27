import { describe, expect, it } from "vitest";

import {
  eventSchema,
  parseDateInput,
  readEventForm,
  toDateInput,
  withDateOrderError,
} from "@/lib/validation/event";

// docs/08 > Event form, docs/06 TC-23, TC-24, TC-29.

const valid = {
  name: "Autumn Hack",
  description: "Build something useful in a weekend.",
  startDate: "2026-10-29",
  endDate: "2026-10-30",
  maxTeamSize: "4",
};

/** field → messages, the shape the form shows under each input. */
const errors = (input: unknown) => {
  const result = eventSchema.safeParse(input);
  if (result.success) return {};
  const byField: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    (byField[String(issue.path[0])] ??= []).push(issue.message);
  }
  return byField;
};

const TEAM_SIZE = "Team size must be a whole number from 1 to 10.";

describe("eventSchema", () => {
  it("accepts an event, trims text and turns dates into UTC midnight (TC-23)", () => {
    expect(
      eventSchema.parse({
        ...valid,
        name: "  Autumn Hack ",
        description: " Build something useful in a weekend. ",
        startDate: " 2026-10-29",
      }),
    ).toEqual({
      name: "Autumn Hack",
      description: "Build something useful in a weekend.",
      startDate: new Date("2026-10-29T00:00:00.000Z"),
      endDate: new Date("2026-10-30T00:00:00.000Z"),
      maxTeamSize: 4,
    });
  });

  it("accepts a same-day event (TC-24, Decision 5)", () => {
    const result = eventSchema.parse({ ...valid, endDate: valid.startDate });
    expect(result.endDate).toEqual(result.startDate);
  });

  it("needs every field (TC-23)", () => {
    expect(
      errors({ name: " ", description: "", startDate: "", endDate: "" }),
    ).toEqual({
      name: ["Enter the event name."],
      description: ["Add a description."],
      startDate: ["Choose a start date."],
      endDate: ["Choose an end date."],
    });
    expect(errors({})).toEqual({
      name: ["Enter the event name."],
      description: ["Add a description."],
      startDate: ["Choose a start date."],
      endDate: ["Choose an end date."],
    });
  });

  it("caps the name at 100 and the description at 2000 characters", () => {
    expect(
      errors({
        ...valid,
        name: "a".repeat(100),
        description: "a".repeat(2000),
      }),
    ).toEqual({});
    expect(
      errors({
        ...valid,
        name: "a".repeat(101),
        description: "a".repeat(2001),
      }),
    ).toEqual({
      name: ["Keep the name under 100 characters."],
      description: ["Keep the description under 2000 characters."],
    });
  });

  it("refuses dates that aren't real days (TC-29)", () => {
    for (const bad of ["29.10.2026", "2026-13-01", "2026-02-30", "tomorrow"]) {
      expect(errors({ ...valid, startDate: bad })).toEqual({
        startDate: ["Choose a start date."],
      });
    }
    expect(errors({ ...valid, startDate: "2028-02-29" })).toEqual({});
  });

  it("takes a whole team size from 1 to 10, default 4", () => {
    expect(eventSchema.parse({ ...valid, maxTeamSize: "1" }).maxTeamSize).toBe(
      1,
    );
    expect(eventSchema.parse({ ...valid, maxTeamSize: "10" }).maxTeamSize).toBe(
      10,
    );
    expect(eventSchema.parse({ ...valid, maxTeamSize: "" }).maxTeamSize).toBe(
      4,
    );
    expect(
      eventSchema.parse({ ...valid, maxTeamSize: undefined }).maxTeamSize,
    ).toBe(4);
    for (const bad of ["0", "11", "2.5", "-1", "four"]) {
      expect(errors({ ...valid, maxTeamSize: bad })).toEqual({
        maxTeamSize: [TEAM_SIZE],
      });
    }
  });
});

describe("parseDateInput and toDateInput", () => {
  it("round-trip a day without shifting it", () => {
    const date = parseDateInput("2026-10-29");
    expect(date).toEqual(new Date("2026-10-29T00:00:00.000Z"));
    expect(toDateInput(date!)).toBe("2026-10-29");
  });
});

describe("readEventForm", () => {
  it("reads every field as a string, missing ones as empty", () => {
    const formData = new FormData();
    formData.set("name", "Autumn Hack");
    formData.set("startDate", "2026-10-29");
    expect(readEventForm(formData)).toEqual({
      name: "Autumn Hack",
      description: "",
      startDate: "2026-10-29",
      endDate: "",
      maxTeamSize: "",
    });
  });
});

describe("withDateOrderError (TC-24)", () => {
  const END_BEFORE = ["The end date can't be before the start date."];

  it("adds the date-order error next to the schema's other errors", () => {
    expect(
      withDateOrderError(
        { maxTeamSize: [TEAM_SIZE] },
        { startDate: "2026-12-20", endDate: "2026-12-19" },
      ),
    ).toEqual({ maxTeamSize: [TEAM_SIZE], endDate: END_BEFORE });
  });

  it("leaves the errors alone when the order is fine or a date is missing", () => {
    const fieldErrors = { name: ["Enter the event name."] };
    expect(
      withDateOrderError(fieldErrors, {
        startDate: "2026-12-20",
        endDate: "2026-12-20",
      }),
    ).toEqual(fieldErrors);
    expect(
      withDateOrderError(fieldErrors, { startDate: "", endDate: "2026-12-19" }),
    ).toEqual(fieldErrors);
    expect(withDateOrderError(undefined, valid)).toEqual({});
  });
});
