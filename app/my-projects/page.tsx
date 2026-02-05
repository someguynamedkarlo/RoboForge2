import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getUserProjects } from "@/lib/supabase/projects";
import { ProjectCard } from "@/components/ProjectCard";

export default async function MyProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (!data.user) redirect("/");

  // dohvati projekte korisnika
  const projects = await getUserProjects(data.user.id);

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
            My Projects
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16">
            <div className="bg-project-card aspect-square rounded-3xl box-glow-primary flex items-center justify-center">
              <Link
                href="/create-project"
                className="font-extrabold text-xl md:text-2xl hover:text-accent flex items-center gap-4 flex-col text-white"
              >
                <Plus className="w-12 h-12 md:w-20 md:h-12" />
                Create new project
              </Link>
            </div>
            {projects.map((project) => (
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
