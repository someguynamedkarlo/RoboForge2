"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateFundraisingProject } from "@/lib/supabase/fundraising";
import { Trash2 } from "lucide-react";

interface FundraisingFormProps {
  fundraisingId?: string;
  initialData?: {
    projectName: string;
    shortDescription: string;
    longDescription: string;
    amountNeeded: string;
    paymentInfo: string;
    donationLink: string;
    imageUrls: string[];
  };
}

export function FundraisingForm({
  fundraisingId,
  initialData,
}: FundraisingFormProps = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    projectName: initialData?.projectName ?? "",
    shortDescription: initialData?.shortDescription ?? "",
    longDescription: initialData?.longDescription ?? "",
    amountNeeded: initialData?.amountNeeded ?? "",
    paymentInfo: initialData?.paymentInfo ?? "",
    donationLink: initialData?.donationLink ?? "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    initialData?.imageUrls ?? [],
  );
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setImages((prev) => [...prev, ...picked].slice(0, 5));
  };

  const uploadImages = async (
    supabase: ReturnType<typeof createClient>,
    id: string,
  ) => {
    const urls: string[] = [];
    for (const img of images) {
      const ext = img.name.split(".").pop();
      const path = `fundraising/${id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("images").upload(path, img);
      if (!error) {
        const { data } = supabase.storage.from("images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    if (urls.length > 0) {
      await supabase
        .from("fundraising_projects")
        .update({ image_urls: urls })
        .eq("id", id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.projectName.trim() ||
      !form.shortDescription.trim() ||
      !form.longDescription.trim() ||
      !form.amountNeeded ||
      !form.paymentInfo.trim()
    ) {
      alert("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("You must be logged in to submit.");
        return;
      }

      if (fundraisingId) {
        // ažuriraj postojeći
        const result = await updateFundraisingProject(
          fundraisingId,
          {
            projectName: form.projectName,
            shortDescription: form.shortDescription,
            longDescription: form.longDescription,
            amountNeeded: Number(form.amountNeeded),
            paymentInfo: form.paymentInfo,
            donationLink: form.donationLink,
          },
          images,
          existingImages,
          removedImages,
        );

        if (result.success) {
          router.push(`/fundraising/${fundraisingId}`);
        } else {
          alert(result.error || "Update failed.");
        }
      } else {
        // kreiraj novi
        const { data: inserted, error } = await supabase
          .from("fundraising_projects")
          .insert({
            profile_id: user.id,
            project_name: form.projectName,
            short_description: form.shortDescription,
            long_description: form.longDescription,
            amount_needed: Number(form.amountNeeded),
            payment_info: form.paymentInfo,
            donation_link: form.donationLink || null,
          })
          .select("id")
          .single();

        if (error) throw error;

        if (inserted?.id && images.length > 0) {
          await uploadImages(supabase, inserted.id);
        }

        setForm({
          projectName: "",
          shortDescription: "",
          longDescription: "",
          amountNeeded: "",
          paymentInfo: "",
          donationLink: "",
        });
        setImages([]);
        router.push("/fundraising");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0f1619] rounded-2xl border border-white/10 p-5 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-gray-300">Project name</label>
          <input
            name="projectName"
            value={form.projectName}
            onChange={handleChange}
            maxLength={120}
            placeholder="e.g. Autonomous delivery rover"
            className="w-full bg-[#12181b] rounded-md px-3 py-2 text-white border border-white/10 focus:border-[#23d18b] outline-none"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">
            Brief description (max 140 chars)
          </label>
          <textarea
            name="shortDescription"
            value={form.shortDescription}
            onChange={handleChange}
            maxLength={140}
            rows={2}
            placeholder="Brief summary in 140 characters"
            className="w-full bg-[#12181b] rounded-md px-3 py-2 text-white border border-white/10 focus:border-[#23d18b] outline-none resize-none"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">
            Detailed description (use of funds)
          </label>
          <textarea
            name="longDescription"
            value={form.longDescription}
            onChange={handleChange}
            rows={5}
            placeholder="Detail what you’re building and how funds will be used"
            className="w-full bg-[#12181b] rounded-md px-3 py-2 text-white border border-white/10 focus:border-[#23d18b] outline-none resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-300">Amount needed ($)</label>
            <input
              name="amountNeeded"
              type="number"
              min="1"
              step="0.01"
              value={form.amountNeeded}
              onChange={handleChange}
              placeholder="e.g. 1500"
              className="w-full bg-[#12181b] rounded-md px-3 py-2 text-white border border-white/10 focus:border-[#23d18b] outline-none"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-300">Payment info</label>
            <input
              name="paymentInfo"
              value={form.paymentInfo}
              onChange={handleChange}
              placeholder="Bank/PayPal details or instructions"
              className="w-full bg-[#12181b] rounded-md px-3 py-2 text-white border border-white/10 focus:border-[#23d18b] outline-none"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">
            Donation link (optional)
          </label>
          <input
            name="donationLink"
            type="url"
            value={form.donationLink}
            onChange={handleChange}
            placeholder="https://your-donation-page.com"
            className="w-full bg-[#12181b] rounded-md px-3 py-2 text-white border border-white/10 focus:border-[#23d18b] outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Attach images (max 5)</label>
          <input
            title="image"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleImages(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#12181b] text-white text-sm rounded-md border border-white/10 hover:border-white/20 cursor-pointer"
          >
            Choose images
          </button>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div
                  key={`${img.name}-${idx}`}
                  className="relative w-24 h-24 rounded-md overflow-hidden border border-white/10"
                >
                  <img
                    src={URL.createObjectURL(img)}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full hover:bg-red-500"
                    aria-label="Remove image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {existingImages.map((url, idx) => (
                <div
                  key={url}
                  className="relative w-24 h-24 rounded-md overflow-hidden border border-white/10"
                >
                  <img
                    src={url}
                    alt={`Existing ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setExistingImages((prev) =>
                        prev.filter((u) => u !== url),
                      );
                      setRemovedImages((prev) => [...prev, url]);
                    }}
                    className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full hover:bg-red-500"
                    aria-label="Remove existing image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-5 py-2 rounded-md font-semibold text-sm text-[#0b0c0e] transition-colors ${
            loading
              ? "bg-[#23d18b]/70 cursor-wait"
              : "bg-[#23d18b] hover:bg-[#23d18b]/90 cursor-pointer"
          }`}
        >
          {loading ? "Submitting..." : fundraisingId ? "Update" : "Submit request"}
        </button>
      </form>
    </div>
  );
}
