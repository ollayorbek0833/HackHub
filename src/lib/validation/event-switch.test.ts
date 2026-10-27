import { describe, expect, it } from "vitest";

import { eventSwitchSchema } from "@/lib/validation/event-switch";

describe("eventSwitchSchema", () => {
  it("reads open as a boolean", () => {
    expect(eventSwitchSchema.parse({ open: "true" })).toEqual({ open: true });
    expect(eventSwitchSchema.parse({ open: "false" })).toEqual({ open: false });
  });

  it("refuses anything else", () => {
    expect(eventSwitchSchema.safeParse({ open: "on" }).success).toBe(false);
    expect(eventSwitchSchema.safeParse({ open: null }).success).toBe(false);
  });
});
