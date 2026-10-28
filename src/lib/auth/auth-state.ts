// Which auth state a tab was rendered with, and what to do when it may be
// stale (components/auth/auth-sync). The header and tab bar live in the root
// layout, which client-side navigation never re-renders, so a tab opened
// before a log in or log out elsewhere keeps the other state's shell until it
// reloads. Pure: no Next.js or Prisma imports, so it runs in Vitest.

import type { Role } from "@/generated/prisma/enums";

/** At most one server check per tab in this window. */
export const AUTH_CHECK_INTERVAL_MS = 30_000;

/** The localStorage entry every tab of the browser writes its state to. */
export const AUTH_STORAGE_KEY = "hackhub:auth";

/**
 * The auth state the shell depends on: "" for a visitor, otherwise the user
 * and their role (the nav is chosen by role, which can change without a new
 * log in).
 */
export function authStateKey(
  user: { id: string; role: Role } | null | undefined,
): string {
  return user ? `${user.id}:${user.role}` : "";
}

export type StaleCheck = "reload" | "ask-server" | "nothing";

/**
 * What a tab does when it comes back into view. `stored` is the state the
 * browser's newest tab rendered with (null when storage isn't available);
 * `lastCheck` is when this tab last asked the server (0 for never).
 */
export function staleCheck({
  rendered,
  stored,
  now,
  lastCheck,
}: {
  rendered: string;
  stored: string | null;
  now: number;
  lastCheck: number;
}): StaleCheck {
  // Another tab of this browser logged in or out: no request needed.
  if (stored !== null && stored !== rendered) return "reload";
  if (now - lastCheck < AUTH_CHECK_INTERVAL_MS) return "nothing";
  return "ask-server";
}
