import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data) {
    redirect("/");
  }

  return JSON.stringify(data, null, 2);
}

export default function ProtectedPage() {
  return (
    <>
      <Navbar />
    </>
  );
}
