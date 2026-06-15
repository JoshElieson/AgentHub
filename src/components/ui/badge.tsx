import { cn } from "@/lib/utils";
import {
  PACKAGE_TYPE_SHORT,
  PLATFORM_META,
  RISK_LABELS,
} from "@/lib/taxonomy";
import type { License, PackageType, Platform, RiskLevel } from "@/lib/types";
import { BadgeCheck, ShieldCheck } from "lucide-react";

type BadgeVariant =
  | "default"
  | "outline"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const VARIANTS: Record<BadgeVariant, string> = {
  default: "bg-surface-2 text-muted border-line",
  outline: "bg-transparent text-muted border-line",
  brand: "bg-brand-dim text-brand-muted border-brand-line",
  success: "bg-success-dim text-success border-success/30",
  warning: "bg-warning-dim text-warning border-warning/30",
  danger: "bg-danger-dim text-danger border-danger/30",
  info: "bg-info-dim text-info border-info/30",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-2xs font-medium leading-none",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// --- Type badge -------------------------------------------------------------

const TYPE_VARIANT: Record<PackageType, BadgeVariant> = {
  agent: "brand",
  "claude-skill": "info",
  "cursor-rule": "warning",
  "mcp-server": "success",
  workflow: "default",
  "prompt-pack": "default",
  "custom-mode": "info",
  "tool-adapter": "success",
  "agent-template": "brand",
  automation: "warning",
};

export function TypeBadge({
  type,
  className,
}: {
  type: PackageType;
  className?: string;
}) {
  return (
    <Badge
      variant={TYPE_VARIANT[type]}
      className={cn("font-semibold uppercase tracking-wider", className)}
    >
      {PACKAGE_TYPE_SHORT[type]}
    </Badge>
  );
}

// --- Platform badge ---------------------------------------------------------

export function PlatformBadge({
  platform,
  showLabel = true,
  className,
}: {
  platform: Platform;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      title={meta.label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-line bg-surface-2 py-0.5 pl-1 pr-1.5 text-2xs font-medium text-muted",
        className
      )}
    >
      <span className="grid h-4 w-4 place-items-center rounded-sm bg-overlay font-mono text-[9px] font-semibold text-content/80">
        {meta.glyph}
      </span>
      {showLabel && <span className="whitespace-nowrap">{meta.label}</span>}
    </span>
  );
}

export function PlatformBadgeRow({
  platforms,
  max = 4,
  className,
}: {
  platforms: Platform[];
  max?: number;
  className?: string;
}) {
  const shown = platforms.slice(0, max);
  const extra = platforms.length - shown.length;
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((p) => (
        <PlatformBadge key={p} platform={p} showLabel={false} />
      ))}
      {extra > 0 && (
        <span className="text-2xs font-medium text-subtle">+{extra}</span>
      )}
    </div>
  );
}

// --- License badge ----------------------------------------------------------

export function LicenseBadge({ license }: { license: License }) {
  const isOpen = license !== "Proprietary" && license !== "Unknown";
  return (
    <Badge variant={isOpen ? "outline" : "warning"}>
      {license === "Unknown" ? "No license" : license}
    </Badge>
  );
}

// --- Risk badge -------------------------------------------------------------

const RISK_VARIANT: Record<RiskLevel, BadgeVariant> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export function RiskBadge({
  risk,
  className,
}: {
  risk: RiskLevel;
  className?: string;
}) {
  return (
    <Badge variant={RISK_VARIANT[risk]} className={cn("capitalize", className)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          risk === "low" && "bg-success",
          risk === "medium" && "bg-warning",
          risk === "high" && "bg-danger"
        )}
      />
      {RISK_LABELS[risk]}
    </Badge>
  );
}

// --- Trust badges -----------------------------------------------------------

export function VerifiedBadge({
  label = "Verified",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      title="Verified creator"
      className={cn("inline-flex items-center gap-1 text-info", className)}
    >
      <BadgeCheck className="h-4 w-4" strokeWidth={2.25} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function SecurityReviewedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="success" className={className}>
      <ShieldCheck className="h-3 w-3" />
      Security reviewed
    </Badge>
  );
}
