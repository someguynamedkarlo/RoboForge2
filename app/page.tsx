import { AuthButton } from "@/components/auth-button";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // If user is logged in, redirect to home
  if (data.user != null) {
    redirect("/home");
  }

  return (
    <>
      <AuthButton />
    </>
  );
}
