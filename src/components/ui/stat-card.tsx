import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        {icon && <span className="text-subtle">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-content tnum">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-subtle">{hint}</div>}
    </div>
  );
}

/** Inline stat used in hero / headers (no card chrome). */
export function InlineStat({
  value,
  label,
  className,
}: {
  value: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-2xl font-semibold tracking-tight text-content tnum sm:text-3xl">
        {value}
      </span>
      <span className="mt-0.5 text-sm text-muted">{label}</span>
    </div>
  );
}
