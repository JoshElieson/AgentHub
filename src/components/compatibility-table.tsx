import type { CompatibilityRow, Platform } from "@/lib/types";
import { PLATFORM_META } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Check, CircleSlash, MinusCircle } from "lucide-react";

const STATUS: Record<
  CompatibilityRow["status"],
  { label: string; tone: string; icon: React.ReactNode }
> = {
  supported: {
    label: "Supported",
    tone: "text-success",
    icon: <Check className="h-4 w-4" />,
  },
  exportable: {
    label: "Exportable",
    tone: "text-info",
    icon: <ArrowUpRight className="h-4 w-4" />,
  },
  partial: {
    label: "Partial",
    tone: "text-warning",
    icon: <MinusCircle className="h-4 w-4" />,
  },
  unsupported: {
    label: "Not supported",
    tone: "text-subtle",
    icon: <CircleSlash className="h-4 w-4" />,
  },
};

/** Builds rows from the package's declared platforms when no explicit table exists. */
export function compatFromPlatforms(platforms: Platform[]): CompatibilityRow[] {
  return platforms.map((platform) => {
    const meta = PLATFORM_META[platform];
    return {
      platform,
      status: meta.action === "export" ? "exportable" : "supported",
      installMethod: meta.installMethod,
    };
  });
}

export function CompatibilityTable({ rows }: { rows: CompatibilityRow[] }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-2 text-left">
            <th className="px-4 py-2.5 font-semibold text-content">Platform</th>
            <th className="px-4 py-2.5 font-semibold text-content">Status</th>
            <th className="px-4 py-2.5 font-semibold text-content">
              Install method
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => {
            const meta = PLATFORM_META[row.platform];
            const s = STATUS[row.status];
            const method =
              row.installMethod ?? meta.installMethod;
            return (
              <tr key={row.platform}>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2 font-medium text-content">
                    <span className="grid h-5 w-5 place-items-center rounded-sm bg-surface-2 font-mono text-[9px] text-muted">
                      {meta.glyph}
                    </span>
                    {meta.label}
                  </span>
                </td>
                <td className={cn("px-4 py-2.5", s.tone)}>
                  <span className="flex items-center gap-1.5 font-medium">
                    {s.icon}
                    {s.label}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted">
                  {row.status === "unsupported" ? (
                    <span className="text-subtle">{row.notes ?? "—"}</span>
                  ) : (
                    <span>
                      {method}
                      {row.notes ? (
                        <span className="block text-2xs text-subtle">
                          {row.notes}
                        </span>
                      ) : null}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
