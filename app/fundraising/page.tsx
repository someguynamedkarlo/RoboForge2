import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FundraisingCard } from "@/components/FundraisingCard";

export default async function FundraisingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) redirect("/");

  // uzmi fundraising projekte
  const { data: fundraising = [] } = await supabase
    .from("fundraising_projects")
    .select(
      "id, profile_id, project_name, short_description, long_description, amount_needed, donation_link, payment_info, image_urls, created_at",
    )
    .order("created_at", { ascending: false });
  const fundraisingList = fundraising ?? [];

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center flex-col justify-start gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Fundraising
              </h1>
              <p className="text-gray-400">
                Submit a funding request and explore current campaigns.
              </p>
            </div>
            <Link
              href="/fundraising/new"
              className="px-4 py-2 bg-[#23d18b] text-[#0b0c0e] font-semibold rounded-md hover:bg-[#23d18b]/90 transition-colors cursor-pointer whitespace-nowrap"
            >
              Ask funding
            </Link>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Active fundraising projects
            </h2>
            {fundraisingList.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No fundraising projects yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16">
                {fundraisingList.map((f) => {
                  const image =
                    Array.isArray(f.image_urls) && f.image_urls.length > 0
                      ? f.image_urls[0]
                      : null;
                  return (
                    <FundraisingCard
                      key={f.id}
                      fundraisingId={f.id}
                      title={f.project_name}
                      description={f.short_description}
                      coverImageUrl={image}
                      amountNeeded={f.amount_needed}
                      isOwner={f.profile_id === data.user.id}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
