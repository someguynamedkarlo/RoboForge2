import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { FundraisingForm } from "@/components/FundraisingForm";
import { createClient } from "@/lib/supabase/server";

export default async function EditFundraisingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/");

  const { data: fundraising } = await supabase
    .from("fundraising_projects")
    .select(
      "id, profile_id, project_name, short_description, long_description, amount_needed, donation_link, payment_info, image_urls",
    )
    .eq("id", id)
    .single();

  if (!fundraising) notFound();

  // provjeri vlasništvo ili admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  if (fundraising.profile_id !== auth.user.id && !isAdmin) {
    redirect("/fundraising");
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Edit Fundraising Project
          </h1>
          <p className="text-gray-400">Update your funding request details.</p>
          <FundraisingForm
            fundraisingId={fundraising.id}
            initialData={{
              projectName: fundraising.project_name,
              shortDescription: fundraising.short_description ?? "",
              longDescription: fundraising.long_description ?? "",
              amountNeeded: String(fundraising.amount_needed ?? ""),
              paymentInfo: fundraising.payment_info ?? "",
              donationLink: fundraising.donation_link ?? "",
              imageUrls: Array.isArray(fundraising.image_urls)
                ? fundraising.image_urls
                : [],
            }}
          />
        </div>
      </main>
    </>
  );
}
