// Path rules shared by src/proxy.ts and the login action (docs/07 > What
// src/proxy.ts may and may not do). Pure functions: no Next.js or Prisma
// imports, so they run in Vitest and in the proxy.

/** Pages a signed-out visitor is sent to /login from. */
const PROTECTED: RegExp[] = [
  /^\/my-events(\/|$)/,
  /^\/profile(\/|$)/,
  /^\/events\/[^/]+\/team(\/|$)/,
  /^\/judge(\/|$)/,
  /^\/organizer(\/|$)/,
];

/** Whether a path needs a signed-in user. The page still checks the role. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED.some((pattern) => pattern.test(pathname));
}

/** /login and /register: a signed-in user goes to their role home instead. */
export function isAuthPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

/**
 * Whether a request is a page load (typing a URL, a reload, a link without the
 * App Router), as opposed to the App Router fetching a page for a client-side
 * navigation or a prefetch. Next.js hides its own "rsc" header from the proxy,
 * so this reads what the browser sends: Sec-Fetch-Mode "navigate", or, from a
 * browser without it, an Accept that asks for HTML (the router's fetch sends
 * none, so it gets the default "*\/*").
 */
export function isPageLoad(headers: Headers): boolean {
  const mode = headers.get("sec-fetch-mode");
  if (mode) return mode === "navigate";
  return (headers.get("accept") ?? "").includes("text/html");
}

/**
 * The callbackUrl if it is a path on this site, otherwise null. "//evil.com"
 * and "/\evil.com" are other sites to a browser, so they are refused.
 */
export function safeCallbackUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  // Control characters (a tab or newline inside "/\t/evil.com") are dropped
  // by browsers, which would turn the path into "//evil.com".
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}
