"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export function Tabs({
  tabs,
  defaultTab,
  className,
}: {
  tabs: TabDef[];
  defaultTab?: string;
  className?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className={className}>
      <div
        role="tablist"
        className="no-scrollbar -mb-px flex gap-1 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={cn(
                "group relative flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-brand text-content"
                  : "border-transparent text-muted hover:text-content"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 text-2xs font-semibold tabular-nums",
                    isActive
                      ? "bg-brand-dim text-brand-muted"
                      : "bg-surface-2 text-subtle"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="pt-6 animate-fade-in">
        {current?.content}
      </div>
    </div>
  );
}

/** Pill-style segmented control (used for sub-filters / view toggles). */
export function SegmentedTabs({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5",
        className
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-surface-3 text-content shadow-sm"
              : "text-muted hover:text-content"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
