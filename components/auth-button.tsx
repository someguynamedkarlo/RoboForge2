import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { GoogleSignInButton } from "./google-sign";
import { GithubSignInButton } from "./github-sign";
export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="grid gap-2 w-0 ">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in with email</Link>
      </Button>
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/sign-up">Sign up with email</Link>
      </Button>
      <GoogleSignInButton />
      <GithubSignInButton />
    </div>
  );
}
