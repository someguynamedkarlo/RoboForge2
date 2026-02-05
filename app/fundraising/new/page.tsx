import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { FundraisingForm } from "@/components/FundraisingForm";

export default async function NewFundraisingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/");

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Ask funding for your project
          </h1>
          <p className="text-gray-400">
            Describe what you’re building, why you need support, and how to
            donate.
          </p>
          <FundraisingForm />
        </div>
      </main>
    </>
  );
}
