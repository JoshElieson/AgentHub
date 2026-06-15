"use client";

import type { FilterState } from "@/lib/data";
import {
  CATEGORIES,
  LICENSES,
  PACKAGE_TYPES,
  PLATFORMS,
  PRICING_OPTIONS,
} from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type ArrayKey = "types" | "platforms" | "categories" | "licenses" | "pricing";

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="border-b border-line py-4 first:pt-0">
      <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-subtle">
        {title}
      </h4>
      <div className="space-y-0.5">
        {options.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <label
              key={o.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-content"
            >
              <span
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors",
                  checked
                    ? "border-brand bg-brand"
                    : "border-line-strong bg-transparent"
                )}
              >
                {checked && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none">
                    <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function FilterSidebar({
  value,
  onChange,
  onClear,
  className,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  className?: string;
}) {
  const set = (key: ArrayKey) => (v: string) =>
    onChange({ ...value, [key]: toggle(value[key] as string[], v) });

  const activeCount =
    value.types.length +
    value.platforms.length +
    value.categories.length +
    value.licenses.length +
    value.pricing.length;

  return (
    <aside className={cn("w-full", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-content">Filters</h3>
        {activeCount > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-muted hover:text-brand"
          >
            <X className="h-3 w-3" />
            Clear ({activeCount})
          </button>
        )}
      </div>

      <FilterGroup
        title="Type"
        options={PACKAGE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
        selected={value.types}
        onToggle={set("types")}
      />
      <FilterGroup
        title="Platform"
        options={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
        selected={value.platforms}
        onToggle={set("platforms")}
      />
      <FilterGroup
        title="Category"
        options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
        selected={value.categories}
        onToggle={set("categories")}
      />
      <FilterGroup
        title="License"
        options={LICENSES.map((l) => ({ value: l, label: l }))}
        selected={value.licenses}
        onToggle={set("licenses")}
      />
      <FilterGroup
        title="Pricing"
        options={PRICING_OPTIONS}
        selected={value.pricing}
        onToggle={set("pricing")}
      />
    </aside>
  );
}
