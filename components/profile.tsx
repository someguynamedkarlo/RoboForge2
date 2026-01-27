import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function Profile() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getUser();

  const user = data.user;
  const avatarUrl = (user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture) as string | undefined;

  return (
    <div className="flex items-center gap-4 my-4 mx-20">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full" />
      ) : (
        <img
          src={`https://ui-avatars.com/api/?name=${user?.user_metadata?.name ?? user?.email ?? "?"}`}
          alt=""
          className="w-8 h-8 rounded-full"
        />
      )}
      <LogoutButton />
    </div>
  );
}
