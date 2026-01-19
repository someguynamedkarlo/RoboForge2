import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function Profile() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getUser();

  const user = data.user;

  return (
    <div className="flex items-center gap-4 my-4 mx-20">
      <img
        src={user?.user_metadata?.avatar_url}
        alt=""
        className="w-8 h-8 rounded-full"
      />
    </div>
  );
}
