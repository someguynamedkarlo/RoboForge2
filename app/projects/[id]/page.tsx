import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) notFound();

  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, title, short_description, cover_image_url, wiring_diagram_url, total_cost, created_at",
    )
    .eq("id", id)
    .single();

  if (projectError || !project) {
    console.log("Get project error:", projectError);
    notFound();
  }

  const [{ data: components }, { data: steps }, { data: files }] =
    await Promise.all([
      supabase
        .from("project_components")
        .select("name, quantity, cost, link")
        .eq("project_id", project.id),
      supabase
        .from("project_steps")
        .select("step_order, title, instructions, image_url")
        .eq("project_id", project.id),
      supabase
        .from("project_files")
        .select("file_url, file_name, file_size, file_type")
        .eq("project_id", project.id),
    ]);

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-32 pb-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          {project.cover_image_url && (
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full rounded-2xl"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
            <p className="text-gray-300">{project.short_description}</p>
          </div>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Components</h2>
            <ul className="space-y-1 text-gray-300">
              {(components ?? []).map((c) => (
                <li key={c.name}>
                  {c.quantity}× {c.name} — ${c.cost?.toFixed(2) ?? "0.00"}{" "}
                  {c.link && (
                    <a
                      href={c.link}
                      className="text-accent underline ml-2"
                      target="_blank"
                      rel="noreferrer"
                    >
                      link
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Steps</h2>
            <ol className="space-y-4 list-decimal list-inside">
              {(steps ?? [])
                .sort((a, b) => a.step_order - b.step_order)
                .map((s) => (
                  <li key={s.step_order}>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-gray-300 whitespace-pre-line">
                      {s.instructions}
                    </p>
                    {s.image_url && (
                      <img
                        src={s.image_url}
                        alt={s.title}
                        className="mt-2 rounded-lg"
                      />
                    )}
                  </li>
                ))}
            </ol>
          </section>
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Files</h2>
            <ul className="space-y-1 text-gray-300">
              {(files ?? []).map((f) => (
                <li key={f.file_url}>
                  <a
                    href={f.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline"
                  >
                    {f.file_name}
                  </a>{" "}
                  <span className="text-xs text-gray-500">({f.file_type})</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
