"use client";
import { createClient } from "@/lib/supabase/client";
import { useState, useRef, ReactNode } from "react";
import { publishProject, updateProject } from "@/lib/supabase/projects";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  FileCode,
  Cpu,
  Info,
  Cable,
  Package,
  Box,
  Video,
} from "lucide-react";

interface Step {
  id: string;
  title: string;
  instructions: string;
  image: File | null;
  imageUrl: string | null;
}

interface CodeFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface Component {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  link: string;
}

interface MiscFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface ExistingFile {
  id: string;
  url: string;
  name: string;
  size: number;
  type: "code" | "misc";
}

interface ProjectState {
  title: string;
  shortDescription: string;
  coverImage: File | null;
  coverImageUrl: string | null;
  components: Component[];
  steps: Step[];
  wiringDiagram: File | null;
  wiringDiagramUrl: string | null;
  logicExplanation: string;
  codeFiles: CodeFile[];
  miscFiles: MiscFile[];
  existingCodeFiles: ExistingFile[];
  existingMiscFiles: ExistingFile[];
  removedFiles: ExistingFile[];
  videoUrl: string;
}

function DropZone({
  onDrop,
  onClick,
  isDragging,
  setIsDragging,
  children,
  className = "h-40",
}: {
  onDrop: (file: File) => void;
  onClick: () => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) onDrop(file);
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      role="button"
      tabIndex={0}
      className={`relative border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer transition-all ${className} ${
        isDragging
          ? "border-[#21bfa3] bg-[#21bfa3]/10"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {children}
    </div>
  );
}

function RemoveButton({
  onClick,
  label,
  size = "md",
}: {
  onClick: () => void;
  label: string;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "p-1" : "p-1.5";
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-2 right-2 bg-red-500/90 text-white ${sizeClass} rounded-full hover:bg-red-500 transition-colors`}
      aria-label={label}
    >
      <Trash2 className={iconSize} />
    </button>
  );
}

const inputClass =
  "w-full bg-[#12181b] rounded-md px-4 py-3 text-sm text-white placeholder:text-[#97a3a9]/60 border border-transparent focus:border-[#21bfa3] focus:ring-1 focus:ring-[#21bfa3]/50 outline-none transition-all";
const inputClassDark = inputClass.replace("bg-[#12181b]", "bg-[#0f1619]");
const inputClassSmall = inputClass.replace("px-4 py-3", "px-3 py-2");

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const validateImage = (file: File, maxMB: number): string | null => {
  if (!["image/png", "image/jpeg", "image/gif"].includes(file.type))
    return "Only PNG, JPG, GIF allowed";
  if (file.size > maxMB * 1024 * 1024) return `Max file size is ${maxMB}MB`;
  return null;
};

interface ProjectFormProps {
  projectId?: string;
  initialData?: {
    title: string;
    shortDescription: string;
    coverImageUrl: string | null;
    wiringDiagramUrl: string | null;
    logicExplanation: string;
    videoUrl: string;
    components: Component[];
    steps: Array<Omit<Step, "id" | "image"> & { image: null }>;
    existingCodeFiles?: ExistingFile[];
    existingMiscFiles?: ExistingFile[];
  };
}

export default function ProjectForm({
  projectId,
  initialData,
}: ProjectFormProps = {}) {
  const router = useRouter();
  const [project, setProject] = useState<ProjectState>(() => {
    if (initialData) {
      return {
        title: initialData.title,
        shortDescription: initialData.shortDescription ?? "",
        coverImage: null,
        coverImageUrl: initialData.coverImageUrl,
        components:
          initialData.components.length > 0
            ? initialData.components.map((c) => ({
                ...c,
                id: crypto.randomUUID(),
              }))
            : [
                {
                  id: crypto.randomUUID(),
                  name: "",
                  quantity: 1,
                  cost: 0,
                  link: "",
                },
              ],
        steps:
          initialData.steps.length > 0
            ? initialData.steps
                .sort((a, b) => (a as any).step_order - (b as any).step_order)
                .map((s) => ({
                  id: crypto.randomUUID(),
                  title: s.title,
                  instructions: s.instructions,
                  image: null,
                  imageUrl: s.imageUrl ?? (s as any).image_url ?? null,
                }))
            : [
                {
                  id: crypto.randomUUID(),
                  title: "",
                  instructions: "",
                  image: null,
                  imageUrl: null,
                },
              ],
        wiringDiagram: null,
        wiringDiagramUrl: initialData.wiringDiagramUrl,
        logicExplanation: initialData.logicExplanation ?? "",
        codeFiles: [],
        miscFiles: [],
        existingCodeFiles: initialData.existingCodeFiles ?? [],
        existingMiscFiles: initialData.existingMiscFiles ?? [],
        removedFiles: [],
        videoUrl: initialData.videoUrl ?? "",
      };
    }
    return {
      title: "",
      shortDescription: "",
      coverImage: null,
      coverImageUrl: null,
      components: [
        { id: crypto.randomUUID(), name: "", quantity: 1, cost: 0, link: "" },
      ],
      steps: [
        {
          id: crypto.randomUUID(),
          title: "",
          instructions: "",
          image: null,
          imageUrl: null,
        },
      ],
      wiringDiagram: null,
      wiringDiagramUrl: null,
      logicExplanation: "",
      codeFiles: [],
      miscFiles: [],
      existingCodeFiles: [],
      existingMiscFiles: [],
      removedFiles: [],
      videoUrl: "",
    };
  });
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [isDraggingWiring, setIsDraggingWiring] = useState(false);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const wiringInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const miscInputRef = useRef<HTMLInputElement>(null);

  const handleCoverUpload = (file: File) => {
    const err = validateImage(file, 10);
    setErrors((prev) => ({ ...prev, coverImage: err || "" }));
    if (!err)
      setProject((prev) => ({
        ...prev,
        coverImage: file,
        coverImageUrl: URL.createObjectURL(file),
      }));
  };

  const handleWiringUpload = (file: File) => {
    if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        wiringDiagram: "Only PDF, PNG, JPG allowed",
      }));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        wiringDiagram: "Max file size is 20MB",
      }));
      return;
    }
    setErrors((prev) => ({ ...prev, wiringDiagram: "" }));
    setProject((prev) => ({
      ...prev,
      wiringDiagram: file,
      wiringDiagramUrl: URL.createObjectURL(file),
    }));
  };

  // Component handlers
  const addComponent = () => {
    setProject((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        { id: crypto.randomUUID(), name: "", quantity: 1, cost: 0, link: "" },
      ],
    }));
  };

  const updateComponent = (
    id: string,
    field: keyof Component,
    value: string | number,
  ) => {
    setProject((prev) => ({
      ...prev,
      components: prev.components.map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    }));
  };

  const removeComponent = (id: string) => {
    if (project.components.length > 1) {
      setProject((prev) => ({
        ...prev,
        components: prev.components.filter((c) => c.id !== id),
      }));
    }
  };
  const handlePublish = async () => {
    if (!validateForm()) {
      alert("Please fix the highlighted fields before continuing.");
      return;
    }
    setIsPublishing(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsPublishing(false);
        return;
      }

      const payload = {
        title: project.title,
        shortDescription: project.shortDescription,
        coverImage: project.coverImage,
        components: project.components,
        steps: project.steps.map((s) => ({
          title: s.title,
          instructions: s.instructions,
          image: s.image,
          imageUrl: s.imageUrl,
        })),
        wiringDiagram: project.wiringDiagram,
        logicExplanation: project.logicExplanation,
        codeFiles: project.codeFiles,
        miscFiles: project.miscFiles,
        videoUrl: project.videoUrl,
      };

      const result = projectId
        ? await updateProject(projectId, payload, {
            existingCoverImageUrl: project.coverImageUrl,
            existingWiringDiagramUrl: project.wiringDiagramUrl,
            removedFiles: project.removedFiles,
          })
        : await publishProject(payload, user.id);

      if (result.success) {
        const targetId =
          projectId || ("projectId" in result ? result.projectId : undefined);
        if (targetId) router.push(`/projects/${targetId}`);
      }
    } catch (error) {
      console.error("Publish/Update error:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const addStep = () => {
    setProject((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: crypto.randomUUID(),
          title: "",
          instructions: "",
          image: null,
          imageUrl: null,
        },
      ],
    }));
  };

  const updateStep = (
    id: string,
    field: keyof Step,
    value: string | File | null,
  ) => {
    setProject((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => {
        if (step.id !== id) return step;
        if (field === "image" && value instanceof File)
          return {
            ...step,
            image: value,
            imageUrl: URL.createObjectURL(value),
          };
        if (field === "image" && value === null)
          return { ...step, image: null, imageUrl: null };
        return { ...step, [field]: value };
      }),
    }));
  };

  const removeStep = (id: string) => {
    if (project.steps.length > 1)
      setProject((prev) => ({
        ...prev,
        steps: prev.steps.filter((s) => s.id !== id),
      }));
  };

  const handleStepDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedStepId || draggedStepId === targetId) return;
    const draggedIdx = project.steps.findIndex((s) => s.id === draggedStepId);
    const targetIdx = project.steps.findIndex((s) => s.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1) return;
    const newSteps = [...project.steps];
    const [removed] = newSteps.splice(draggedIdx, 1);
    newSteps.splice(targetIdx, 0, removed);
    setProject((prev) => ({ ...prev, steps: newSteps }));
  };

  // Code files handler
  const handleCodeFilesUpload = (files: FileList) => {
    const allowed = [".zip", ".py", ".ino", ".cpp", ".c", ".h"];
    const newFiles = Array.from(files)
      .filter(
        (f) =>
          allowed.includes("." + f.name.split(".").pop()?.toLowerCase()) &&
          f.size <= 50 * 1024 * 1024,
      )
      .map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        name: f.name,
        size: f.size,
      }));
    setProject((prev) => ({
      ...prev,
      codeFiles: [...prev.codeFiles, ...newFiles],
    }));
  };

  // Misc files handler
  const handleMiscFilesUpload = (files: FileList) => {
    const allowed = [
      ".stl",
      ".obj",
      ".step",
      ".3mf",
      ".gcode",
      "kicad_pcb",

      ".pdf",
      ".zip",
    ];
    const newFiles = Array.from(files)
      .filter(
        (f) =>
          allowed.includes("." + f.name.split(".").pop()?.toLowerCase()) &&
          f.size <= 100 * 1024 * 1024,
      )
      .map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        name: f.name,
        size: f.size,
      }));
    setProject((prev) => ({
      ...prev,
      miscFiles: [...prev.miscFiles, ...newFiles],
    }));
  };

  const removeExistingFile = (file: ExistingFile) => {
    setProject((prev) => {
      const alreadyRemoved = prev.removedFiles.some((f) => f.id === file.id);
      return {
        ...prev,
        existingCodeFiles:
          file.type === "code"
            ? prev.existingCodeFiles.filter((f) => f.id !== file.id)
            : prev.existingCodeFiles,
        existingMiscFiles:
          file.type === "misc"
            ? prev.existingMiscFiles.filter((f) => f.id !== file.id)
            : prev.existingMiscFiles,
        removedFiles: alreadyRemoved
          ? prev.removedFiles
          : [...prev.removedFiles, file],
      };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!project.title.trim()) newErrors.title = "Project name is required";
    else if (project.title.length > 120)
      newErrors.title = "Project name must be 120 characters or less";
    if (project.shortDescription.length > 140)
      newErrors.shortDescription = "Description must be 140 characters or less";
    project.steps.forEach((step, i) => {
      if (!step.title.trim())
        newErrors[`step_${step.id}`] = `Step ${i + 1} title is required`;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="space-y-7">
      <section className="bg-[#0f1619] rounded-[14px] p-7">
        <div className="flex items-center gap-3 mb-5">
          <Info className="w-5 h-5 text-[#21bfa3]" />
          <h2 className="text-lg font-semibold text-white">Project Info</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="projectName"
              className="block text-xs font-medium text-[#97a3a9] mb-2"
            >
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={project.title}
              onChange={(e) =>
                setProject((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="e.g. Autonomous RC boat"
              maxLength={30}
              className={inputClass}
            />
            {errors.title && (
              <p className="text-xs text-red-400 mt-1" role="alert">
                {errors.title}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="shortDescription"
              className="block text-xs font-medium text-[#97a3a9] mb-2"
            >
              Short Description
            </label>
            <textarea
              id="shortDescription"
              value={project.shortDescription}
              onChange={(e) =>
                setProject((p) => ({ ...p, shortDescription: e.target.value }))
              }
              placeholder="What does your robot do?"
              rows={4}
              maxLength={140}
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-[#97a3a9] mt-1 text-right">
              {project.shortDescription.length}/140
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#97a3a9] mb-2">
              Project Cover Image
            </label>
            <input
              ref={coverInputRef}
              type="file"
              title="project image"
              accept="image/png,image/jpeg,image/gif"
              onChange={(e) =>
                e.target.files?.[0] && handleCoverUpload(e.target.files[0])
              }
              className="hidden"
            />
            <DropZone
              onDrop={handleCoverUpload}
              onClick={() => coverInputRef.current?.click()}
              isDragging={isDraggingCover}
              setIsDragging={setIsDraggingCover}
            >
              {project.coverImageUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={project.coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <RemoveButton
                    onClick={() =>
                      setProject((p) => ({
                        ...p,
                        coverImage: null,
                        coverImageUrl: null,
                      }))
                    }
                    label="Remove cover image"
                  />
                </div>
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-[#97a3a9] mb-2" />
                  <p className="text-sm text-[#97a3a9]">
                    <span className="text-[#21bfa3]">Upload a file</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-[#97a3a9]/60 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </>
              )}
            </DropZone>
            {errors.coverImage && (
              <p className="text-xs text-red-400 mt-1" role="alert">
                {errors.coverImage}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-xs font-medium text-[#97a3a9] mb-2"
            >
              Video URL (optional)
            </label>
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-[#21bfa3] shrink-0" />
              <input
                id="videoUrl"
                type="url"
                value={project.videoUrl}
                onChange={(e) =>
                  setProject((p) => ({ ...p, videoUrl: e.target.value }))
                }
                placeholder="https://www.youtube.com/watch?v=... or any video link"
                className={inputClass}
              />
            </div>
            <p className="text-xs text-[#97a3a9]/60 mt-1">
              YouTube, Vimeo, or any direct video link
            </p>
          </div>
        </div>
      </section>
      {/* komponente */}
      <section className="bg-[#0f1619] rounded-[14px] p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-[#21bfa3]" />
            <h2 className="text-lg font-semibold text-white">
              Components List
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {/* Header */}

          {project.components.map((comp) => (
            <div
              key={comp.id}
              className="grid grid-cols-[1fr,80px,100px,1fr,40px] gap-3 items-center"
            >
              <span className="grid grid-cols-[1fr,80px,100px,1fr,40px] gap-3 text-xs font-medium text-[#97a3a9] px-1">
                Component
              </span>
              <input
                type="text"
                value={comp.name}
                onChange={(e) =>
                  updateComponent(comp.id, "name", e.target.value)
                }
                placeholder="e.g. Arduino Nano"
                className={inputClassSmall}
              />
              <span className="grid grid-cols-[1fr,80px,100px,1fr,40px] gap-3 text-xs font-medium text-[#97a3a9] px-1">
                Quantity
              </span>
              <input
                title="quantity"
                type="number"
                min={1}
                value={comp.quantity}
                onChange={(e) =>
                  updateComponent(
                    comp.id,
                    "quantity",
                    parseInt(e.target.value) || 1,
                  )
                }
                className={inputClassSmall}
              />
              <span className="grid grid-cols-[1fr,80px,100px,1fr,40px] gap-3 text-xs font-medium text-[#97a3a9] px-1">
                Cost
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={comp.cost || ""}
                onChange={(e) =>
                  updateComponent(
                    comp.id,
                    "cost",
                    parseFloat(e.target.value) || 0,
                  )
                }
                placeholder="0.00"
                className={inputClassSmall}
              />
              <span className="grid grid-cols-[1fr,80px,100px,1fr,40px] gap-3 text-xs font-medium text-[#97a3a9] px-1">
                Link (optional)
              </span>
              <input
                type="url"
                value={comp.link}
                onChange={(e) =>
                  updateComponent(comp.id, "link", e.target.value)
                }
                placeholder="https://..."
                className={inputClassSmall}
              />
              {project.components.length > 1 && (
                <button
                  title="remove"
                  type="button"
                  onClick={() => removeComponent(comp.id)}
                  className="text-red-400 hover:text-red-300 p-2"
                >
                  <Trash2 className="w-4 h-4 cursor-pointer" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addComponent}
          className="mt-4 flex items-center gap-2 text-[#21bfa3] text-sm font-medium hover:text-[#21bfa3]/80 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Component
        </button>
      </section>
      
      <section className="bg-[#0f1619] rounded-[14px] p-7">
        <div className="flex items-center gap-3 mb-5">
          <Cpu className="w-5 h-5 text-[#21bfa3]" />
          <h2 className="text-lg font-semibold text-white">Assembling Steps</h2>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-6 bottom-16 w-0.5 bg-[#21bfa3]/30" />

          <div className="space-y-4">
            {project.steps.map((step, index) => (
              <div
                key={step.id}
                draggable
                onDragStart={() => setDraggedStepId(step.id)}
                onDragOver={(e) => handleStepDragOver(e, step.id)}
                onDragEnd={() => setDraggedStepId(null)}
                className={`relative pl-12 transition-opacity ${
                  draggedStepId === step.id ? "opacity-50" : ""
                }`}
              >
                <div className="absolute left-2 top-6 w-5 h-5 rounded-full bg-[#21bfa3] flex items-center justify-center text-xs font-bold text-[#0b0c0e]">
                  {index + 1}
                </div>

                <div className="bg-[#12181b] rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <button
                      type="button"
                      className="cursor-grab active:cursor-grabbing text-[#97a3a9] hover:text-white"
                      aria-label="Drag to reorder step"
                    >
                      <GripVertical className="w-5 h-5" />
                    </button>
                    {project.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="text-red-400 hover:text-red-300"
                        aria-label={`Remove step ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4 cursor-pointer" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr,140px] gap-4">
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor={`stepTitle_${step.id}`}
                          className="block text-xs font-medium text-[#97a3a9] mb-1"
                        >
                          Step Title
                        </label>
                        <input
                          id={`stepTitle_${step.id}`}
                          type="text"
                          value={step.title}
                          onChange={(e) =>
                            updateStep(step.id, "title", e.target.value)
                          }
                          placeholder="e.g. Chassis Assembly"
                          maxLength={80}
                          className={inputClassDark.replace(
                            "px-4 py-3",
                            "px-3 py-2",
                          )}
                        />
                        {errors[`step_${step.id}`] && (
                          <p className="text-xs text-red-400 mt-1" role="alert">
                            {errors[`step_${step.id}`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor={`stepInstructions_${step.id}`}
                          className="block text-xs font-medium text-[#97a3a9] mb-1"
                        >
                          Instructions
                        </label>
                        <textarea
                          id={`stepInstructions_${step.id}`}
                          value={step.instructions}
                          onChange={(e) =>
                            updateStep(step.id, "instructions", e.target.value)
                          }
                          placeholder="Describe how to assemble this part..."
                          rows={3}
                          maxLength={2000}
                          className={`${inputClassDark.replace("px-4 py-3", "px-3 py-2")} resize-none`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#97a3a9] mb-1">
                        Step Image
                      </label>
                      <input
                        id={`stepImage_${step.id}`}
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f && !validateImage(f, 5))
                            updateStep(step.id, "image", f);
                        }}
                        className="hidden"
                      />
                      <div
                        onClick={() =>
                          document
                            .getElementById(`stepImage_${step.id}`)
                            ?.click()
                        }
                        className="h-[120px] border-2 border-dashed border-white/10 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-white/20 overflow-hidden"
                      >
                        {step.imageUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={step.imageUrl}
                              alt={`Step ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStep(step.id, "image", null);
                              }}
                              className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full hover:bg-red-500"
                              aria-label="Remove step image"
                            >
                              <Trash2 className="w-3 h-3 cursor-pointer" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 text-[#97a3a9] mb-1" />
                            <p className="text-xs text-[#97a3a9]">Add Photo</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addStep}
            className="mt-5 ml-12 flex items-center cursor-pointer gap-2 text-[#21bfa3] text-sm font-medium hover:text-[#21bfa3]/80"
          >
            <Plus className="w-4 h-4" />
            Add Another Step
          </button>
        </div>
      </section>
      
      <section className="bg-[#0f1619] rounded-[14px] p-7">
        <div className="flex items-center gap-3 mb-2">
          <Cable className="w-5 h-5 text-[#21bfa3]" />
          <h2 className="text-lg font-semibold text-white">Wiring Diagram</h2>
        </div>
        <p className="text-sm text-[#97a3a9] mb-5">
          Upload a schematic or wiring diagram so others can replicate your
          connections.
        </p>
        <input
          title="wiring"
          ref={wiringInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) =>
            e.target.files?.[0] && handleWiringUpload(e.target.files[0])
          }
          className="hidden"
        />
        <DropZone
          onDrop={handleWiringUpload}
          onClick={() => wiringInputRef.current?.click()}
          isDragging={isDraggingWiring}
          setIsDragging={setIsDraggingWiring}
          className="h-44"
        >
          {project.wiringDiagramUrl ? (
            <div className="relative w-full h-full p-4">
              {project.wiringDiagram?.type === "application/pdf" ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <FileCode className="w-12 h-12 text-[#21bfa3] mx-auto mb-2" />
                    <p className="text-sm text-white">
                      {project.wiringDiagram.name}
                    </p>
                    <p className="text-xs text-[#97a3a9]">
                      {formatFileSize(project.wiringDiagram.size)}
                    </p>
                  </div>
                </div>
              ) : (
                <img
                  src={project.wiringDiagramUrl}
                  alt="Wiring diagram"
                  className="w-full h-full object-contain rounded"
                />
              )}
              <RemoveButton
                onClick={() =>
                  setProject((p) => ({
                    ...p,
                    wiringDiagram: null,
                    wiringDiagramUrl: null,
                  }))
                }
                label="Remove wiring diagram"
              />
            </div>
          ) : (
            <>
              <Cable className="w-8 h-8 text-[#97a3a9] mb-2" />
              <p className="text-sm text-[#97a3a9]">
                <span className="text-[#21bfa3]">Upload diagram</span> (PDF,
                PNG, JPG)
              </p>
              <p className="text-xs text-[#97a3a9]/60 mt-1">Up to 20MB</p>
            </>
          )}
        </DropZone>
        {errors.wiringDiagram && (
          <p className="text-xs text-red-400 mt-1" role="alert">
            {errors.wiringDiagram}
          </p>
        )}
      </section>
      <section className="bg-[#0f1619] rounded-[14px] p-7">
        <div className="flex items-center gap-3 mb-5">
          <FileCode className="w-5 h-5 text-[#21bfa3]" />
          <h2 className="text-lg font-semibold text-white">
            Code & Algorithms
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="logicExplanation"
              className="block text-xs font-medium text-[#97a3a9] mb-2"
            >
              Logic Explanation
            </label>
            <textarea
              id="logicExplanation"
              value={project.logicExplanation}
              onChange={(e) =>
                setProject((p) => ({ ...p, logicExplanation: e.target.value }))
              }
              placeholder="// Explain your PID controller logic, sensor integration, etc..."
              rows={7}
              maxLength={2000}
              className={`${inputClass} resize-none font-mono`}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-xs font-medium text-[#97a3a9]">
                  Project Code
                </label>
                <p className="text-xs text-[#97a3a9]/60">
                  Upload .zip, .ino, .py, .cpp files
                </p>
              </div>
              <button
                type="button"
                onClick={() => codeInputRef.current?.click()}
                className="px-4 py-2 bg-[#12181b] cursor-pointer text-white text-sm rounded-md border border-white/10 hover:border-white/20"
              >
                Select Files
              </button>
              <input
                title="code"
                ref={codeInputRef}
                type="file"
                multiple
                accept=".zip,.py,.ino,.cpp,.c,.h"
                onChange={(e) =>
                  e.target.files && handleCodeFilesUpload(e.target.files)
                }
                className="hidden"
              />
            </div>

            {(project.existingCodeFiles.length > 0 ||
              project.codeFiles.length > 0) && (
              <ul className="space-y-2 mt-3">
                {project.existingCodeFiles.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between bg-[#12181b] p-3 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <FileCode className="w-4 h-4 text-[#21bfa3]" />
                      <div>
                        <p className="text-sm text-white">{f.name}</p>
                        <p className="text-xs text-[#97a3a9]">
                          {formatFileSize(f.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(f)}
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Remove ${f.name}`}
                    >
                      <Trash2 className="w-4 h-4 cursor-pointer" />
                    </button>
                  </li>
                ))}
                {project.codeFiles.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between bg-[#12181b] p-3 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <FileCode className="w-4 h-4 text-[#21bfa3]" />
                      <div>
                        <p className="text-sm text-white">{f.name}</p>
                        <p className="text-xs text-[#97a3a9]">
                          {formatFileSize(f.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setProject((p) => ({
                          ...p,
                          codeFiles: p.codeFiles.filter((c) => c.id !== f.id),
                        }))
                      }
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Remove ${f.name}`}
                    >
                      <Trash2 className="w-4 h-4 cursor-pointer" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
      <section className="bg-[#0f1619] rounded-[14px] p-7">
        <div className="flex items-center gap-3 mb-2">
          <Box className="w-5 h-5 text-[#21bfa3]" />
          <h2 className="text-lg font-semibold text-white">
            3D Prints & Files
          </h2>
        </div>
        <p className="text-sm text-[#97a3a9] mb-5">
          Upload STL files, laser cut templates, or other downloadable assets.
        </p>

        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#97a3a9]/60">
            .stl, .obj, .step, .3mf, .gcode, .dxf, .svg, .pdf, .zip up to 100MB
            each
          </p>
          <button
            type="button"
            onClick={() => miscInputRef.current?.click()}
            className="px-4 py-2 bg-[#12181b] cursor-pointer text-white text-sm rounded-md border border-white/10 hover:border-white/20"
          >
            Select Files
          </button>
          <input
            title="misc"
            ref={miscInputRef}
            type="file"
            multiple
            accept=".stl,.obj,.step,.stp,.3mf,.gcode,.dxf,.svg,.pdf,.zip"
            onChange={(e) =>
              e.target.files && handleMiscFilesUpload(e.target.files)
            }
            className="hidden"
          />
        </div>

        {(project.existingMiscFiles.length > 0 ||
          project.miscFiles.length > 0) && (
          <ul className="space-y-2">
            {project.existingMiscFiles.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between bg-[#12181b] p-3 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Box className="w-4 h-4 text-[#21bfa3]" />
                  <div>
                    <p className="text-sm text-white">{f.name}</p>
                    <p className="text-xs text-[#97a3a9]">
                      {formatFileSize(f.size)}
                    </p>
                  </div>
                </div>
                <button
                  title="delete"
                  type="button"
                  onClick={() => removeExistingFile(f)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 cursor-pointer" />
                </button>
              </li>
            ))}
            {project.miscFiles.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between bg-[#12181b] p-3 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Box className="w-4 h-4 text-[#21bfa3]" />
                  <div>
                    <p className="text-sm text-white">{f.name}</p>
                    <p className="text-xs text-[#97a3a9]">
                      {formatFileSize(f.size)}
                    </p>
                  </div>
                </div>
                <button
                  title="delete"
                  type="button"
                  onClick={() =>
                    setProject((p) => ({
                      ...p,
                      miscFiles: p.miscFiles.filter((m) => m.id !== f.id),
                    }))
                  }
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4 cursor-pointer" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* objavi */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing}
          className={`px-6 py-3 bg-[#23d18b] text-[#0b0c0e] text-sm font-semibold rounded-md transition-colors shadow-md ${
            isPublishing
              ? "opacity-75 cursor-wait"
              : "hover:bg-[#23d18b]/90 cursor-pointer"
          }`}
        >
          {projectId ? "Update Project" : "Publish Project"}
        </button>
      </div>
    </div>
  );
}
