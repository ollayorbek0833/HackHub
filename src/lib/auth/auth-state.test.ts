import { describe, expect, it } from "vitest";

import { AUTH_CHECK_INTERVAL_MS, authStateKey, staleCheck } from "./auth-state";

describe("authStateKey", () => {
  it("is empty for a visitor", () => {
    expect(authStateKey(null)).toBe("");
    expect(authStateKey(undefined)).toBe("");
  });

  it("changes with the user and with the role", () => {
    const participant = authStateKey({ id: "u1", role: "PARTICIPANT" });
    expect(participant).not.toBe("");
    expect(authStateKey({ id: "u1", role: "JUDGE" })).not.toBe(participant);
    expect(authStateKey({ id: "u2", role: "PARTICIPANT" })).not.toBe(
      participant,
    );
  });
});

describe("staleCheck", () => {
  const now = 1_000_000;

  it("reloads at once when another tab stored a different state", () => {
    expect(
      staleCheck({ rendered: "", stored: "u1:PARTICIPANT", now, lastCheck: now }),
    ).toBe("reload");
    expect(
      staleCheck({ rendered: "u1:PARTICIPANT", stored: "", now, lastCheck: now }),
    ).toBe("reload");
  });

  it("asks the server the first time, then at most once per interval", () => {
    expect(staleCheck({ rendered: "", stored: "", now, lastCheck: 0 })).toBe(
      "ask-server",
    );
    expect(
      staleCheck({
        rendered: "",
        stored: "",
        now,
        lastCheck: now - AUTH_CHECK_INTERVAL_MS + 1,
      }),
    ).toBe("nothing");
    expect(
      staleCheck({
        rendered: "",
        stored: "",
        now,
        lastCheck: now - AUTH_CHECK_INTERVAL_MS,
      }),
    ).toBe("ask-server");
  });

  it("falls back to the server when storage isn't available", () => {
    expect(
      staleCheck({ rendered: "u1:JUDGE", stored: null, now, lastCheck: 0 }),
    ).toBe("ask-server");
  });
});
