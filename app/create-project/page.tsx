import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import ProjectForm from "@/components/ProjectForm";

export default async function CreateProjectPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/");

  return (
    <>
      <Navbar />
      <main className="pt-20 md:pt-24 pb-12 md:pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-bold text-2xl md:text-3xl text-white mb-2">
            Create New Project
          </h1>
          <p className="text-gray-400 mb-6 md:mb-8 text-sm">
            Share your robot build with the community
          </p>
          <ProjectForm />
        </div>
      </main>
    </>
  );
}
