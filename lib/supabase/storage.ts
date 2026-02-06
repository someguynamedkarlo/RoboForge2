import { createClient } from "./client";

type Bucket = "misc_files" | "code_files" | "images";

// upload datoteke u storage
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

// obriši sve datoteke projekta
export async function deleteProjectFiles(projectId: string): Promise<void> {
  const supabase = createClient();
  const buckets: Bucket[] = ["misc_files", "code_files", "images"];

  for (const bucket of buckets) {
    const { data: files } = await supabase.storage.from(bucket).list(projectId);
    if (files && files.length > 0) {
      const paths = files.map((f) => `${projectId}/${f.name}`);
      await supabase.storage.from(bucket).remove(paths);
    }
  }
}

export async function deleteProjectFileByUrl(
  bucket: Bucket,
  fileUrl: string | null | undefined,
): Promise<void> {
  if (!fileUrl) return;
  const supabase = createClient();
  const publicPrefix = `/storage/v1/object/public/${bucket}/`;
  const directPrefix = `/${bucket}/`;

  let path = fileUrl;
  const publicIndex = fileUrl.indexOf(publicPrefix);
  if (publicIndex !== -1) {
    path = fileUrl.slice(publicIndex + publicPrefix.length);
  } else {
    const directIndex = fileUrl.indexOf(directPrefix);
    if (directIndex !== -1) {
      path = fileUrl.slice(directIndex + directPrefix.length);
    }
  }

  path = path.split("?")[0].replace(/^\/+/, "");
  if (!path || path.includes("http")) return;

  await supabase.storage.from(bucket).remove([path]);
}
