// Only the log in and log out actions may write the session cookie.
//
// Auth.js re-issues the JWT session cookie on every session read, and its
// proxy wrapper copies that Set-Cookie onto every response, prefetches
// included. A request that leaves while signed in and comes back after log out
// would then put the session cookie back, and the user would still be signed
// in. src/proxy.ts drops those headers with this function. Pure: no Next.js
// imports, so it runs in Vitest and in the proxy.

// authjs.session-token, the __Secure- one used over https, and the .0, .1 …
// chunks Auth.js splits a large token into.
const SESSION_COOKIE = /^(__Secure-)?authjs\.session-token(\.\d+)?=/;

/** Whether a Set-Cookie header value writes the Auth.js session cookie. */
export function isSessionCookie(setCookie: string): boolean {
  return SESSION_COOKIE.test(setCookie.trimStart());
}

/** The same response without any Set-Cookie for the session cookie. */
export function withoutSessionCookie(response: Response): Response {
  const setCookies = response.headers.getSetCookie();
  if (!setCookies.some(isSessionCookie)) return response;

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");
  for (const cookie of setCookies) {
    if (!isSessionCookie(cookie)) headers.append("set-cookie", cookie);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
