import { redirect } from "next/navigation";
import { connection } from "next/server";

import { LogoMark } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/dal";
import { ROLE_HOME } from "@/lib/auth/permissions";
import { safeCallbackUrl } from "@/lib/auth/redirects";
import { pageMetadata } from "@/lib/site";

import { login } from "./actions";

export const metadata = pageMetadata({
  title: "Log in",
  description: "Log in to HackHub to see your events, your team and your results.",
  path: "/login",
});

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
        {/* The app icon: the Podium H on an amber tile. */}
        <span className="mb-2 flex size-12 items-center justify-center rounded-[10.5px] bg-primary">
          <LogoMark size={34} variant="onPrimary" decorative />
        </span>
        <h1 className="text-page-title">Log in</h1>
        <CardDescription>Welcome back to HackHub.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm action={login} callbackUrl={safeCallbackUrl(callbackUrl)} />
      </CardContent>
    </Card>
  );
}
