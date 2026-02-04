import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data) {
    redirect("/");
  }

  return JSON.stringify(data, null, 2);
}

export default function Home() {
  return (
    <>
      <Navbar />
    </>
  );
}
