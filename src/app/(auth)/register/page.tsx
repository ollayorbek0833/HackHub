import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { RegisterForm } from "@/components/auth/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/dal";
import { ROLE_HOME } from "@/lib/auth/permissions";

import { register } from "./actions";

export const metadata: Metadata = { title: "Create an account · HackHub" };

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
        <CardTitle className="text-2xl">Create an account</CardTitle>
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
