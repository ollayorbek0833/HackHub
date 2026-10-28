import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { authStateKey } from "@/lib/auth/auth-state";

import { AuthSyncClient } from "./auth-sync-client";

/**
 * Keeps a tab's shell in step with the session. The root layout renders it
 * next to the header (inside <Suspense>: it reads the session), so it carries
 * the same auth state the header and tab bar were rendered with.
 */
export async function AuthSync() {
  await connection();
  const user = await getCurrentUser();
  return <AuthSyncClient authKey={authStateKey(user)} />;
}
