import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ROLE_HOME } from "@/lib/auth/permissions";
import { isAuthPath, isProtectedPath } from "@/lib/auth/redirects";

// Optimistic redirects only (docs/07 > What src/proxy.ts may and may not do).
// It reads the session cookie and nothing else: no database queries and no
// role checks. A stale JWT role would bounce a judge promoted a minute ago, so
// the role is checked by requireRole() in every page and action instead.
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const signedIn = Boolean(req.auth?.user);

  if (!signedIn && isProtectedPath(pathname)) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (signedIn && isAuthPath(pathname)) {
    const role = req.auth?.user?.role;
    return NextResponse.redirect(
      new URL(role ? ROLE_HOME[role] : "/", req.nextUrl),
    );
  }

  return NextResponse.next();
});

export const config = {
  // Skip api routes, Next.js internals and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
