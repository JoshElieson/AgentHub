"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Download,
  Bookmark,
  FolderHeart,
  Settings,
} from "lucide-react";

export type DashboardSection =
  | "overview"
  | "my-agents"
  | "installed"
  | "saved"
  | "collections"
  | "settings";

export const DASHBOARD_SECTIONS: {
  id: DashboardSection;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "my-agents", label: "Published", icon: <Package className="h-4 w-4" /> },
  { id: "installed", label: "Installed", icon: <Download className="h-4 w-4" /> },
  { id: "saved", label: "Saved", icon: <Bookmark className="h-4 w-4" /> },
  { id: "collections", label: "Bundles", icon: <FolderHeart className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export function DashboardSidebar({
  active,
  onSelect,
}: {
  active: DashboardSection;
  onSelect: (s: DashboardSection) => void;
}) {
  return (
    <div>
      <nav className="space-y-0.5">
        {DASHBOARD_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active === s.id
                ? "bg-surface-2 text-content"
                : "text-muted hover:bg-surface-2/60 hover:text-content"
            )}
          >
            <span className={cn(active === s.id ? "text-brand-muted" : "text-subtle")}>
              {s.icon}
            </span>
            {s.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
