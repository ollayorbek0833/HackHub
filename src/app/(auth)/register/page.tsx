import { redirect } from "next/navigation";
import { connection } from "next/server";

import { LogoMark } from "@/components/brand/logo";
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

import { register } from "./actions";

export const metadata = pageMetadata({
  title: "Create an account",
  description:
    "Create a free HackHub account to register for hackathons, form a team and submit your project.",
  path: "/register",
});

// docs/08 > /register. Signed-in users go to their role home. Rendered under
// (auth)/loading.tsx, so reading the session here is fine.
export default async function RegisterPage() {
  // Auth.js uses randomness before it reads the request: opt out of prerendering.
  await connection();
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

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
