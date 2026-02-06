"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { deleteFundraisingProject } from "@/lib/supabase/fundraising";
import { createClient } from "@/lib/supabase/client";

interface FundraisingCardProps {
  fundraisingId: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  amountNeeded?: number | null;
  isOwner?: boolean;
}

export function FundraisingCard({
  fundraisingId,
  title,
  description,
  coverImageUrl,
  amountNeeded,
  isOwner = false,
}: FundraisingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const stopCardNav = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCardClick = () => {
    router.push(`/fundraising/${fundraisingId}`);
  };

  // zatvori meni kad kliknes van
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleEdit = () => {
    setMenuOpen(false);
    router.push(`/fundraising/${fundraisingId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this fundraising project?"))
      return;
    setMenuOpen(false);
    setIsDeleting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
        return;
      }

      const result = await deleteFundraisingProject(fundraisingId, user.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleCardClick();
      }}
      className="relative bg-project-card aspect-square rounded-3xl box-glow-primary flex flex-col items-center justify-center p-4 cursor-pointer hover:scale-[1.02] transition-transform"
    >
      {isOwner && (
        <div
          ref={menuRef}
          className="absolute top-3 right-3 sm:top-4 sm:right-4"
          onClick={stopCardNav}
          onMouseDown={stopCardNav}
        >
          <button
            type="button"
            onClick={(e) => {
              stopCardNav(e);
              setMenuOpen((prev) => !prev);
            }}
            className="text-white/60 hover:text-white cursor-pointer p-1"
            aria-label="Fundraising options"
          >
            <Ellipsis className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 sm:w-36 bg-[#14181D] border border-white/10 rounded-lg shadow-lg overflow-hidden z-10">
              <button
                type="button"
                onClick={(e) => {
                  stopCardNav(e);
                  handleEdit();
                }}
                className="w-full px-3 sm:px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  stopCardNav(e);
                  await handleDelete();
                }}
                disabled={isDeleting}
                className="w-full px-3 sm:px-4 py-2 text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>
      )}

      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt={title}
          className="rounded-2xl w-full max-w-[70%] aspect-square object-cover"
        />
      ) : (
        <div className="rounded-2xl w-full max-w-[70%] aspect-square bg-white/5 flex items-center justify-center text-sm text-gray-400">
          No image
        </div>
      )}

      <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold p-2 text-center line-clamp-2">
        {title}
      </h1>
      <p className="px-2 sm:px-4 text-sm text-gray-400 text-center line-clamp-2">
        {description}
      </p>
      <div className="mt-2 bg-white/10 text-accent font-bold text-sm px-4 py-1 rounded-full border border-white/15">
        ${Number(amountNeeded || 0).toFixed(2)}
      </div>
    </div>
  );
}
