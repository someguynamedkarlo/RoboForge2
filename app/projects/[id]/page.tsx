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
      "id, title, short_description, logic_explanation, cover_image_url, wiring_diagram_url, total_cost, created_at, profiles(id, full_name, avatar_url)",
    )
    .eq("id", id)
    .single();

  if (projectError || !project) {
    console.log("Get project error:", projectError);
    notFound();
  }

  const profile = Array.isArray(project.profiles)
    ? project.profiles[0]
    : project.profiles;

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

  const allowedCodeExt = [".py", ".cpp", ".c", ".h", ".ino", ".js", ".ts"];
  const codePreviews = await Promise.all(
    (files ?? [])
      .filter((f) => {
        if (f.file_type !== "code") return false;
        const ext = `.${f.file_name.split(".").pop()?.toLowerCase() ?? ""}`;
        return allowedCodeExt.includes(ext);
      })
      .map(async (f) => {
        try {
          const res = await fetch(f.file_url);
          const text = await res.text();
          const preview = text.split("\n").slice(0, 50).join("\n");
          return { ...f, preview };
        } catch {
          return { ...f, preview: "Preview unavailable." };
        }
      }),
  );

  return (
    <>
      <Navbar />
      <main className="pb-12 text-white">
        {/* Hero cover image */}
        {project.cover_image_url && (
          <div className="relative w-full h-[80vh] md:h-[85vh]">
            <img
              src={project.cover_image_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 via-80% to-transparent" />
            {/* Title positioned at the fade */}
            <div className="absolute bottom-12 left-0 right-0">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end ">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg text-left">
                  {project.title}
                </h1>
              </div>
            </div>
          </div>
        )}

        <div
          className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${
            project.cover_image_url ? "pt-8" : "pt-24 md:pt-32"
          }`}
        >
          {!project.cover_image_url && (
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {project.title}
            </h1>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column - Description and content */}
            <div className="flex-1 space-y-6">
              <h2 className="text-xl">{project.short_description}</h2>

              <section className="space-y-2">
                <h2 className="text-3xl font-semibold ">Steps</h2>
                <ol className="space-y-5 list-none pl-0">
                  {(steps ?? [])
                    .sort((a, b) => a.step_order - b.step_order)
                    .map((s) => (
                      <li key={s.step_order} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-accent text-background font-bold flex items-center justify-center">
                            {s.step_order}
                          </span>
                          <p className="font-semibold text-lg">{s.title}</p>
                        </div>
                        <p className="text-gray-300 whitespace-pre-line ml-12">
                          {s.instructions}
                        </p>
                        {s.image_url && (
                          <img
                            src={s.image_url}
                            alt={s.title}
                            className="mt-2 ml-12 rounded-lg w-full max-w-xl object-cover"
                          />
                        )}
                      </li>
                    ))}
                </ol>
              </section>

              {project.wiring_diagram_url && (
                <section className="space-y-3">
                  <h2 className="text-2xl font-semibold">Wiring Diagram</h2>
                  {project.wiring_diagram_url.endsWith(".pdf") ? (
                    <a
                      href={project.wiring_diagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline"
                    >
                      View wiring diagram (PDF)
                    </a>
                  ) : (
                    <img
                      src={project.wiring_diagram_url}
                      alt="Wiring diagram"
                      className="rounded-lg border border-white/10 max-w-xl w-full object-contain"
                    />
                  )}
                </section>
              )}

              {project.logic_explanation && (
                <section className="space-y-2">
                  <h2 className="text-2xl font-semibold">Logic Explanation</h2>
                  <pre className="bg-white/5 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-200">
                    {project.logic_explanation}
                  </pre>
                </section>
              )}

              {codePreviews.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-2xl font-semibold">Code Preview</h2>
                  <div className="space-y-3">
                    {codePreviews.map((f) => (
                      <div
                        key={f.file_url}
                        className="bg-white/5 rounded-lg p-3 border border-white/10"
                      >
                        <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                          <span>{f.file_name}</span>
                          <a
                            href={f.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent underline"
                          >
                            Download
                          </a>
                        </div>
                        <pre className="bg-black/40 rounded-md p-0 text-xs overflow-auto max-h-64">
                          <div className="divide-y divide-white/5">
                            {f.preview.split("\n").map((line, i) => (
                              <div
                                key={i}
                                className="flex gap-3 px-3 py-1 text-left"
                              >
                                <span className="w-10 text-right text-gray-400 select-none">
                                  {i + 1}
                                </span>
                                <span className="whitespace-pre text-gray-100">
                                  {line || " "}
                                </span>
                              </div>
                            ))}
                          </div>
                        </pre>
                      </div>
                    ))}
                  </div>
                </section>
              )}

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
                      <span className="text-xs text-gray-500">
                        ({f.file_type})
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Right column - Author & Components */}
            <div className="lg:w-[22rem] space-y-4">
              {/* Author box with accent border and glow */}
              {profile && (
                <div className="border-2 border-accent rounded-xl p-4 shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] w-max">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name ?? "Author"}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold">
                        {profile.full_name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-400">Created by</p>
                      <p className="font-semibold">
                        {profile.full_name ?? "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Components box with accent border */}
              <div className="border-2 border-accent rounded-xl p-4">
                <h2 className="text-xl font-semibold mb-3">Components</h2>
                <ul className="space-y-2 text-gray-300 text-sm">
                  {(components ?? []).map((c, idx) => (
                    <li
                      key={`${c.name}-${idx}`}
                      className="flex justify-between items-start"
                    >
                      <span>
                        {c.quantity}× {c.name}
                      </span>
                      <span className="text-right">
                        ${c.cost?.toFixed(2) ?? "0.00"}
                        {c.link && (
                          <a
                            href={c.link}
                            className="text-accent underline ml-2"
                            target="_blank"
                            rel="noreferrer"
                          >
                            ↗
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                {project.total_cost && (
                  <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${project.total_cost.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
