import { describe, expect, it } from "vitest";

import { isSessionCookie, withoutSessionCookie } from "./session-cookie";

describe("isSessionCookie", () => {
  it("matches the session cookie over http and https, and its chunks", () => {
    for (const value of [
      "authjs.session-token=abc; Path=/; HttpOnly; SameSite=Lax",
      "__Secure-authjs.session-token=abc; Path=/; Secure",
      "authjs.session-token.0=abc; Path=/",
      "__Secure-authjs.session-token.12=abc; Path=/",
      "authjs.session-token=; Path=/; Max-Age=0",
    ]) {
      expect(isSessionCookie(value), value).toBe(true);
    }
  });

  it("leaves every other cookie alone", () => {
    for (const value of [
      "authjs.csrf-token=abc; Path=/",
      "__Host-authjs.csrf-token=abc; Path=/",
      "authjs.callback-url=%2F; Path=/",
      "my-authjs.session-token=abc; Path=/",
      "authjs.session-tokens=abc; Path=/",
    ]) {
      expect(isSessionCookie(value), value).toBe(false);
    }
  });
});

describe("withoutSessionCookie", () => {
  it("drops a re-issued session cookie and keeps the rest of the response", async () => {
    const headers = new Headers({ "x-middleware-next": "1" });
    headers.append("set-cookie", "authjs.session-token=new; Path=/; HttpOnly");
    headers.append("set-cookie", "authjs.csrf-token=abc; Path=/");
    headers.append("set-cookie", "authjs.session-token.1=new; Path=/");
    const response = withoutSessionCookie(
      new Response("body", { status: 307, statusText: "Redirect", headers }),
    );

    expect(response.headers.getSetCookie()).toEqual([
      "authjs.csrf-token=abc; Path=/",
    ]);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.status).toBe(307);
    expect(response.statusText).toBe("Redirect");
    expect(await response.text()).toBe("body");
  });

  it("returns the same response when it sets no session cookie", () => {
    const response = new Response(null, {
      headers: { "set-cookie": "authjs.csrf-token=abc; Path=/" },
    });
    expect(withoutSessionCookie(response)).toBe(response);
  });
});
