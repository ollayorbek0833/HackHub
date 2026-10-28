import { connection } from "next/server";
import { Suspense } from "react";

import { LogoMark } from "@/components/brand/logo";
import { HardRedirect } from "@/components/auth/hard-redirect";
import { RegisterForm } from "@/components/auth/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/dal";
import { ROLE_HOME } from "@/lib/auth/permissions";
import { pageMetadata } from "@/lib/site";

import Loading from "../loading";
import { register } from "./actions";

export const metadata = pageMetadata({
  title: "Create an account",
  description:
    "Create a free HackHub account to register for hackathons, form a team and submit your project.",
  path: "/register",
});

// docs/08 > /register. Signed-in users go to their role home, with a full
// load so the header and tab bar re-render (as on /login). The session is read
// inside this page's own Suspense: (auth)/loading.tsx is already on screen
// when someone follows the link between /login and /register, so it doesn't
// cover that navigation.
export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Register />
    </Suspense>
  );
}

async function Register() {
  // Auth.js uses randomness before it reads the request: opt out of prerendering.
  await connection();
  const user = await getCurrentUser();
  if (user) return <HardRedirect href={ROLE_HOME[user.role]} />;

  return (
    <Card>
      <CardHeader>
        {/* The app icon: the Podium H on an amber tile. */}
        <span className="mb-2 flex size-12 items-center justify-center rounded-[10.5px] bg-primary">
          <LogoMark size={34} variant="onPrimary" decorative />
        </span>
        <h1 className="text-page-title">Create an account</h1>
        <CardDescription>
          Join HackHub to register for events, form a team and submit your
          project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm action={register} />
      </CardContent>
    </Card>
  );
}
