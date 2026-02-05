"use client";

import { useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  const handleClick = () =>
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) {
        console.error(error);
        alert("Google prijava nije uspjela.");
      }
    });

  return (
    <Button
      variant="outline"
      size="lg"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
