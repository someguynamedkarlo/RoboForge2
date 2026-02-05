import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export default async function FundraisingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/");

  const { data: fundraising } = await supabase
    .from("fundraising_projects")
    .select(
      "id, project_name, short_description, long_description, amount_needed, donation_link, payment_info, image_urls, created_at",
    )
    .eq("id", id)
    .single();

  if (!fundraising) notFound();

  const images =
    Array.isArray(fundraising.image_urls) && fundraising.image_urls.length > 0
      ? fundraising.image_urls
      : [];

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-28 pb-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-3xl font-bold">
                {fundraising.project_name}
              </h1>
              <p className="text-gray-400 mt-2">
                {fundraising.short_description}
              </p>
            </div>
            <span className="text-lg text-accent font-semibold">
              ${Number(fundraising.amount_needed || 0).toFixed(2)}
            </span>
          </div>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Details</h2>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">
              {fundraising.long_description}
            </p>
          </section>
          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {images.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt={fundraising.project_name}
                  className="w-full rounded-xl object-cover border border-white/10"
                />
              ))}
            </div>
          )}
          <section className="space-y-1">
            <h2 className="text-xl font-semibold">Payment info</h2>
            <p className="text-sm text-gray-200">{fundraising.payment_info}</p>
          </section>

          {fundraising.donation_link && (
            <a
              href={fundraising.donation_link}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-4 py-2 bg-[#23d18b] text-[#0b0c0e] font-semibold rounded-md hover:bg-[#23d18b]/90 transition-colors cursor-pointer"
            >
              Donate
            </a>
          )}
        </div>
      </main>
    </>
  );
}
