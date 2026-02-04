import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import { ProjectCard } from "@/components/ProjectCard";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user;

  if (error || !user) {
    redirect("/");
  }
  //
  const { data: projects = [] } = await supabase
    .from("projects")
    .select("id, title, short_description, cover_image_url, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
            Explore Projects
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16">
            {(projects ?? []).map((project) => (
              <ProjectCard
                key={project.id}
                projectId={project.id}
                title={project.title}
                description={project.short_description}
                coverImageUrl={project.cover_image_url}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
