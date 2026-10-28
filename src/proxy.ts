import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ROLE_HOME } from "@/lib/auth/permissions";
import {
  isAuthPath,
  isPageLoad,
  isProtectedPath,
} from "@/lib/auth/redirects";
import { withoutSessionCookie } from "@/lib/auth/session-cookie";

// Optimistic redirects only (docs/07 > What src/proxy.ts may and may not do).
// It reads the session cookie and nothing else: no database queries and no
// role checks. A stale JWT role would bounce a judge promoted a minute ago, so
// the role is checked by requireRole() in every page and action instead.
const redirects = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const signedIn = Boolean(req.auth?.user);

  if (!signedIn && isProtectedPath(pathname)) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // Page loads only. A client-side visit keeps the root layout, so a tab still
  // showing the signed-out header would keep it over the signed-in home (or
  // show a blank page from a stale prefetch). The page sends those on with a
  // full load instead (components/auth/hard-redirect).
  if (signedIn && isAuthPath(pathname) && isPageLoad(req.headers)) {
    const role = req.auth?.user?.role;
    return NextResponse.redirect(
      new URL(role ? ROLE_HOME[role] : "/", req.nextUrl),
    );
  }

  return NextResponse.next();
});

// Reading the cookie must never write it. Auth.js re-issues the session cookie
// on every read, so a prefetch that left before log out would put the cookie
// back when it lands, and the user would still be signed in
// (lib/auth/session-cookie.ts). Only the log in and log out actions set it, so
// a session lasts 30 days from log in.
export default async function proxy(...args: Parameters<typeof redirects>) {
  const response = await redirects(...args);
  return response && withoutSessionCookie(response);
}

export const config = {
  // Skip api routes, Next.js internals and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
