import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/dal";
import { ROLE_HOME } from "@/lib/auth/permissions";
import { safeCallbackUrl } from "@/lib/auth/redirects";

import { login } from "./actions";

export const metadata: Metadata = { title: "Log in · HackHub" };

// docs/08 > /login. Open to everyone; a signed-in user goes to their role home
// (the proxy does this too, from the JWT; this check reads the database).
// Rendered under (auth)/loading.tsx, so reading the session here is fine.
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Auth.js uses randomness before it reads the request: opt out of prerendering.
  await connection();
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  const { callbackUrl } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Log in</CardTitle>
        <CardDescription>Welcome back to HackHub.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm action={login} callbackUrl={safeCallbackUrl(callbackUrl)} />
      </CardContent>
    </Card>
  );
}
