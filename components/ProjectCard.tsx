"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { deleteProject } from "@/lib/supabase/projects";
import { createClient } from "@/lib/supabase/client";

interface ProjectCardProps {
  projectId?: string;
  title: string;
  description?: string;
  coverImageUrl?: string | null;
  showMenu?: boolean;
}

export function ProjectCard({
  projectId,
  title,
  description,
  coverImageUrl,
  showMenu = true,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const shouldShowMenu = showMenu && pathname !== "/home";

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
    <Link
      href={`/projects/${projectId}`}
      className="relative bg-project-card aspect-square rounded-3xl box-glow-primary flex flex-col items-center justify-center p-4"
    >
      {shouldShowMenu && (
        <div
          ref={menuRef}
          className="absolute top-3 right-3 sm:top-4 sm:right-4"
        >
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-white/60 hover:text-white cursor-pointer p-1"
            aria-label="Project options"
          >
            <Ellipsis className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-32 sm:w-36 bg-[#14181D] border border-white/10 rounded-lg shadow-lg overflow-hidden z-10">
              <button
                type="button"
                onClick={handleEdit}
                className="w-full px-3 sm:px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
      <img
        src={coverImageUrl ?? ""}
        alt={title}
        className="rounded-2xl w-full max-w-[70%] aspect-square object-cover"
      />
      <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold p-2 text-center line-clamp-2">
        {title}
      </h1>
      <p className="px-2 sm:px-4 text-sm text-gray-400 text-center line-clamp-2">
        {description}
      </p>
    </Link>
  );
}
