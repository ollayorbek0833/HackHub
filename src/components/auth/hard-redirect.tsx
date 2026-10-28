"use client";

import { useEffect } from "react";

/**
 * Leaves for `href` with a full page load. Used where a signed-in user is sent
 * away from a signed-out page (/login, /register, /): a client-side redirect()
 * keeps the root layout, so a tab rendered while signed out would show the
 * signed-out header and no tab bar over the signed-in page, or nothing at all.
 * The proxy redirects a fresh page load before it gets here; the meta refresh
 * covers a visitor without JavaScript anywhere else.
 */
export function HardRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);

  return (
    <noscript>
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
    </noscript>
  );
}
