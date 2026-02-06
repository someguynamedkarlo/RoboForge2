import { createClient } from "./client";

// obriši fundraising projekt
export async function deleteFundraisingProject(
  fundraisingId: string,
  profileId: string,
  isAdmin = false,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  if (!isAdmin) {
    const { data: project } = await supabase
      .from("fundraising_projects")
      .select("profile_id")
      .eq("id", fundraisingId)
      .single();

    if (!project || project.profile_id !== profileId) {
      return { success: false, error: "Neautorizirano" };
    }
  }

  // obriši slike iz storage-a
  const { data: project } = await supabase
    .from("fundraising_projects")
    .select("image_urls")
    .eq("id", fundraisingId)
    .single();

  if (project?.image_urls && Array.isArray(project.image_urls)) {
    const prefix = "/storage/v1/object/public/images/";
    const paths = project.image_urls
      .map((url: string) => {
        const idx = url.indexOf(prefix);
        if (idx !== -1) return url.slice(idx + prefix.length).split("?")[0];
        return null;
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await supabase.storage.from("images").remove(paths);
    }
  }

  const { error } = await supabase
    .from("fundraising_projects")
    .delete()
    .eq("id", fundraisingId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ažuriraj fundraising projekt
export async function updateFundraisingProject(
  fundraisingId: string,
  data: {
    projectName: string;
    shortDescription: string;
    longDescription: string;
    amountNeeded: number;
    paymentInfo: string;
    donationLink: string;
  },
  newImages: File[],
  existingImageUrls: string[],
  removedImageUrls: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // obriši uklonjene slike iz storage-a
    if (removedImageUrls.length > 0) {
      const prefix = "/storage/v1/object/public/images/";
      const paths = removedImageUrls
        .map((url) => {
          const idx = url.indexOf(prefix);
          if (idx !== -1) return url.slice(idx + prefix.length).split("?")[0];
          return null;
        })
        .filter(Boolean) as string[];

      if (paths.length > 0) {
        await supabase.storage.from("images").remove(paths);
      }
    }

    // upload novih slika
    const uploadedUrls: string[] = [];
    for (const img of newImages) {
      const ext = img.name.split(".").pop();
      const path = `fundraising/${fundraisingId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("images")
        .upload(path, img);
      if (!error) {
        const { data: urlData } = supabase.storage
          .from("images")
          .getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    const allImageUrls = [...existingImageUrls, ...uploadedUrls];

    const { error: updateError } = await supabase
      .from("fundraising_projects")
      .update({
        project_name: data.projectName,
        short_description: data.shortDescription,
        long_description: data.longDescription,
        amount_needed: data.amountNeeded,
        payment_info: data.paymentInfo,
        donation_link: data.donationLink || null,
        image_urls: allImageUrls.length > 0 ? allImageUrls : null,
      })
      .eq("id", fundraisingId);

    if (updateError) throw updateError;
    return { success: true };
  } catch (error) {
    console.error("Fundraising update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nepoznata greška",
    };
  }
}
