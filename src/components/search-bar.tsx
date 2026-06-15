"use client";

import { searchAgents } from "@/lib/data";
import { getCreator } from "@/lib/data";
import { cn, formatCompact } from "@/lib/utils";
import { Search, CornerDownLeft, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "./ui/avatar";
import { TypeBadge } from "./ui/badge";

export function SearchBar({
  variant = "nav",
  placeholder = "Search agents, skills, MCP servers…",
  autoFocus,
  className,
  defaultValue = "",
}: {
  variant?: "hero" | "nav";
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  defaultValue?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchAgents(query, 6), [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => setActive(0), [query]);

  const go = (slug: string) => {
    setOpen(false);
    router.push(`/agents/${slug}`);
  };
  const submit = () => {
    setOpen(false);
    router.push(`/explore?q=${encodeURIComponent(query)}`);
  };

  const isHero = variant === "hero";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-md border border-line bg-surface-2 transition-colors focus-within:border-brand/70",
          isHero ? "px-3.5 py-3" : "px-3 py-2"
        )}
      >
        <Search className={cn("shrink-0 text-subtle", isHero ? "h-[18px] w-[18px]" : "h-4 w-4")} />
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (open && results[active]) go(results[active].slug);
              else submit();
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-content placeholder:text-faint focus:outline-none",
            isHero ? "text-base" : "text-sm"
          )}
        />
        {isHero ? (
          <kbd className="hidden shrink-0 items-center gap-1 rounded-sm border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-2xs text-subtle sm:flex">
            <CornerDownLeft className="h-3 w-3" /> Search
          </kbd>
        ) : (
          <kbd className="hidden shrink-0 rounded-sm border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-2xs text-subtle md:block">
            /
          </kbd>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-line bg-overlay shadow-overlay animate-scale-in">
          {results.length > 0 ? (
            <ul className="max-h-[60vh] overflow-y-auto p-1.5">
              {results.map((a, i) => {
                const creator = getCreator(a.creatorUsername);
                return (
                  <li key={a.slug}>
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(a.slug)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded px-2.5 py-2 text-left transition-colors",
                        i === active ? "bg-surface-2" : "hover:bg-surface-2"
                      )}
                    >
                      <Avatar name={a.name} color={creator?.avatarColor} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-content">
                            {a.name}
                          </span>
                          <TypeBadge type={a.type} />
                        </span>
                        <span className="block truncate text-xs text-subtle">
                          {a.shortDescription}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-2xs tabular-nums text-subtle">
                        <Download className="h-3 w-3" />
                        {formatCompact(a.installCount)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-subtle">
              No packages match “{query}”.
            </div>
          )}
          <button
            onClick={submit}
            className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-content"
          >
            <span>Search all packages for “{query}”</span>
            <CornerDownLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
