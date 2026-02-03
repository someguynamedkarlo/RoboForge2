import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Link from "next/link";

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
      <main className="mt-40">
        <div
          className="bg-project-card w-100
       h-90  ml-30 rounded-3xl box-glow-primary flex items-center justify-center"
        >
          <Link
            href="/create-project"
            className="font-extrabold text-2xl hover:text-accent "
          >
            Create new project
          </Link>
        </div>
      </main>
    </>
  );
}
