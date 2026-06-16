import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

/**
 * Green "Installed" pill shown on packages the current user has installed
 * before. Used on marketplace cards (compact) and detail pages (with label).
 */
export function InstalledBadge({
  size = "sm",
  label = "Installed",
  className,
}: {
  size?: "xs" | "sm" | "md";
  label?: string;
  className?: string;
}) {
  return (
    <span
      title="You've installed this before"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border border-success/30 bg-success-dim font-semibold text-success",
        size === "xs" && "px-1.5 py-0.5 text-2xs",
        size === "sm" && "px-2 py-0.5 text-2xs",
        size === "md" && "px-2.5 py-1 text-xs",
        className
      )}
    >
      <CheckCircle2
        className={cn(
          size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"
        )}
      />
      {label}
    </span>
  );
}
