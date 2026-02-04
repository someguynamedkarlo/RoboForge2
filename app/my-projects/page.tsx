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
  const user = data.user;

  if (!user) {
    redirect("/");
  }

  const projects = await getUserProjects(user.id);
  return (
    <>
      <Navbar />
      <main className="mt-40">
        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-30">
          <div
            className="bg-project-card w-100
       h-100  ml-30 rounded-3xl box-glow-primary flex items-center justify-center "
          >
            <Link
              href="/create-project"
              className="font-extrabold text-2xl hover:text-accent flex items-center gap-4 flex-col"
            >
              <Plus className="w-20 h-12 " />
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
      </main>
    </>
  );
}
