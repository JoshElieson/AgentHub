"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PACKAGE_TYPES,
  PLATFORMS,
  CATEGORIES,
  LICENSES,
  PERMISSION_KEYS,
  PERMISSION_META,
  RISK_LABELS,
  aggregateRisk,
} from "@/lib/taxonomy";
import type {
  Category,
  License,
  PackageType,
  PermissionKey,
  Permissions,
  Platform,
  RiskLevel,
} from "@/lib/types";
import { useDisplayUser, type ClientUser } from "@/components/providers";
import { cn, slugify, formatCompact } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Badge,
  LicenseBadge,
  PlatformBadge,
  RiskBadge,
  TypeBadge,
  VerifiedBadge,
} from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
import { CommandBlock } from "@/components/ui/command-block";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Boxes,
  UploadCloud,
  Github,
  ClipboardPaste,
  LayoutTemplate,
  AlertTriangle,
  Shield,
  FileText,
  ShieldCheck,
  Tag as TagIcon,
  Eye,
  Rocket,
  CheckCircle2,
  PartyPopper,
  ExternalLink,
  Download,
  ThumbsUp,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Form model
// ---------------------------------------------------------------------------

type SourcePath = "github" | "manual";

interface PublishForm {
  type: PackageType | null;
  source: SourcePath | null;
  githubUrl: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  tagline: string;
  description: string;
  category: Category;
  tagsInput: string;
  tags: string[];
  license: License;
  sourceRepo: string;
  website: string;
  platforms: Platform[];
  permissions: Permissions;
}

const EMPTY_PERMISSIONS: Permissions = PERMISSION_KEYS.reduce((acc, k) => {
  acc[k] = false;
  return acc;
}, {} as Permissions);

const INITIAL_FORM: PublishForm = {
  type: "claude-skill",
  source: null,
  githubUrl: "",
  name: "",
  slug: "",
  slugTouched: false,
  tagline: "",
  description: "",
  category: "development",
  tagsInput: "",
  tags: [],
  license: "MIT",
  sourceRepo: "",
  website: "",
  platforms: [],
  permissions: { ...EMPTY_PERMISSIONS },
};

// ---------------------------------------------------------------------------
// Step metadata
// ---------------------------------------------------------------------------

const STEPS: {
  n: number;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  { n: 1, label: "Source", hint: "Import or manual", icon: <UploadCloud className="h-4 w-4" /> },
  { n: 2, label: "Metadata", hint: "Name, tags, platforms", icon: <FileText className="h-4 w-4" /> },
  { n: 3, label: "Preview", hint: "Review & publish", icon: <Eye className="h-4 w-4" /> },
];

const SOURCE_OPTIONS: {
  value: SourcePath;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "github",
    label: "Import from GitHub",
    description: "Point Nuclexa at a public repository.",
    icon: <Github className="h-5 w-5" />,
  },
  {
    value: "manual",
    label: "Manual Entry",
    description: "Manually fill out all package fields.",
    icon: <ClipboardPaste className="h-5 w-5" />,
  },
];


const RISK_PILL: Record<RiskLevel, { dot: string; cls: string }> = {
  low: { dot: "bg-success", cls: "bg-success-dim text-success border-success/30" },
  medium: { dot: "bg-warning", cls: "bg-warning-dim text-warning border-warning/30" },
  high: { dot: "bg-danger", cls: "bg-danger-dim text-danger border-danger/30" },
};

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

export function PublishWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PublishForm>(INITIAL_FORM);
  const [published, setPublished] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);

  const update = <K extends keyof PublishForm>(key: K, value: PublishForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Slug auto-suggest from name unless the user has edited the slug directly.
  const setName = (name: string) =>
    setForm((f) => ({
      ...f,
      name,
      slug: f.slugTouched ? f.slug : slugify(name),
    }));

  const setSlug = (slug: string) =>
    setForm((f) => ({ ...f, slug: slugify(slug), slugTouched: true }));

  const togglePlatform = (p: Platform) =>
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p)
        ? f.platforms.filter((x) => x !== p)
        : [...f.platforms, p],
    }));

  const togglePermission = (k: PermissionKey) =>
    setForm((f) => ({
      ...f,
      permissions: { ...f.permissions, [k]: !f.permissions[k] },
    }));

  const commitTags = (raw: string) =>
    setForm((f) => {
      const next = raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const merged = Array.from(new Set([...f.tags, ...next]));
      return { ...f, tags: merged, tagsInput: "" };
    });

  const removeTag = (t: string) =>
    setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  // --- Slug availability check ----------------------------------------------
  useEffect(() => {
    if (!form.slug || step !== 2) {
      setSlugTaken(false);
      setCheckingSlug(false);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const res = await fetch(`/api/agents/${encodeURIComponent(form.slug)}`);
        if (res.ok) {
          setSlugTaken(true);
        } else {
          setSlugTaken(false);
        }
      } catch (e) {
        // Fallback to allowing if the request fails
        setSlugTaken(false);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.slug, step]);

  // --- Per-step validation --------------------------------------------------

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        if (!form.source) return false;
        if (form.source === "github") return form.githubUrl.trim().length > 3;
        return true;
      case 2:
        return (
          form.name.trim().length > 0 &&
          form.slug.trim().length > 0 &&
          !slugTaken &&
          !checkingSlug &&
          form.tagline.trim().length > 0 &&
          form.platforms.length > 0
        );
      case 3:
        return true;
      default:
        return false;
    }
  }, [step, form]);

  const goNext = () => {
    if (!stepValid) return;
    setStep((s) => Math.min(3, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const sessionUser = useDisplayUser();
  // Publish is an authenticated route; fall back to a neutral placeholder while
  // the session resolves so the live preview always has something to render.
  const user: ClientUser = sessionUser ?? {
    id: null,
    name: "You",
    username: "you",
    avatarColor: null,
    image: null,
    isVerified: false,
  };
  const risk = aggregateRisk(form.permissions);
  const packageId = form.slug || "your-package";

  return (
    <div className="py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-content sm:text-3xl">
          Publish a package
        </h1>
        <p className="text-sm text-muted">
          Ship an agent, skill, MCP server, workflow, or prompt pack to the
          Nuclexa registry — versioned, permission-scoped, and installable
          everywhere.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Stepper */}
        <Stepper step={step} published={published} onJump={(n) => !published && n < step && setStep(n)} />

        {/* Step body */}
        <div className="min-w-0">
          {published ? (
            <SuccessPanel form={form} packageId={packageId} />
          ) : (
            <div className="animate-fade-in">
              {step === 1 && <StepSource form={form} update={update} />}
              {step === 2 && (
                <StepMetadata
                  form={form}
                  setName={setName}
                  setSlug={setSlug}
                  update={update}
                  togglePlatform={togglePlatform}
                  commitTags={commitTags}
                  removeTag={removeTag}
                  checkingSlug={checkingSlug}
                  slugTaken={slugTaken}
                />
              )}
              {step === 3 && (
                <StepPreview form={form} user={user} packageId={packageId} risk={risk} />
              )}

              {/* Footer nav */}
              <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
                <Button
                  variant="ghost"
                  onClick={goBack}
                  disabled={step === 1}
                  className={cn(step === 1 && "invisible")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {step < 3 ? (
                  <div className="flex items-center gap-3">
                    {!stepValid && (
                      <span className="hidden text-xs text-subtle sm:inline">
                        Complete this step to continue
                      </span>
                    )}
                    <Button
                      variant="primary"
                      onClick={goNext}
                      disabled={!stepValid}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setPublished(true)}
                  >
                    <Rocket className="h-4 w-4" />
                    Publish package
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

function Stepper({
  step,
  published,
  onJump,
}: {
  step: number;
  published: boolean;
  onJump: (n: number) => void;
}) {
  return (
    <nav aria-label="Publish steps" className="lg:sticky lg:top-20 lg:self-start">
      {/* Mobile: compact progress */}
      <div className="mb-2 flex items-center justify-between lg:hidden">
        <span className="text-sm font-medium text-content">
          Step {published ? 3 : step} of 3
        </span>
        <span className="text-xs text-subtle">{STEPS[Math.min(step, 3) - 1].label}</span>
      </div>
      <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-surface-2 lg:hidden">
        <div
          className="h-full rounded-full bg-brand transition-all duration-300"
          style={{ width: `${((published ? 3 : step) / 3) * 100}%` }}
        />
      </div>

      {/* Desktop: vertical stepper */}
      <ol className="hidden flex-col gap-1 lg:flex">
        {STEPS.map((s) => {
          const done = published || s.n < step;
          const current = !published && s.n === step;
          const clickable = !published && s.n < step;
          return (
            <li key={s.n}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump(s.n)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  current
                    ? "border-brand-line bg-brand-dim"
                    : "border-transparent",
                  clickable && "hover:bg-surface-2",
                  !clickable && !current && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                    done && "border-brand bg-brand text-brand-fg",
                    current && "border-brand-line bg-brand-dim text-brand-muted",
                    !done && !current && "border-line bg-surface-2 text-subtle"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : s.n}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-sm font-medium",
                      current ? "text-content" : done ? "text-muted" : "text-subtle"
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="block truncate text-2xs text-subtle">
                    {s.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function StepHeading({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <div className="text-2xs font-semibold uppercase tracking-wider text-brand-muted">
        Step {step} of 3
      </div>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-content">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-sm font-medium text-content">
        {label}
        {required && <span className="text-danger">*</span>}
        {hint && <span className="font-normal text-subtle">· {hint}</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-content placeholder:text-faint transition-colors focus:border-brand-line focus:outline-none focus:ring-2 focus:ring-brand/20";


// ---------------------------------------------------------------------------
// Step 2 — Source
// ---------------------------------------------------------------------------

function StepSource({
  form,
  update,
}: {
  form: PublishForm;
  update: <K extends keyof PublishForm>(k: K, v: PublishForm[K]) => void;
}) {
  return (
    <div>
      <StepHeading
        step={1}
        title="Add your package source"
        description="Pick how you want to bring your files in. You can change this later."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SOURCE_OPTIONS.map((o) => {
          const selected = form.source === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => update("source", o.value)}
              aria-pressed={selected}
              className={cn(
                "flex items-start gap-3 rounded-card border p-4 text-left transition-colors duration-150",
                selected
                  ? "border-brand bg-brand-dim"
                  : "border-line bg-surface hover:border-line-strong hover:bg-surface-2"
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl border",
                  selected
                    ? "border-brand-line bg-brand text-brand-fg"
                    : "border-line bg-surface-2 text-brand-muted"
                )}
              >
                {o.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-content">
                  {o.label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {o.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Path-specific panel */}
      {form.source && (
        <div className="mt-5 animate-slide-up">
          {form.source === "github" && (
            <div className="card p-4">
              <Field
                label="Repository URL"
                required
                hint="public repo"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-muted">
                    <Github className="h-4 w-4" />
                  </span>
                  <input
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => update("githubUrl", e.target.value)}
                    placeholder="https://github.com/your-org/your-agent"
                    className={inputCls}
                  />
                </div>
              </Field>
              <p className="mt-2 text-xs text-subtle">
                We&apos;ll read your manifest, README, and version tags from the
                default branch.
              </p>
            </div>
          )}

          {form.source === "manual" && (
            <div className="card p-4">
              <p className="text-sm text-subtle">
                You can manually fill out all of the fields in the following steps.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Metadata
// ---------------------------------------------------------------------------

function StepMetadata({
  form,
  setName,
  setSlug,
  update,
  togglePlatform,
  commitTags,
  removeTag,
  checkingSlug,
  slugTaken,
}: {
  form: PublishForm;
  setName: (v: string) => void;
  setSlug: (v: string) => void;
  update: <K extends keyof PublishForm>(k: K, v: PublishForm[K]) => void;
  togglePlatform: (p: Platform) => void;
  commitTags: (v: string) => void;
  removeTag: (v: string) => void;
  checkingSlug?: boolean;
  slugTaken?: boolean;
}) {
  return (
    <div>
      <StepHeading
        step={2}
        title="Describe your package"
        description="This is what people see on your listing and in search results."
      />

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Security Review"
              className={inputCls}
            />
          </Field>
          <Field label="Slug" required hint="unique identifier">
            <div className={cn(
              "flex items-center rounded-lg border bg-surface-2 focus-within:border-brand-line focus-within:ring-2 focus-within:ring-brand/20",
              slugTaken ? "border-danger text-danger" : "border-line"
            )}>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="security-review"
                className="w-full bg-transparent px-3 py-2 font-mono text-sm text-content placeholder:text-faint focus:outline-none"
              />
              {form.slug.trim().length > 0 && (
                <div className="pr-3 flex items-center">
                  {checkingSlug ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-r-transparent" />
                  ) : slugTaken ? (
                    <X className="h-4 w-4 text-danger" />
                  ) : (
                    <Check className="h-4 w-4 text-success" />
                  )}
                </div>
              )}
            </div>
            {slugTaken && (
              <p className="mt-1.5 text-xs font-medium text-danger">This slug is already taken.</p>
            )}
          </Field>
        </div>

        <Field label="Short description" required hint="one line shown on cards">
          <input
            type="text"
            value={form.tagline}
            onChange={(e) => update("tagline", e.target.value)}
            placeholder="Audits code for vulnerabilities before you ship."
            maxLength={120}
            className={inputCls}
          />
        </Field>

        <Field label="Long description" hint="markdown supported">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={5}
            placeholder="Explain what your package does, how it works, and when to use it…"
            className={cn(inputCls, "leading-relaxed")}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Category" required>
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as Category)}
              className={cn(inputCls, "appearance-none")}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="License">
            <select
              value={form.license}
              onChange={(e) => update("license", e.target.value as License)}
              className={cn(inputCls, "appearance-none")}
            >
              {LICENSES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Tags" hint="comma-separated, press Enter">
          <div
            className={cn(
              inputCls,
              "flex flex-wrap items-center gap-1.5 py-1.5"
            )}
          >
            {form.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-md bg-surface-3 py-0.5 pl-2 pr-1 text-2xs font-medium text-content"
              >
                <TagIcon className="h-3 w-3 text-subtle" />
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="grid h-4 w-4 place-items-center rounded text-subtle hover:bg-overlay hover:text-content"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={form.tagsInput}
              onChange={(e) => update("tagsInput", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  if (form.tagsInput.trim()) commitTags(form.tagsInput);
                } else if (
                  e.key === "Backspace" &&
                  !form.tagsInput &&
                  form.tags.length
                ) {
                  removeTag(form.tags[form.tags.length - 1]);
                }
              }}
              onBlur={() => form.tagsInput.trim() && commitTags(form.tagsInput)}
              placeholder={form.tags.length ? "" : "security, audit, sast"}
              className="min-w-[8rem] flex-1 bg-transparent text-sm text-content placeholder:text-faint focus:outline-none"
            />
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Source repository" hint="optional">
            <input
              type="url"
              value={form.sourceRepo}
              onChange={(e) => update("sourceRepo", e.target.value)}
              placeholder="https://github.com/org/repo"
              className={inputCls}
            />
          </Field>
          <Field label="Website" hint="optional">
            <input
              type="url"
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="https://your-docs.dev"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Supported platforms" required hint="select at least one">
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const selected = form.platforms.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePlatform(p.value)}
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border py-1 pl-1 pr-2.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-brand-line bg-brand-dim text-brand-muted"
                      : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-content"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded font-mono text-[9px] font-semibold",
                      selected
                        ? "bg-brand text-brand-fg"
                        : "bg-overlay text-content/80"
                    )}
                  >
                    {p.glyph}
                  </span>
                  {p.label}
                  {selected && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Step 5 — Preview & publish
// ---------------------------------------------------------------------------

function StepPreview({
  form,
  user,
  packageId,
  risk,
}: {
  form: PublishForm;
  user: ClientUser;
  packageId: string;
  risk: RiskLevel;
}) {
  return (
    <div>
      <StepHeading
        step={3}
        title="Preview & publish"
        description="Here's how your listing will appear. Publishing creates v0.1.0."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Summary */}
        <div className="space-y-5">
          <SummaryRow label="Type">
            {form.type ? <TypeBadge type={form.type} /> : <Muted>—</Muted>}
          </SummaryRow>
          <SummaryRow label="Category">
            <span className="text-sm text-content">
              {CATEGORIES.find((c) => c.value === form.category)?.label}
            </span>
          </SummaryRow>
          <SummaryRow label="Platforms">
            <div className="flex flex-wrap gap-1.5">
              {form.platforms.length ? (
                form.platforms.map((p) => <PlatformBadge key={p} platform={p} />)
              ) : (
                <Muted>None selected</Muted>
              )}
            </div>
          </SummaryRow>
          <SummaryRow label="License">
            <LicenseBadge license={form.license} />
          </SummaryRow>
          <SummaryRow label="Permissions">
            <RiskBadge risk={risk} />
          </SummaryRow>
          {form.tags.length > 0 && (
            <SummaryRow label="Tags">
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-subtle"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </SummaryRow>
          )}

          <div className="rounded-card border border-line bg-surface-2 p-4">
            <div className="text-xs font-medium text-subtle">
              Install command (after publish)
            </div>
            <div className="mt-2">
              <CommandBlock command={`npx nuclexa install ${packageId}`} />
            </div>
          </div>
        </div>

        {/* Live card preview */}
        <div>
          <div className="mb-2 text-2xs font-semibold uppercase tracking-wider text-subtle">
            Listing preview
          </div>
          <PreviewCard form={form} user={user} packageId={packageId} risk={risk} />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-line pb-3">
      <span className="w-24 shrink-0 pt-0.5 text-xs font-medium text-subtle">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-faint">{children}</span>;
}

/**
 * Inline preview that mirrors the AgentCard visual language using live form
 * data (no real AgentPackage exists yet).
 */
function PreviewCard({
  form,
  user,
  packageId,
  risk,
}: {
  form: PublishForm;
  user: ClientUser;
  packageId: string;
  risk: RiskLevel;
}) {
  const name = form.name || "Your package";
  return (
    <div className="relative flex flex-col rounded-card border border-line bg-surface p-4 shadow-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar
            name={name}
            color={user.avatarColor ?? undefined}
            image={user.image}
            size="lg"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-semibold text-content">
                {name}
              </h3>
              {user.isVerified && <VerifiedBadge />}
            </div>
            <div className="mt-0.5 truncate text-xs text-subtle">
              {user.username}
              <span className="mx-1 text-faint">/</span>
              <span className="font-mono">{packageId}</span>
            </div>
          </div>
        </div>
        {form.type && <TypeBadge type={form.type} className="shrink-0" />}
      </div>

      {/* Tagline */}
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
        {form.tagline || "Your short description appears here."}
      </p>

      {/* Platforms */}
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {form.platforms.length ? (
          form.platforms.slice(0, 5).map((p) => (
            <span
              key={p}
              className="grid h-4 w-4 place-items-center rounded border border-line bg-surface-2 font-mono text-[9px] font-semibold text-content/80"
              title={PLATFORMS.find((x) => x.value === p)?.label}
            >
              {PLATFORMS.find((x) => x.value === p)?.glyph}
            </span>
          ))
        ) : (
          <span className="text-2xs text-faint">No platforms yet</span>
        )}
      </div>

      {/* Trust row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <RiskBadge risk={risk} />
        <LicenseBadge license={form.license} />
        <Badge variant="outline">New</Badge>
      </div>

      {/* Tags */}
      {form.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {form.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-subtle"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Stats (zeroed — brand new) */}
      <div className="mt-4 flex items-center gap-3 border-t border-line pt-3 text-xs text-subtle">
        <RatingStars rating={0} size="sm" showValue />
        <span className="flex items-center gap-1 tabular-nums" title="Installs">
          <Download className="h-3.5 w-3.5" />
          {formatCompact(0)}
        </span>
        <span className="flex items-center gap-1 tabular-nums" title="Likes">
          <ThumbsUp className="h-3.5 w-3.5" />
          {formatCompact(0)}
        </span>
        <span className="ml-auto whitespace-nowrap">just now</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success panel
// ---------------------------------------------------------------------------

function SuccessPanel({
  form,
  packageId,
}: {
  form: PublishForm;
  packageId: string;
}) {
  const name = form.name || "Your package";
  return (
    <div className="animate-scale-in">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-8 text-center sm:p-12">
        <div className="relative">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-success/30 bg-success-dim text-success">
            <Check className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <h2 className="mt-5 flex items-center justify-center gap-2 text-2xl font-semibold tracking-tight text-content">
            <PartyPopper className="h-6 w-6 text-warning" />
            Published!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            <span className="font-medium text-content">{name}</span> is live on
            Nuclexa as <span className="font-mono text-content">v0.1.0</span>.
            It&apos;s now installable everywhere.
          </p>

          <div className="mx-auto mt-6 max-w-md text-left">
            <CommandBlock
              command={`npx nuclexa install ${packageId}`}
              label="Anyone can install it with"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/agents/${packageId}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand/40 bg-brand px-5 text-sm font-medium text-brand-fg shadow-sm shadow-brand/20 transition-colors hover:bg-brand/90"
            >
              View listing
              <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface-2 px-5 text-sm font-medium text-content transition-colors hover:bg-surface-3"
            >
              Go to dashboard
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-transparent px-5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-content"
            >
              Browse marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            icon: <ShieldCheck className="h-4 w-4" />,
            title: "Request a security review",
            body: "Earn the Security Reviewed badge to build trust.",
          },
          {
            icon: <FileText className="h-4 w-4" />,
            title: "Add a README",
            body: "Rich docs and examples convert browsers into installs.",
          },
          {
            icon: <CheckCircle2 className="h-4 w-4" />,
            title: "Cut a stable release",
            body: "Tag v1.0.0 once your package is production-ready.",
          },
        ].map((c, i) => (
          <div key={i} className="card p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-brand-line bg-brand-dim text-brand-muted">
              {c.icon}
            </span>
            <h3 className="mt-3 text-sm font-semibold text-content">{c.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
