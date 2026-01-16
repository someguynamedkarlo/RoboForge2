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
          redirectTo: `${window.location.origin}/auth/confirm`, // keep in-app flow
        },
      });
      if (error) {
        console.error(error);
        alert("Google sign-in failed. Check console for details.");
      }
    });

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
