import { describe, expect, it } from "vitest";

import {
  getActiveHref,
  getNavItems,
  getTabItems,
  PAGE_SECTIONS,
  pickActiveSection,
  sectionHref,
} from "./nav-items";

describe("getNavItems", () => {
  it("gives a visitor only All events", () => {
    expect(getNavItems(null)).toEqual([
      { label: "All events", href: "/events" },
    ]);
  });

  it("matches the docs/08 App shell table for each role", () => {
    expect(getNavItems("PARTICIPANT").map((i) => i.href)).toEqual([
      "/events",
      "/my-events",
    ]);
    expect(getNavItems("JUDGE").map((i) => i.href)).toEqual([
      "/judge",
      "/events",
    ]);
    expect(getNavItems("ORGANIZER").map((i) => i.href)).toEqual([
      "/organizer",
      "/organizer/users",
      "/events",
    ]);
  });
});

describe("getActiveHref", () => {
  const organizer = getNavItems("ORGANIZER");
  const participant = getNavItems("PARTICIPANT");

  it("marks the item for the current section", () => {
    expect(getActiveHref(participant, "/events")).toBe("/events");
    expect(getActiveHref(participant, "/events/abc/team")).toBe("/events");
    expect(getActiveHref(participant, "/my-events")).toBe("/my-events");
  });

  it("does not confuse /my-events with /events", () => {
    expect(getActiveHref(participant, "/my-events")).not.toBe("/events");
  });

  it("prefers the longest match for the organizer", () => {
    expect(getActiveHref(organizer, "/organizer")).toBe("/organizer");
    expect(getActiveHref(organizer, "/organizer/events/abc/criteria")).toBe(
      "/organizer",
    );
    expect(getActiveHref(organizer, "/organizer/users")).toBe(
      "/organizer/users",
    );
  });

  it("returns null when no item matches", () => {
    expect(getActiveHref(participant, "/profile")).toBeNull();
    expect(getActiveHref(participant, "/")).toBeNull();
  });
});

describe("getTabItems", () => {
  it("gives visitors no tab bar", () => {
    expect(getTabItems(null)).toEqual([]);
  });

  it("follows the redesign plan for each role", () => {
    expect(getTabItems("PARTICIPANT").map((t) => t.label)).toEqual([
      "Events",
      "My events",
      "Team",
      "Profile",
    ]);
    expect(getTabItems("ORGANIZER").map((t) => t.label)).toEqual([
      "Events",
      "Users",
      "Profile",
    ]);
    expect(getTabItems("JUDGE").map((t) => t.label)).toEqual([
      "Score",
      "Results",
      "Profile",
    ]);
  });

  it("points Team at the participant's current team, else My events", () => {
    const team = (opts?: { teamHref?: string }) =>
      getTabItems("PARTICIPANT", opts).find((t) => t.icon === "team")?.href;
    expect(team()).toBe("/my-events");
    expect(team({ teamHref: "/events/e1/team" })).toBe("/events/e1/team");
  });

  it("marks exactly one current tab", () => {
    const current = (role: "PARTICIPANT" | "ORGANIZER", path: string) =>
      getTabItems(role)
        .filter((t) => t.match(path))
        .map((t) => t.label);
    expect(current("PARTICIPANT", "/events/e1")).toEqual(["Events"]);
    expect(current("PARTICIPANT", "/events/e1/team")).toEqual(["Team"]);
    expect(current("PARTICIPANT", "/events/e1/team/submit")).toEqual(["Team"]);
    expect(current("PARTICIPANT", "/my-events")).toEqual(["My events"]);
    expect(current("ORGANIZER", "/organizer/events/e1/criteria")).toEqual([
      "Events",
    ]);
    expect(current("ORGANIZER", "/organizer/users")).toEqual(["Users"]);
  });
});

describe("page sections", () => {
  it("links the five landing sections, with no label twice in the visitor header", () => {
    expect(PAGE_SECTIONS.map((s) => s.id)).toEqual([
      "how-it-works",
      "for-organizers",
      "fair-judging",
      "happening-now",
      "faq",
    ]);
    const labels = [
      ...getNavItems(null).map((i) => i.label),
      ...PAGE_SECTIONS.map((s) => s.label),
    ];
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("is an in-page anchor on the landing page and a link to it elsewhere", () => {
    expect(sectionHref("faq", "/")).toBe("#faq");
    expect(sectionHref("faq", "/about")).toBe("/#faq");
    expect(sectionHref("faq", "/events/abc")).toBe("/#faq");
  });

  it("marks the first section crossing the band, or none", () => {
    expect(pickActiveSection(new Set())).toBeNull();
    expect(pickActiveSection(new Set(["faq"]))).toBe("faq");
    expect(pickActiveSection(new Set(["faq", "fair-judging"]))).toBe(
      "fair-judging",
    );
    // A section without a link (participants and judges) marks nothing.
    expect(pickActiveSection(new Set(["participants-judges"]))).toBeNull();
  });
});
