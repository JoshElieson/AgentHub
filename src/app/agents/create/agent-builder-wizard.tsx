"use client";

import { useState, useMemo, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/taxonomy";
import type {
  Category,
  InteractionMode,
  ModelPreference,
  OutputFormat,
  OutputDestinationType,
  AgentToolRef,
  InputWidget,
  InputWidgetType,
  AgentVisibility,
} from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  Check,
  ChevronRight,
  Code2,
  Download,
  Eye,
  FileText,
  Image,
  MessageSquare,
  Minus,
  Plus,

  Settings2,
  Sparkles,
  ToggleLeft,
  Trash2,
  Globe,
  HardDrive,
  Webhook,
  Wrench,
  Zap,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Form model
// ---------------------------------------------------------------------------

interface AgentForm {
  // Step 1
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  icon: string;
  category: Category;
  tagsInput: string;
  tags: string[];

  // Step 2
  systemPrompt: string;
  modelPreference: ModelPreference;
  temperature: number;
  maxTokens: number;

  // Step 3
  canSearchWeb: boolean;
  canScrape: boolean;
  canGenerateFiles: boolean;
  canRunCode: boolean;
  canGenerateImages: boolean;
  enabledTools: AgentToolRef[];

  // Step 4
  interactionMode: InteractionMode;
  inputWidgets: InputWidget[];
  outputFormat: OutputFormat;
  enabledDestinations: OutputDestinationType[];
  webhookUrl: string;
  googleDriveFolderName: string;

  // Step 5
  creatorFeeCredits: number;
  visibility: AgentVisibility;
}

const INITIAL: AgentForm = {
  name: "",
  slug: "",
  slugTouched: false,
  description: "",
  icon: "🤖",
  category: "development",
  tagsInput: "",
  tags: [],

  systemPrompt: "",
  modelPreference: "auto",
  temperature: 0.5,
  maxTokens: 4096,

  canSearchWeb: false,
  canScrape: false,
  canGenerateFiles: false,
  canRunCode: false,
  canGenerateImages: false,
  enabledTools: [],

  interactionMode: "chat",
  inputWidgets: [],
  outputFormat: "markdown",
  enabledDestinations: ["in-app", "download"],
  webhookUrl: "",
  googleDriveFolderName: "",

  creatorFeeCredits: 0,
  visibility: "public",
};

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

const STEPS = [
  {
    n: 1,
    label: "Identity",
    hint: "Name, description & category",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    n: 2,
    label: "Instructions",
    hint: "System prompt & model",
    icon: <Brain className="h-4 w-4" />,
  },
  {
    n: 3,
    label: "Tools",
    hint: "Capabilities & integrations",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    n: 4,
    label: "Input / Output",
    hint: "Interaction mode & delivery",
    icon: <Settings2 className="h-4 w-4" />,
  },
  {
    n: 5,
    label: "Publish",
    hint: "Pricing & visibility",
    icon: <Sparkles className="h-4 w-4" />,
  },
];

const EMOJI_OPTIONS = [
  "🤖", "📊", "🔍", "✍️", "⚡", "🎨", "📈", "🧠", "🔬", "💡",
  "🛡️", "📝", "🗂️", "🌐", "🔗", "📧", "🧪", "🎯", "📸", "🤝",
];

const MODEL_OPTIONS: { value: ModelPreference; label: string; desc: string }[] =
  [
    { value: "auto", label: "Auto (recommended)", desc: "AgentDock picks the best model for cost and quality" },
    { value: "gemini-pro", label: "Gemini Pro", desc: "Google's flagship model" },
    { value: "gemini-flash", label: "Gemini Flash", desc: "Fast and cost-effective" },
  ];

const BUILTIN_TOOLS: {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  formKey: keyof AgentForm;
}[] = [
  {
    id: "web-search",
    label: "Web Search",
    description: "Search the internet for current information",
    icon: <Globe className="h-4 w-4" />,
    formKey: "canSearchWeb",
  },
  {
    id: "web-scrape",
    label: "Web Scraping",
    description: "Extract data from web pages",
    icon: <Code2 className="h-4 w-4" />,
    formKey: "canScrape",
  },
  {
    id: "file-gen",
    label: "File Generation",
    description: "Create documents, CSVs, and files",
    icon: <FileText className="h-4 w-4" />,
    formKey: "canGenerateFiles",
  },
  {
    id: "code-exec",
    label: "Code Execution",
    description: "Run Python/JS code in a sandbox",
    icon: <Code2 className="h-4 w-4" />,
    formKey: "canRunCode",
  },
  {
    id: "image-gen",
    label: "Image Generation",
    description: "Create images from text prompts",
    icon: <Image className="h-4 w-4" />,
    formKey: "canGenerateImages",
  },
];

const DESTINATION_OPTIONS: {
  value: OutputDestinationType;
  label: string;
  icon: React.ReactNode;
  always?: boolean;
}[] = [
  { value: "in-app", label: "Show in app", icon: <Eye className="h-4 w-4" />, always: true },
  { value: "download", label: "Download as file", icon: <Download className="h-4 w-4" /> },
  { value: "webhook", label: "Webhook", icon: <Webhook className="h-4 w-4" /> },
  { value: "google-drive", label: "Google Drive", icon: <HardDrive className="h-4 w-4" /> },
];

const WIDGET_TYPE_OPTIONS: { value: InputWidgetType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "code", label: "Code Editor" },
  { value: "select", label: "Dropdown" },
  { value: "file", label: "File Upload" },
  { value: "toggle", label: "Toggle" },
  { value: "slider", label: "Slider" },
];

// ---------------------------------------------------------------------------
// Helper: estimated credits calculation
// ---------------------------------------------------------------------------

function estimateCredits(form: AgentForm): number {
  const BASE = 3; // base LLM cost
  let toolOverhead = 0;
  if (form.canSearchWeb) toolOverhead += 2;
  if (form.canScrape) toolOverhead += 2;
  if (form.canGenerateFiles) toolOverhead += 1;
  if (form.canRunCode) toolOverhead += 3;
  if (form.canGenerateImages) toolOverhead += 5;
  toolOverhead += form.enabledTools.length * 1.5;

  const modelMultiplier =
    form.modelPreference === "gemini-flash"
      ? 0.8
      : 1;

  const tokenScale = form.maxTokens / 4096;
  const total = Math.ceil(
    (BASE + toolOverhead) * modelMultiplier * tokenScale + form.creatorFeeCredits
  );
  return Math.max(1, total);
}

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

export function AgentBuilderWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [hasDriveAccess, setHasDriveAccess] = useState(false);
  const [isCheckingDrive, setIsCheckingDrive] = useState(false);

  useEffect(() => {
    const checkDriveStatus = async () => {
      setIsCheckingDrive(true);
      try {
        const res = await fetch("/api/auth/drive-status");
        if (res.ok) {
          const data = await res.json();
          setHasDriveAccess(data.hasDriveAccess);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsCheckingDrive(false);
      }
    };
    checkDriveStatus();
  }, []);
  const [form, setForm] = useState<AgentForm>({ ...INITIAL });
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const update = (partial: Partial<AgentForm>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const estimated = useMemo(() => estimateCredits(form), [form]);

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return form.name.trim().length > 0 && form.description.trim().length > 0;
      case 2:
        return form.systemPrompt.trim().length > 0;
      case 3:
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to publish agent");
      }
      setPublished(true);
    } catch (err: any) {
      alert(err.message || "Error publishing agent. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  if (published) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg py-24 text-center animate-fade-in-up">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-success-dim border-2 border-success/30 text-4xl overflow-hidden">
            {form.icon.startsWith("data:") || form.icon.startsWith("http") || form.icon.startsWith("/") ? (
              <img
                src={form.icon}
                alt={form.name}
                className="h-full w-full object-cover"
              />
            ) : (
              form.icon
            )}
          </div>
          <h1 className="text-3xl font-bold text-content">Agent Published! 🎉</h1>
          <p className="mt-3 text-base text-muted">
            <span className="font-semibold text-content">{form.name}</span> is now
            live on AgentDock. Users can run it immediately.
          </p>
          <div className="mt-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
            <p className="text-sm text-subtle">Estimated cost per run</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-content">
              ~{estimated}{" "}
              <span className="text-base font-medium text-muted">credits</span>
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="gap-2"
              onClick={() => router.push(`/agents/${form.slug || slugify(form.name)}`)}
            >
              View Agent
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push("/agents/browse")}
            >
              Browse Agents
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* ── Breadcrumb ──────────────────────────────────────────── */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-faint animate-fade-in">
          <Link href="/agents/browse" className="hover:text-content transition-colors">
            Agents
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-muted font-medium">Create Agent</span>
        </nav>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Create an Agent
          </h1>
          <p className="mt-2 text-sm text-muted">
            Define what your agent does, give it tools, and publish it for the
            community to use.
          </p>
        </div>

        {/* ── Step indicator ──────────────────────────────────────── */}
        <div className="mb-8 flex items-center gap-1 overflow-x-auto animate-fade-in">
          {STEPS.map((s, idx) => (
            <div key={s.n} className="flex items-center">
              <button
                onClick={() => s.n < step && setStep(s.n)}
                disabled={s.n > step}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                  step === s.n
                    ? "border-brand-line bg-brand-dim text-brand-muted shadow-sm"
                    : s.n < step
                      ? "border-success/30 bg-success-dim text-success cursor-pointer hover:bg-success/20"
                      : "border-line bg-surface text-faint cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                    step === s.n
                      ? "bg-brand text-white"
                      : s.n < step
                        ? "bg-success text-white"
                        : "bg-surface-3 text-faint"
                  )}
                >
                  {s.n < step ? <Check className="h-3 w-3" /> : s.n}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-px w-6 shrink-0",
                    idx + 1 < step ? "bg-success/50" : "bg-line"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Step content ────────────────────────────────────────── */}
        <div
          key={step}
          className="rounded-2xl border border-line bg-surface-2 p-6 sm:p-8 animate-fade-in"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-content flex items-center gap-2">
              {STEPS[step - 1].icon}
              {STEPS[step - 1].label}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {STEPS[step - 1].hint}
            </p>
          </div>

          {step === 1 && <StepIdentity form={form} update={update} />}
          {step === 2 && <StepInstructions form={form} update={update} />}
          {step === 3 && <StepTools form={form} update={update} />}
          {step === 4 && <StepIO form={form} update={update} />}
          {step === 5 && (
            <StepPublish
              form={form}
              update={update}
              estimated={estimated}
              onPublish={handlePublish}
              publishing={publishing}
            />
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────── */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="md"
            className="gap-2"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {step < 5 ? (
            <Button
              variant="primary"
              size="md"
              className="gap-2"
              disabled={!canAdvance()}
              onClick={() => setStep((s) => Math.min(5, s + 1))}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div /> /* publish button is in StepPublish */
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Shared input helpers
// ---------------------------------------------------------------------------

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-content"
    >
      {children}
    </label>
  );
}

function HintText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-faint">{children}</p>;
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-content placeholder:text-faint outline-none transition-colors focus:border-brand-line focus:ring-1 focus:ring-brand/30"
    />
  );
}

function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-content placeholder:text-faint outline-none transition-colors focus:border-brand-line focus:ring-1 focus:ring-brand/30 resize-y font-mono"
    />
  );
}

// ---------------------------------------------------------------------------
// Step 1: Identity
// ---------------------------------------------------------------------------

function StepIdentity({
  form,
  update,
}: {
  form: AgentForm;
  update: (p: Partial<AgentForm>) => void;
}) {
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCropSrc(event.target.result as string);
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cropSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropSrc) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!cropSrc || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !cropSrc || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const applyCrop = () => {
    if (!cropSrc) return;
    const img = new window.Image();
    img.src = cropSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, size, size);

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      const scaleToCover = Math.max(size / imgWidth, size / imgHeight);
      const baseWidth = imgWidth * scaleToCover;
      const baseHeight = imgHeight * scaleToCover;

      const scaleFactor = 256 / 192;
      const finalPanX = pan.x * scaleFactor;
      const finalPanY = pan.y * scaleFactor;

      ctx.save();
      // Draw circular clip
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.translate(size / 2 + finalPanX, size / 2 + finalPanY);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, -baseWidth / 2, -baseHeight / 2, baseWidth, baseHeight);
      ctx.restore();

      const croppedBase64 = canvas.toDataURL("image/png");
      update({ icon: croppedBase64 });
      setCropSrc(null);
    };
  };

  return (
    <div className="space-y-5">
      {/* Icon picker */}
      <div>
        <Label>Icon</Label>
        <div className="flex flex-col gap-4 items-center">
          {/* Emojis Row */}
          <div className="flex flex-wrap gap-2 justify-center">
            {EMOJI_OPTIONS.slice(0, 12).map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => update({ icon: emoji })}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl border text-xl transition-all",
                  form.icon === emoji
                    ? "border-brand-line bg-brand-dim shadow-sm scale-110"
                    : "border-line bg-surface hover:bg-surface-2"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Upload Button Row */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="icon-upload"
              onChange={handleFileChange}
              onClick={(e) => {
                (e.target as HTMLInputElement).value = "";
              }}
            />
            <label
              htmlFor="icon-upload"
              className={cn(
                "flex h-10 items-center gap-2 rounded-xl border px-4 cursor-pointer transition-all bg-surface hover:bg-surface-2 hover:border-brand-line/50 text-xs font-medium text-muted hover:text-content",
                form.icon.startsWith("data:") && "border-brand-line bg-brand-dim shadow-sm"
              )}
            >
              {form.icon.startsWith("data:") ? (
                <>
                  <div className="h-6 w-6 rounded-lg overflow-hidden shrink-0 border border-line">
                    <img
                      src={form.icon}
                      alt="Uploaded icon"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span>Change custom icon</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>Upload your own icon</span>
                </>
              )}
            </label>
            {form.icon.startsWith("data:") && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  update({ icon: "🤖" });
                }}
                className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white shadow hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cropper Modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-2 p-6 shadow-elevated flex flex-col items-center animate-scale-in">
            <div className="w-full flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-content">Adjust Icon</h3>
              <button
                onClick={() => setCropSrc(null)}
                className="text-muted hover:text-content transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Crop circle box */}
            <div className="relative w-48 h-48 rounded-full border-2 border-dashed border-brand/40 flex items-center justify-center p-1 bg-surface-3 shadow-inner overflow-hidden">
              <div
                className="w-full h-full rounded-full overflow-hidden cursor-move select-none relative bg-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                <img
                  src={cropSrc}
                  alt="Crop preview"
                  className="absolute pointer-events-none max-w-none origin-center"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  }}
                />
              </div>
            </div>
            <p className="mt-3 text-2xs text-faint">
              Drag to reposition image
            </p>

            {/* Zoom Slider */}
            <div className="mt-5 w-full space-y-1.5">
              <div className="flex items-center justify-between text-xs text-subtle">
                <span>Zoom</span>
                <span className="font-mono tabular-nums">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-faint" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-brand h-1 rounded-lg bg-surface-3 appearance-none cursor-pointer"
                />
                <Plus className="h-4 w-4 text-faint" />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 w-full flex gap-3">
              <button
                type="button"
                onClick={() => setCropSrc(null)}
                className="flex-1 h-9 rounded-lg border border-line text-xs font-semibold text-muted hover:text-content hover:bg-surface-3 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyCrop}
                className="flex-1 h-9 rounded-lg bg-brand text-brand-fg text-xs font-semibold hover:bg-brand-hover transition-colors"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Name */}
      <div>
        <Label htmlFor="agent-name">
          Agent name <span className="text-danger">*</span>
        </Label>
        <TextInput
          id="agent-name"
          value={form.name}
          onChange={(v) => {
            const upd: Partial<AgentForm> = { name: v };
            if (!form.slugTouched) upd.slug = slugify(v);
            update(upd);
          }}
          placeholder="e.g. Market Research Analyst"
          maxLength={80}
        />
      </div>

      {/* Slug */}
      <div>
        <Label htmlFor="agent-slug">URL slug</Label>
        <div className="flex items-center gap-1 text-xs text-faint mb-1.5">
          <span>agentdock.com/agents/</span>
          <span className="font-mono font-medium text-brand-muted">
            {form.slug || "your-agent"}
          </span>
        </div>
        <TextInput
          id="agent-slug"
          value={form.slug}
          onChange={(v) => update({ slug: slugify(v), slugTouched: true })}
          placeholder="market-research-analyst"
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="agent-desc">
          Description <span className="text-danger">*</span>
        </Label>
        <TextArea
          id="agent-desc"
          value={form.description}
          onChange={(v) => update({ description: v })}
          placeholder="What does this agent do? Be specific — this appears on the browse page."
          rows={3}
        />
        <HintText>
          {form.description.length}/300 characters recommended
        </HintText>
      </div>

      {/* Category */}
      <div>
        <Label>Category</Label>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => update({ category: cat.value })}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                form.category === cat.value
                  ? "border-brand-line bg-brand-dim text-brand-muted"
                  : "border-line bg-surface text-subtle hover:bg-surface-2 hover:text-content"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label htmlFor="agent-tags">Tags</Label>
        <TextInput
          id="agent-tags"
          value={form.tagsInput}
          onChange={(v) =>
            update({
              tagsInput: v,
              tags: v
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean),
            })
          }
          placeholder="comma, separated, tags"
        />
        {form.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-brand-line bg-brand-dim px-2 py-0.5 text-2xs font-medium text-brand-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Instructions
// ---------------------------------------------------------------------------

function StepInstructions({
  form,
  update,
}: {
  form: AgentForm;
  update: (p: Partial<AgentForm>) => void;
}) {
  return (
    <div className="space-y-5">
      {/* System prompt */}
      <div>
        <Label htmlFor="system-prompt">
          System prompt <span className="text-danger">*</span>
        </Label>
        <HintText>
          This is the core instruction that defines your agent&apos;s behavior.
          Be specific about what it should do, how it should respond, and what
          format to use.
        </HintText>
        <div className="mt-2">
          <TextArea
            id="system-prompt"
            value={form.systemPrompt}
            onChange={(v) => update({ systemPrompt: v })}
            placeholder={`You are a market research analyst. When given a topic, company, or industry:\n\n1. Research the market size and growth rate\n2. Identify top 5 competitors\n3. Analyze trends and emerging opportunities\n4. Provide actionable recommendations\n\nAlways cite sources. Use tables for comparative data.`}
            rows={10}
          />
        </div>
        <div className="mt-1 text-right text-xs text-faint tabular-nums">
          {form.systemPrompt.length} characters
        </div>
      </div>

      {/* Model preference */}
      <div>
        <Label>Model preference</Label>
        <div className="space-y-1.5">
          {MODEL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ modelPreference: opt.value })}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                form.modelPreference === opt.value
                  ? "border-brand-line bg-brand-dim"
                  : "border-line bg-surface hover:bg-surface-2"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                  form.modelPreference === opt.value
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface-3"
                )}
              >
                {form.modelPreference === opt.value && (
                  <Check className="h-3 w-3" />
                )}
              </span>
              <div>
                <span className="text-sm font-medium text-content">
                  {opt.label}
                </span>
                <span className="ml-2 text-xs text-subtle">{opt.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Temperature slider */}
      <div>
        <Label>Temperature</Label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={form.temperature}
            onChange={(e) => update({ temperature: parseFloat(e.target.value) })}
            className="flex-1 accent-brand"
          />
          <span className="w-10 text-right text-sm font-mono font-medium text-content tabular-nums">
            {form.temperature.toFixed(1)}
          </span>
        </div>
        <HintText>
          Low (0.0–0.3) = precise and consistent. High (0.7–1.0) = creative
          and varied.
        </HintText>
      </div>

      {/* Max tokens */}
      <div>
        <Label htmlFor="max-tokens">Max output tokens</Label>
        <select
          id="max-tokens"
          value={form.maxTokens}
          onChange={(e) => update({ maxTokens: parseInt(e.target.value) })}
          className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-content outline-none focus:border-brand-line"
        >
          <option value={1024}>1,024 — Short responses</option>
          <option value={2048}>2,048 — Medium responses</option>
          <option value={4096}>4,096 — Standard (recommended)</option>
          <option value={8192}>8,192 — Long-form content</option>
          <option value={16384}>16,384 — Very long output</option>
        </select>
        <HintText>Higher values allow longer responses but cost more credits.</HintText>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Tools
// ---------------------------------------------------------------------------

function StepTools({
  form,
  update,
}: {
  form: AgentForm;
  update: (p: Partial<AgentForm>) => void;
}) {
  const activeCount = BUILTIN_TOOLS.filter(
    (t) => form[t.formKey] as boolean
  ).length;

  return (
    <div className="space-y-6">
      {/* Built-in capabilities */}
      <div>
        <h3 className="text-sm font-semibold text-content mb-1">
          Built-in capabilities
        </h3>
        <p className="text-xs text-faint mb-3">
          Select what your agent can do. Each capability adds to the cost per
          run.
        </p>
        <div className="space-y-2">
          {BUILTIN_TOOLS.map((tool) => {
            const active = form[tool.formKey] as boolean;
            return (
              <button
                key={tool.id}
                onClick={() => update({ [tool.formKey]: !active })}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                  active
                    ? "border-brand-line bg-brand-dim"
                    : "border-line bg-surface hover:bg-surface-2"
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg border",
                    active
                      ? "border-brand/30 bg-brand/10 text-brand"
                      : "border-line bg-surface-3 text-subtle"
                  )}
                >
                  {tool.icon}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-content">
                    {tool.label}
                  </span>
                  <span className="block text-xs text-subtle">
                    {tool.description}
                  </span>
                </div>
                <span
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                    active
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-surface-3"
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Token overhead warning */}
      {activeCount > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning-dim px-4 py-3 text-xs text-warning">
          <span className="font-semibold">{activeCount} tools selected</span>{" "}
          — each tool adds ~800 tokens of overhead to the context window.
          Current tool overhead: ~{activeCount * 800} tokens/run.
        </div>
      )}

      {/* Skills/MCP placeholder */}
      <div className="rounded-xl border border-dashed border-line bg-surface/50 p-6 text-center">
        <Wrench className="mx-auto h-6 w-6 text-faint" />
        <p className="mt-2 text-sm font-medium text-muted">
          Skills &amp; MCP Server tools
        </p>
        <p className="mt-1 text-xs text-faint max-w-sm mx-auto">
          Connect tools from the AgentDock registry to give your agent more
          capabilities. Coming soon — tools from the Skills and MCP tabs will be
          selectable here.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Input / Output
// ---------------------------------------------------------------------------

function StepIO({
  form,
  update,
}: {
  form: AgentForm;
  update: (p: Partial<AgentForm>) => void;
}) {
  const addWidget = () => {
    update({
      inputWidgets: [
        ...form.inputWidgets,
        {
          id: `field-${Date.now()}`,
          type: "text",
          label: "",
          required: false,
        },
      ],
    });
  };

  const updateWidget = (idx: number, changes: Partial<InputWidget>) => {
    const next = [...form.inputWidgets];
    next[idx] = { ...next[idx], ...changes };
    update({ inputWidgets: next });
  };

  const removeWidget = (idx: number) => {
    update({ inputWidgets: form.inputWidgets.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      {/* Interaction mode */}
      <div>
        <Label>Interaction mode</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(
            [
              { value: "chat", label: "Chat", desc: "Natural language conversation", icon: <MessageSquare className="h-4 w-4" /> },
              { value: "form", label: "Form", desc: "Structured input fields", icon: <FileText className="h-4 w-4" /> },
              { value: "hybrid", label: "Hybrid", desc: "Form + chat follow-ups", icon: <Settings2 className="h-4 w-4" /> },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ interactionMode: opt.value })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                form.interactionMode === opt.value
                  ? "border-brand-line bg-brand-dim"
                  : "border-line bg-surface hover:bg-surface-2"
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg",
                  form.interactionMode === opt.value
                    ? "bg-brand/10 text-brand"
                    : "bg-surface-3 text-subtle"
                )}
              >
                {opt.icon}
              </span>
              <span className="text-sm font-medium text-content">
                {opt.label}
              </span>
              <span className="text-2xs text-subtle">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom input fields */}
      {(form.interactionMode === "form" ||
        form.interactionMode === "hybrid") && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Custom input fields</Label>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={addWidget}
            >
              <Plus className="h-3.5 w-3.5" />
              Add field
            </Button>
          </div>

          {form.inputWidgets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface/50 p-6 text-center">
              <p className="text-sm text-muted">No custom fields yet.</p>
              <p className="mt-1 text-xs text-faint">
                Add fields like text inputs, dropdowns, or file uploads
                that users fill in before running the agent.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {form.inputWidgets.map((widget, idx) => (
                <div
                  key={widget.id}
                  className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3"
                >
                  <div className="grid flex-1 min-w-0 grid-cols-1 sm:grid-cols-3 gap-2">
                    <TextInput
                      value={widget.label}
                      onChange={(v) => updateWidget(idx, { label: v })}
                      placeholder="Field label"
                    />
                    <select
                      value={widget.type}
                      onChange={(e) =>
                        updateWidget(idx, {
                          type: e.target.value as InputWidgetType,
                        })
                      }
                      className="h-10 rounded-lg border border-line bg-surface px-2 text-sm text-content outline-none focus:border-brand-line"
                    >
                      {WIDGET_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={widget.required ?? false}
                          onChange={(e) =>
                            updateWidget(idx, { required: e.target.checked })
                          }
                          className="accent-brand"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => removeWidget(idx)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-subtle hover:text-danger hover:border-danger/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Output format */}
      <div>
        <Label>Default output format</Label>
        <div className="flex flex-wrap gap-1.5">
          {(["markdown", "json", "csv", "plain"] as OutputFormat[]).map(
            (fmt) => (
              <button
                key={fmt}
                onClick={() => update({ outputFormat: fmt })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                  form.outputFormat === fmt
                    ? "border-brand-line bg-brand-dim text-brand-muted"
                    : "border-line bg-surface text-subtle hover:bg-surface-2"
                )}
              >
                {fmt}
              </button>
            )
          )}
        </div>
      </div>

      {/* Output destinations */}
      <div>
        <Label>Output destinations</Label>
        <HintText>
          Where users can send the agent&apos;s results. &quot;Show in app&quot; is always
          enabled.
        </HintText>
        <div className="mt-2 space-y-1.5">
          {DESTINATION_OPTIONS.map((dest) => {
            const active =
              dest.always || form.enabledDestinations.includes(dest.value);
            return (
              <button
                key={dest.value}
                disabled={dest.always}
                onClick={() => {
                  if (dest.always) return;
                  const next = active
                    ? form.enabledDestinations.filter(
                        (d) => d !== dest.value
                      )
                    : [...form.enabledDestinations, dest.value];
                  update({ enabledDestinations: next });
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-all",
                  active
                    ? "border-brand-line bg-brand-dim"
                    : "border-line bg-surface hover:bg-surface-2",
                  dest.always && "opacity-70 cursor-default"
                )}
              >
                <span className={cn("text-sm", active ? "text-brand" : "text-subtle")}>
                  {dest.icon}
                </span>
                <span className="text-sm font-medium text-content">
                  {dest.label}
                </span>
                {dest.always && (
                  <span className="ml-auto text-2xs text-faint">
                    Always on
                  </span>
                )}
                {!dest.always && (
                  <span
                    className={cn(
                      "ml-auto grid h-5 w-5 place-items-center rounded-md border",
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-surface-3"
                    )}
                  >
                    {active && <Check className="h-3 w-3" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {form.enabledDestinations.includes("webhook") && (
          <div className="mt-3 space-y-1.5">
            <Label>Webhook URL</Label>
            <HintText>
              The agent&apos;s output will be POSTed to this URL as JSON when a
              run completes.
            </HintText>
            <input
              type="url"
              placeholder="https://example.com/webhook"
              value={form.webhookUrl}
              onChange={(e) => update({ webhookUrl: e.target.value })}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        )}
        {form.enabledDestinations.includes("google-drive") && (
          <div className="mt-3 space-y-1.5">
            {!hasDriveAccess ? (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="text-warning mt-0.5"><HardDrive className="h-5 w-5" /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-warning">Google Drive Access Required</h4>
                    <p className="text-xs text-warning/80 mt-1">
                      You must connect your Google account with Drive permissions to save agent outputs here.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white text-black hover:bg-gray-100 dark:bg-white dark:text-black dark:hover:bg-gray-200 border-line"
                  onClick={() => signIn("google", { callbackUrl: window.location.href }, { scope: "openid email profile https://www.googleapis.com/auth/drive.file", prompt: "consent", access_type: "offline" })}
                >
                  Connect Google Drive
                </Button>
              </div>
            ) : (
              <>
                <Label>Google Drive Folder Name</Label>
                <HintText>
                  Leave blank to save to your root Google Drive directory. If the folder doesn't exist, we'll create it for you!
                </HintText>
                <input
                  type="text"
                  placeholder="e.g. Nuclexa or Output Files"
                  value={form.googleDriveFolderName}
                  onChange={(e) => update({ googleDriveFolderName: e.target.value })}
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-content placeholder:text-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Publish
// ---------------------------------------------------------------------------

function StepPublish({
  form,
  update,
  estimated,
  onPublish,
  publishing,
}: {
  form: AgentForm;
  update: (p: Partial<AgentForm>) => void;
  estimated: number;
  onPublish: () => void;
  publishing: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Cost preview */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold text-content mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          Estimated cost per run
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-surface-2 border border-line p-3">
            <p className="text-2xs text-faint uppercase tracking-wide">
              Base (tokens + tools)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-content">
              ~{Math.max(1, estimated - form.creatorFeeCredits)}
            </p>
            <p className="text-2xs text-subtle">credits</p>
          </div>
          <div className="rounded-lg bg-surface-2 border border-line p-3">
            <p className="text-2xs text-faint uppercase tracking-wide">
              Your fee
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-content">
              {form.creatorFeeCredits}
            </p>
            <p className="text-2xs text-subtle">credits/run</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-brand-dim border border-brand-line p-3 text-center">
          <p className="text-2xs text-faint uppercase tracking-wide">
            Total cost to users
          </p>
          <p className="text-2xl font-bold tabular-nums text-brand">
            ~{estimated}{" "}
            <span className="text-base font-medium text-brand-muted">
              credits
            </span>
          </p>
          <p className="text-2xs text-subtle">
            ≈ ${(estimated * 0.01).toFixed(2)} per run
          </p>
        </div>
      </div>

      {/* Creator fee */}
      <div>
        <Label htmlFor="creator-fee">
          Your fee per run (credits)
        </Label>
        <HintText>
          Set to 0 for a free agent. Each credit = $0.01. You earn this amount
          every time someone runs your agent.
        </HintText>
        <div className="mt-2">
          <input
            id="creator-fee"
            type="number"
            min="0"
            max="100"
            value={form.creatorFeeCredits}
            onChange={(e) =>
              update({
                creatorFeeCredits: Math.max(
                  0,
                  parseInt(e.target.value) || 0
                ),
              })
            }
            className="h-10 w-32 rounded-lg border border-line bg-surface px-3 text-sm text-content outline-none focus:border-brand-line tabular-nums"
          />
        </div>
      </div>

      {/* Visibility */}
      <div>
        <Label>Visibility</Label>
        <div className="space-y-1.5">
          {(
            [
              { value: "public", label: "Public", desc: "Listed on the Agents tab, anyone can run it" },
              { value: "unlisted", label: "Unlisted", desc: "Only accessible via direct link" },
              { value: "private", label: "Private", desc: "Only you can run it" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ visibility: opt.value })}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                form.visibility === opt.value
                  ? "border-brand-line bg-brand-dim"
                  : "border-line bg-surface hover:bg-surface-2"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                  form.visibility === opt.value
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-surface-3"
                )}
              >
                {form.visibility === opt.value && (
                  <Check className="h-3 w-3" />
                )}
              </span>
              <div>
                <span className="text-sm font-medium text-content">
                  {opt.label}
                </span>
                <span className="block text-xs text-subtle">{opt.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold text-content mb-3">
          Summary
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-subtle">Name</dt>
            <dd className="font-medium text-content">{form.name || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Category</dt>
            <dd className="font-medium text-content capitalize">
              {form.category}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Model</dt>
            <dd className="font-medium text-content">
              {MODEL_OPTIONS.find((m) => m.value === form.modelPreference)
                ?.label ?? "Auto"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Interaction</dt>
            <dd className="font-medium text-content capitalize">
              {form.interactionMode}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-subtle">Visibility</dt>
            <dd className="font-medium text-content capitalize">
              {form.visibility}
            </dd>
          </div>
        </dl>
      </div>

      {/* Publish button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full gap-2"
        onClick={onPublish}
        disabled={publishing || !form.name.trim() || !form.systemPrompt.trim()}
      >
        {publishing ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Publishing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Publish Agent
          </>
        )}
      </Button>
    </div>
  );
}
