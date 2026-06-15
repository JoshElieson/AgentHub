import type { Permissions } from "@/lib/types";
import { aggregateRisk, PERMISSION_KEYS, PERMISSION_META } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { RiskBadge } from "./ui/badge";
import { Check, Minus, AlertTriangle } from "lucide-react";

const RISK_DOT: Record<string, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-danger",
};

export function PermissionGrid({
  permissions,
  className,
}: {
  permissions: Permissions;
  className?: string;
}) {
  const risk = aggregateRisk(permissions);
  const hasHigh = PERMISSION_KEYS.some(
    (k) => permissions[k] && PERMISSION_META[k].risk === "high"
  );

  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-content">Required permissions</h3>
        <RiskBadge risk={risk} />
      </div>
      <ul className="divide-y divide-line">
        {PERMISSION_KEYS.map((k) => {
          const m = PERMISSION_META[k];
          const granted = permissions[k];
          return (
            <li
              key={k}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5",
                !granted && "opacity-50"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                  granted
                    ? "border-line-strong bg-surface-2"
                    : "border-line bg-transparent"
                )}
              >
                {granted ? (
                  <Check className="h-3 w-3 text-content" />
                ) : (
                  <Minus className="h-3 w-3 text-faint" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-content">
                  {m.label}
                  {granted && (
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", RISK_DOT[m.risk])}
                      title={`${m.risk} risk`}
                    />
                  )}
                </div>
                <div className="text-xs text-subtle">{m.description}</div>
              </div>
            </li>
          );
        })}
      </ul>
      {hasHigh && (
        <div className="flex items-start gap-2 border-t border-danger/20 bg-danger-dim/40 px-4 py-3 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This package requests high-risk permissions. Review the source and
            only install from creators you trust.
          </span>
        </div>
      )}
    </div>
  );
}
