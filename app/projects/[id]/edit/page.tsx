import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProjectForm from "@/components/ProjectForm";
import { createClient } from "@/lib/supabase/server";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/");

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, title, short_description, logic_explanation, cover_image_url, wiring_diagram_url, video_url",
    )
    .eq("id", id)
    .single();

  if (!project) notFound();

  const [{ data: components }, { data: steps }, { data: files }] =
    await Promise.all([
    supabase
      .from("project_components")
      .select("name, quantity, cost, link")
      .eq("project_id", id),
    supabase
      .from("project_steps")
      .select("step_order, title, instructions, image_url")
      .eq("project_id", id),
      supabase
        .from("project_files")
        .select("id, file_url, file_name, file_size, file_type")
        .eq("project_id", id),
    ]);

  return (
    <>
      <Navbar />
      <main className="pt-20 md:pt-24 pb-12 md:pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-bold text-2xl md:text-3xl text-white mb-2">
            Edit Project
          </h1>
          <p className="text-gray-400 mb-6 md:mb-8 text-sm">
            Update your robot build details
          </p>
          <ProjectForm
            projectId={project.id}
            initialData={{
              title: project.title,
              shortDescription: project.short_description ?? "",
              coverImageUrl: project.cover_image_url,
              wiringDiagramUrl: project.wiring_diagram_url,
              logicExplanation: project.logic_explanation ?? "",
              videoUrl: project.video_url ?? "",
              components: (components ?? []).map((c) => ({
                id: crypto.randomUUID(),
                name: c.name,
                quantity: c.quantity,
                cost: c.cost,
                link: c.link,
              })),
              steps: (steps ?? []).map((s) => ({
                title: s.title,
                instructions: s.instructions,
                imageUrl: s.image_url,
                image: null,
              })),
              existingCodeFiles: (files ?? [])
                .filter((f) => f.file_type === "code")
                .map((f) => ({
                  id: f.id,
                  url: f.file_url,
                  name: f.file_name ?? "Code file",
                  size: f.file_size ?? 0,
                  type: "code" as const,
                })),
              existingMiscFiles: (files ?? [])
                .filter((f) => f.file_type === "misc")
                .map((f) => ({
                  id: f.id,
                  url: f.file_url,
                  name: f.file_name ?? "File",
                  size: f.file_size ?? 0,
                  type: "misc" as const,
                })),
            }}
          />
        </div>
      </main>
    </>
  );
}
