import { describe, expect, it } from "vitest";

import { scoreFieldName, scoresFormInput, scoresFormSchema } from "./scoring";

describe("scoresFormSchema", () => {
  it("collects the score fields by criterion id, and the button used", () => {
    const data = new FormData();
    data.append(scoreFieldName("c1"), "7");
    data.append(scoreFieldName("c2"), "");
    data.append("intent", "next");
    data.append("other", "ignored");
    expect(scoresFormSchema.parse(scoresFormInput(data))).toEqual({
      scores: { c1: "7", c2: "" },
      intent: "next",
    });
  });

  it("defaults to a plain save and refuses a file instead of text", () => {
    const data = new FormData();
    expect(scoresFormSchema.parse(scoresFormInput(data)).intent).toBe("save");
    data.append(scoreFieldName("c1"), new Blob(["x"]));
    expect(scoresFormSchema.safeParse(scoresFormInput(data)).success).toBe(false);
  });
});
