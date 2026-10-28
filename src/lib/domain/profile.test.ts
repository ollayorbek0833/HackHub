import { describe, expect, it } from "vitest";

import type { Role } from "@/generated/prisma/enums";
import { canSeePhone } from "@/lib/domain/profile";

const view = (
  viewerId: string,
  viewerRole: Role,
  ownerId: string,
  ownerRegisteredWithViewerEvent = false,
) =>
  canSeePhone({
    viewerId,
    viewerRole,
    ownerId,
    ownerRegisteredWithViewerEvent,
  });

describe("canSeePhone", () => {
  it("lets the owner see their own phone", () => {
    expect(view("a", "PARTICIPANT", "a")).toBe(true);
    expect(view("j", "JUDGE", "j")).toBe(true);
    expect(view("o", "ORGANIZER", "o")).toBe(true);
  });

  it("lets the organizer of an event the owner registered for see it", () => {
    expect(view("o", "ORGANIZER", "a", true)).toBe(true);
  });

  it("hides it from an organizer whose events the owner isn't registered for", () => {
    expect(view("o2", "ORGANIZER", "a", false)).toBe(false);
  });

  it("hides it from other participants and judges", () => {
    expect(view("b", "PARTICIPANT", "a")).toBe(false);
    expect(view("j", "JUDGE", "a")).toBe(false);
  });

  it("never lets a shared event alone reveal it to a participant or judge", () => {
    expect(view("b", "PARTICIPANT", "a", true)).toBe(false);
    expect(view("j", "JUDGE", "a", true)).toBe(false);
  });
});
