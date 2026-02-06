import { createClient } from "./client";
import {
  uploadProjectFile,
  deleteProjectFiles,
  deleteProjectFileByUrl,
} from "./storage";

interface StepInput {
  title: string;
  instructions: string;
  image: File | null;
  imageUrl?: string | null;
}

interface ComponentInput {
  name: string;
  quantity: number;
  cost: number;
  link: string;
}

interface FileInput {
  file: File;
  name: string;
  size: number;
}

interface RemovedFileInput {
  id: string;
  url: string;
  type: "code" | "misc";
}

interface ProjectInput {
  title: string;
  shortDescription: string;
  coverImage: File | null;
  components: ComponentInput[];
  steps: StepInput[];
  wiringDiagram: File | null;
  logicExplanation: string;
  codeFiles: FileInput[];
  miscFiles: FileInput[];
  videoUrl: string;
}

// objavi novi projekt
export async function publishProject(
  data: ProjectInput,
  profileId: string,
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  const supabase = createClient();

  try {
    const totalCost = data.components.reduce(
      (sum, c) => sum + c.cost * c.quantity,
      0,
    );

    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert({
        profile_id: profileId,
        title: data.title,
        short_description: data.shortDescription,
        logic_explanation: data.logicExplanation,
        total_cost: totalCost,
        published: true,
        video_url: data.videoUrl?.trim() || null,
      })
      .select("id")
      .single();

    if (projectError || !newProject)
      throw new Error(projectError?.message || "Greška pri kreiranju projekta");

    const projectId = newProject.id;

    // upload slika
    let coverImageUrl: string | null = null;
    if (data.coverImage) {
      coverImageUrl = await uploadProjectFile(
        projectId,
        "images",
        data.coverImage,
      );
    }

    let wiringDiagramUrl: string | null = null;
    if (data.wiringDiagram) {
      wiringDiagramUrl = await uploadProjectFile(
        projectId,
        "images",
        data.wiringDiagram,
      );
    }

    await supabase
      .from("projects")
      .update({
        cover_image_url: coverImageUrl,
        wiring_diagram_url: wiringDiagramUrl,
      })
      .eq("id", projectId);

    // koraci
    const stepsToInsert = await Promise.all(
      data.steps.map(async (step, index) => {
        let imageUrl: string | null = null;
        if (step.image) {
          imageUrl = await uploadProjectFile(projectId, "images", step.image);
        }
        return {
          project_id: projectId,
          step_order: index + 1,
          title: step.title,
          instructions: step.instructions,
          image_url: imageUrl,
        };
      }),
    );
    await supabase.from("project_steps").insert(stepsToInsert);

    // komponente
    const componentsToInsert = data.components
      .filter((c) => c.name.trim())
      .map((comp) => ({
        project_id: projectId,
        name: comp.name,
        quantity: comp.quantity,
        cost: comp.cost,
        link: comp.link || null,
      }));
    if (componentsToInsert.length > 0) {
      await supabase.from("project_components").insert(componentsToInsert);
    }

    // kod datoteke
    for (const codeFile of data.codeFiles) {
      const fileUrl = await uploadProjectFile(
        projectId,
        "code_files",
        codeFile.file,
      );
      if (fileUrl) {
        await supabase.from("project_files").insert({
          project_id: projectId,
          file_url: fileUrl,
          file_name: codeFile.name,
          file_size: codeFile.size,
          file_type: "code",
        });
      }
    }

    // ostale datoteke
    for (const miscFile of data.miscFiles) {
      const fileUrl = await uploadProjectFile(
        projectId,
        "misc_files",
        miscFile.file,
      );
      if (fileUrl) {
        await supabase.from("project_files").insert({
          project_id: projectId,
          file_url: fileUrl,
          file_name: miscFile.name,
          file_size: miscFile.size,
          file_type: "misc",
        });
      }
    }

    return { success: true, projectId };
  } catch (error) {
    console.error("Publish error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nepoznata greška",
    };
  }
}

// dohvati projekte
export async function getProjects(limit = 20, offset = 0) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, short_description, cover_image_url, total_cost, created_at, profiles(username, avatar_url)",
    )
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Get projects error:", error);
    return [];
  }
  return data;
}

// korisnikovi projekti
export async function getUserProjects(profileId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, title, short_description, cover_image_url, total_cost, published, created_at",
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get user projects error:", error);
    return [];
  }
  return data;
}

// brisanje projekta
export async function deleteProject(
  projectId: string,
  profileId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("profile_id")
    .eq("id", projectId)
    .single();

  if (!project || project.profile_id !== profileId) {
    return { success: false, error: "Neautorizirano" };
  }

  await deleteProjectFiles(projectId);

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  if (error) return { success: false, error: error.message };

  return { success: true };
}

// ažuriraj projekt
export async function updateProject(
  projectId: string,
  data: ProjectInput,
  options?: {
    existingCoverImageUrl?: string | null;
    existingWiringDiagramUrl?: string | null;
    removedFiles?: RemovedFileInput[];
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const totalCost = data.components.reduce(
      (sum, c) => sum + c.cost * c.quantity,
      0,
    );

    let coverImageUrl = options?.existingCoverImageUrl ?? null;
    if (data.coverImage) {
      coverImageUrl = await uploadProjectFile(
        projectId,
        "images",
        data.coverImage,
      );
    }

    let wiringDiagramUrl = options?.existingWiringDiagramUrl ?? null;
    if (data.wiringDiagram) {
      wiringDiagramUrl = await uploadProjectFile(
        projectId,
        "images",
        data.wiringDiagram,
      );
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        title: data.title,
        short_description: data.shortDescription,
        logic_explanation: data.logicExplanation,
        total_cost: totalCost,
        cover_image_url: coverImageUrl,
        wiring_diagram_url: wiringDiagramUrl,
        video_url: data.videoUrl?.trim() || null,
      })
      .eq("id", projectId);

    if (updateError) throw updateError;

    // zamijeni komponente
    await supabase
      .from("project_components")
      .delete()
      .eq("project_id", projectId);
    const componentsToInsert = data.components
      .filter((c) => c.name.trim())
      .map((comp) => ({
        project_id: projectId,
        name: comp.name,
        quantity: comp.quantity,
        cost: comp.cost,
        link: comp.link || null,
      }));
    if (componentsToInsert.length > 0) {
      await supabase.from("project_components").insert(componentsToInsert);
    }

    // zamijeni korake
    await supabase.from("project_steps").delete().eq("project_id", projectId);
    const stepsToInsert = await Promise.all(
      data.steps.map(async (step, index) => {
        let imageUrl = step.imageUrl ?? null;
        if (step.image) {
          imageUrl = await uploadProjectFile(projectId, "images", step.image);
        }
        return {
          project_id: projectId,
          step_order: index + 1,
          title: step.title,
          instructions: step.instructions,
          image_url: imageUrl,
        };
      }),
    );
    if (stepsToInsert.length > 0) {
      await supabase.from("project_steps").insert(stepsToInsert);
    }

    const removedFiles = options?.removedFiles ?? [];
    if (removedFiles.length > 0) {
      await supabase
        .from("project_files")
        .delete()
        .in(
          "id",
          removedFiles.map((file) => file.id),
        );

      for (const file of removedFiles) {
        const bucket = file.type === "code" ? "code_files" : "misc_files";
        await deleteProjectFileByUrl(bucket, file.url);
      }
    }

    // nove kod datoteke
    for (const codeFile of data.codeFiles) {
      const fileUrl = await uploadProjectFile(
        projectId,
        "code_files",
        codeFile.file,
      );
      if (fileUrl) {
        await supabase.from("project_files").insert({
          project_id: projectId,
          file_url: fileUrl,
          file_name: codeFile.name,
          file_size: codeFile.size,
          file_type: "code",
        });
      }
    }

    // nove ostale datoteke
    for (const miscFile of data.miscFiles) {
      const fileUrl = await uploadProjectFile(
        projectId,
        "misc_files",
        miscFile.file,
      );
      if (fileUrl) {
        await supabase.from("project_files").insert({
          project_id: projectId,
          file_url: fileUrl,
          file_name: miscFile.name,
          file_size: miscFile.size,
          file_type: "misc",
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nepoznata greška",
    };
  }
}
