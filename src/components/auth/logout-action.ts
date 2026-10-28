"use server";

import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { LOGGED_OUT_HREF } from "@/lib/auth/redirects";

/**
 * Ends the caller's session. Needs no authorization: it only deletes the
 * caller's own session cookie.
 *
 * <LogoutButton /> calls it with no arguments and then leaves with a full page
 * load itself (components/auth/logout-button). A form posted without
 * JavaScript passes its FormData, and gets the redirect here instead.
 */
export async function logout(form?: FormData): Promise<void> {
  await signOut({ redirect: false });
  if (form instanceof FormData) redirect(LOGGED_OUT_HREF);
}
