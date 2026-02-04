"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { deleteProject } from "@/lib/supabase/projects";
import { createClient } from "@/lib/supabase/client";

interface ProjectCardProps {
  projectId?: string;
  title: string;
  description?: string;
  coverImageUrl?: string | null;
}

export function ProjectCard({
  projectId,
  title,
  description,
  coverImageUrl,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleEdit = () => {
    setMenuOpen(false);
    console.log("Edit project:", projectId);
  };

  const handleDelete = async () => {
    if (!projectId) return;
    setMenuOpen(false);
    setIsDeleting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to delete a project");
        return;
      }

      const result = await deleteProject(projectId, user.id);

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative bg-project-card w-100 h-100 ml-30 rounded-3xl box-glow-primary flex flex-col items-center justify-center">
      <div ref={menuRef} className="absolute top-4 right-4">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="text-white/60 hover:text-white cursor-pointer p-1"
          aria-label="Project options"
        >
          <Ellipsis className="w-6 h-6" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-[#14181D] border border-white/10 rounded-lg shadow-lg overflow-hidden z-10">
            <button
              type="button"
              onClick={handleEdit}
              className="w-full px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full px-4 py-2 text-sm text-red-400 hover:bg-white/10 flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        )}
      </div>

      <img src={coverImageUrl ?? ""} alt={title} className="rounded-5xl w-70" />
      <h1 className="text-2xl font-extrabold p-2">{title}</h1>
      <p className="px-10">{description}</p>
    </div>
  );
}
