import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";
import { GoogleSignInButton } from "./google-sign";
import { GithubSignInButton } from "./github-sign";
export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getUser();

  const user = data.user;

  return user ? (
    <div className="flex items-center gap-4 ">
      <img
        src={user?.user_metadata?.avatar_url}
        alt=""
        className="w-8 h-8 rounded-full"
      />
      <LogoutButton />
    </div>
  ) : (
    <div className="grid gap-2 ">
      <GoogleSignInButton />
      <GithubSignInButton />
    </div>
  );
}
