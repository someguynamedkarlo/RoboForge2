import { createClient } from "./client";

type Bucket = "misc_files" | "code_files" | "images";

export async function uploadProjectFile(
  projectId: string,
  bucket: Bucket,
  file: File,
): Promise<string | null> {
  const supabase = createClient();

  const ext = file.name.split(".").pop();
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file);

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProjectFiles(projectId: string): Promise<void> {
  const supabase = createClient();
  const buckets: Bucket[] = ["misc_files", "code_files", "images"];

  for (const bucket of buckets) {
    // List all files in project folder
    const { data: files } = await supabase.storage.from(bucket).list(projectId);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${projectId}/${f.name}`);
      await supabase.storage.from(bucket).remove(paths);
    }
  }
}
