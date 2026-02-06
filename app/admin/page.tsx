"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Pencil,
  Trash2,
  ExternalLink,
  LogOut,
  Ban,
  ShieldCheck,
  Users,
  FolderOpen,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  short_description: string | null;
  cover_image_url: string | null;
  total_cost: number | null;
  published: boolean;
  created_at: string;
  profile_id: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [banningId, setBanningId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"projects" | "users">("projects");

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    // provjeri admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      router.push("/home");
      return;
    }

    setAuthorized(true);
    await Promise.all([loadProjects(), loadUsers()]);
    setLoading(false);
  }

  async function loadProjects() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("projects")
      .select(
        "id, title, short_description, cover_image_url, total_cost, published, created_at, profile_id, profiles(full_name, email)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin load projects error:", error);
    }
    if (data) {
      setProjects(data as unknown as Project[]);
    }
  }

  async function loadUsers() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin load users error:", error);
    }
    if (data) {
      setUsers(data as UserProfile[]);
    }
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setDeletingId(projectId);

    try {
      const supabase = createClient();

      // admin može brisati bez provjere vlasništva - briši sve vezane zapise
      const buckets = ["images", "code_files", "misc_files"] as const;
      for (const bucket of buckets) {
        const { data: files } = await supabase.storage
          .from(bucket)
          .list(projectId);
        if (files && files.length > 0) {
          const paths = files.map((f) => `${projectId}/${f.name}`);
          await supabase.storage.from(bucket).remove(paths);
        }
      }

      await supabase
        .from("project_files")
        .delete()
        .eq("project_id", projectId);
      await supabase
        .from("project_steps")
        .delete()
        .eq("project_id", projectId);
      await supabase
        .from("project_components")
        .delete()
        .eq("project_id", projectId);
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        alert("Delete failed: " + error.message);
      } else {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      }
    } catch (err) {
      console.error("Admin delete error:", err);
      alert("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBanToggle(userId: string, currentRole: string | null) {
    const isBanned = currentRole === "banned";
    const action = isBanned ? "unban" : "ban";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    setBanningId(userId);
    try {
      const supabase = createClient();
      const newRole = isBanned ? null : "banned";
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) {
        alert(`Failed to ${action}: ` + error.message);
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      }
    } catch (err) {
      console.error(`Admin ${action} error:`, err);
      alert("Something went wrong.");
    } finally {
      setBanningId(null);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!authorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <nav className="fixed w-full z-20 top-0 bg-background/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-accent">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/home")}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              View Site
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/10">
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "projects"
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "users"
                  ? "border-accent text-accent"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Users ({users.length})
            </button>
          </div>

          {/* Projects tab */}
          {activeTab === "projects" && (
            <>
              {projects.length === 0 ? (
                <p className="text-gray-400">No projects found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10">
                      <tr className="text-gray-400 text-xs uppercase">
                        <th className="pb-3 pr-4">Cover</th>
                        <th className="pb-3 pr-4">Title</th>
                        <th className="pb-3 pr-4">Author</th>
                        <th className="pb-3 pr-4">Cost</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4">Created</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {projects.map((project) => {
                        const profile = Array.isArray(project.profiles)
                          ? project.profiles[0]
                          : project.profiles;
                        return (
                          <tr key={project.id} className="hover:bg-white/5">
                            <td className="py-3 pr-4">
                              {project.cover_image_url ? (
                                <img
                                  src={project.cover_image_url}
                                  alt=""
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-xs text-gray-500">
                                  —
                                </div>
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              <p className="font-medium text-white line-clamp-1">
                                {project.title}
                              </p>
                              {project.short_description && (
                                <p className="text-xs text-gray-400 line-clamp-1">
                                  {project.short_description}
                                </p>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-gray-300">
                              {profile?.full_name || profile?.email || "Unknown"}
                            </td>
                            <td className="py-3 pr-4 text-gray-300">
                              {project.total_cost != null
                                ? `$${project.total_cost.toFixed(2)}`
                                : "—"}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                  project.published
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {project.published ? "Published" : "Draft"}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-gray-400 text-xs">
                              {new Date(
                                project.created_at,
                              ).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    router.push(`/projects/${project.id}`)
                                  }
                                  className="p-2 text-gray-400 hover:text-white transition-colors"
                                  title="View project"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/projects/${project.id}/edit`,
                                    )
                                  }
                                  className="p-2 text-gray-400 hover:text-accent transition-colors"
                                  title="Edit project"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(project.id)}
                                  disabled={deletingId === project.id}
                                  className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                  title="Delete project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Users tab */}
          {activeTab === "users" && (
            <>
              {users.length === 0 ? (
                <p className="text-gray-400">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10">
                      <tr className="text-gray-400 text-xs uppercase">
                        <th className="pb-3 pr-4">Avatar</th>
                        <th className="pb-3 pr-4">Name</th>
                        <th className="pb-3 pr-4">Email</th>
                        <th className="pb-3 pr-4">Role</th>
                        <th className="pb-3 pr-4">Joined</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5">
                          <td className="py-3 pr-4">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs text-gray-500">
                                {user.full_name?.charAt(0).toUpperCase() ?? "?"}
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-white">
                            {user.full_name || "—"}
                          </td>
                          <td className="py-3 pr-4 text-gray-300">
                            {user.email || "—"}
                          </td>
                          <td className="py-3 pr-4">
                            {user.role === "admin" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/20 text-accent">
                                <ShieldCheck className="w-3 h-3" />
                                Admin
                              </span>
                            ) : user.role === "banned" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                <Ban className="w-3 h-3" />
                                Banned
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                                User
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-gray-400 text-xs">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right">
                            {user.role !== "admin" && (
                              <button
                                onClick={() =>
                                  handleBanToggle(user.id, user.role)
                                }
                                disabled={banningId === user.id}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                                  user.role === "banned"
                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                }`}
                                title={
                                  user.role === "banned"
                                    ? "Unban user"
                                    : "Ban user"
                                }
                              >
                                {user.role === "banned" ? (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Unban
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3.5 h-3.5" />
                                    Ban
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
