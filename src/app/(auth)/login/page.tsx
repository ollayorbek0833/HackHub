import { connection } from "next/server";
import { Suspense } from "react";

import { LogoMark } from "@/components/brand/logo";
import { HardRedirect } from "@/components/auth/hard-redirect";
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

import Loading from "../loading";
import { login } from "./actions";

export const metadata = pageMetadata({
  title: "Log in",
  description: "Log in to HackHub to see your events, your team and your results.",
  path: "/login",
});

// docs/08 > /login. Open to everyone; a signed-in user goes to their role home
// (the proxy does this too, from the JWT; this check reads the database).
// The proxy handles a page load; a client-side visit (a tab still showing the
// signed-out header) gets here and leaves with a full load, which re-renders
// the header and tab bar (components/auth/hard-redirect).
// The session and searchParams are read inside this page's own Suspense:
// (auth)/loading.tsx is already on screen when someone follows the link
// between /login and /register, so it doesn't cover that navigation.
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <Suspense fallback={<Loading />}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  // Auth.js uses randomness before it reads the request: opt out of prerendering.
  await connection();
  const user = await getCurrentUser();
  if (user) return <HardRedirect href={ROLE_HOME[user.role]} />;

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
