"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import {
  LayoutDashboard,
  Package,
  Download,
  Star,
  FolderHeart,
  Settings,
} from "lucide-react";

export type DashboardSection =
  | "overview"
  | "my-agents"
  | "installed"
  | "favorites"
  | "collections"
  | "settings";

export const DASHBOARD_SECTIONS: {
  id: DashboardSection;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "my-agents", label: "My Agents", icon: <Package className="h-4 w-4" /> },
  { id: "installed", label: "Installed", icon: <Download className="h-4 w-4" /> },
  { id: "favorites", label: "Favorites", icon: <Star className="h-4 w-4" /> },
  { id: "collections", label: "Collections", icon: <FolderHeart className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

export function DashboardSidebar({
  active,
  onSelect,
  user,
}: {
  active: DashboardSection;
  onSelect: (s: DashboardSection) => void;
  user: { name: string; username: string; avatarColor: string };
}) {
  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-3 p-3">
        <Avatar name={user.name} color={user.avatarColor} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-content">{user.name}</div>
          <div className="truncate text-xs text-subtle">@{user.username}</div>
        </div>
      </div>

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
