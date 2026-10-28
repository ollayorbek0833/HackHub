import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { authStateKey } from "@/lib/auth/auth-state";

// Read only, for components/auth/auth-sync: a tab that comes back into view
// asks whether the session still matches the shell it was rendered with. One
// indexed query, at most once per 30 s per tab. auth() here only reads the
// cookie; unlike /api/auth/session it never re-issues it (src/proxy.ts).
export async function GET() {
  // Auth.js uses randomness before it reads the request: never prerender.
  await connection();
  const user = await getCurrentUser();
  return Response.json(
    { key: authStateKey(user) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
