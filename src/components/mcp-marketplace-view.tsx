"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, MOCK_MCP_SERVERS, type McpServerRow } from "@/lib/supabase";
import { RatingStars } from "@/components/ui/rating-stars";
import { Button } from "@/components/ui/button";
import { cn, formatCompact } from "@/lib/utils";
import { 
  Terminal, 
  Cpu, 
  Settings, 
  CheckCircle, 
  Download, 
  FolderGit, 
  FileText, 
  Globe, 
  Database,
  ArrowRight,
  Sparkles,
  AlertCircle,
  FolderSync,
  Search,
  X,
  Plus,
  Loader2,
  Tag,
  Info,
  ArrowUpDown,
  Star,
  Copy
} from "lucide-react";

type SortOption = "newest" | "rating" | "stars" | "exports";
const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  rating: "Highest Rated",
  stars: "Most Starred",
  exports: "Most Exported",
};

interface McpSearchResult extends McpServerRow {
  similarity?: number | null;
}

export function McpMarketplaceView() {
  const searchParams = useSearchParams();
  const [servers, setServers] = useState<McpSearchResult[]>(MOCK_MCP_SERVERS);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [dbStatus, setDbStatus] = useState<"connected" | "mock">("mock");
  const [searchMode, setSearchMode] = useState<"listing" | "semantic" | "text" | "client">("listing");
  const [copiedStatus, setCopiedStatus] = useState<Record<string, boolean>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const initialTag = searchParams?.get("tag");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTag ? [initialTag] : []);
  const [sortBy, setSortBy] = useState<SortOption | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback client-side load for now since we haven't implemented API routes
  const performSearch = useCallback(async (query: string) => {
    try {
      setSearching(true);
      // Mock search or direct supabase call
      if (supabase) {
        const { data } = await supabase
          .from("mcp_servers")
          .select("*")
          .order("name", { ascending: true });
          
        if (data && data.length > 0) {
          setServers(data.map((row: any) => ({
            ...row,
            similarity: null,
          })));
          setDbStatus("connected");
        } else {
          setServers(MOCK_MCP_SERVERS);
          setDbStatus("mock");
        }
      } else {
        setServers(MOCK_MCP_SERVERS);
        setDbStatus("mock");
      }
      setSearchMode("client");
    } catch (err) {
      console.error("Search failed, falling back to mock:", err);
      setServers(MOCK_MCP_SERVERS);
      setDbStatus("mock");
      setSearchMode("client");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery.trim());
    }, searchQuery ? 300 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, performSearch]);

  useEffect(() => {
    performSearch("");
  }, [performSearch]);

  const handleCopyConfig = (server: McpServerRow) => {
    const config = {
      [server.name]: {
        command: server.command,
        args: server.args,
        env: server.env_vars
      }
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    
    setCopiedStatus(prev => ({ ...prev, [server.id]: true }));
    setTimeout(() => {
      setCopiedStatus(prev => ({ ...prev, [server.id]: false }));
    }, 2000);
  };

  const allTags = Array.from(new Set(servers.flatMap((s) => s.tags || []))).sort();

  const filteredServers = servers.filter((server) => {
    if (searchMode === "client" && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        server.name.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query) ||
        (server.tags || []).some((t) => t.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => (server.tags || []).includes(tag));
    return matchesTags;
  });

  const sortedServers = [...filteredServers].sort((a, b) => {
    switch (sortBy) {
      case "rating": return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
      case "stars": return (b.star_count ?? 0) - (a.star_count ?? 0);
      case "exports": return (b.export_count ?? 0) - (a.export_count ?? 0);
      case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default: return 0;
    }
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search & Tags */}
      <div className="flex flex-col gap-4 border-b border-line pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className={cn(
            "flex flex-1 items-center gap-2.5 rounded-xl border bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand/60",
            searching ? "border-brand/40" : "border-line"
          )}>
            {searching ? (
              <Loader2 className="h-4 w-4 shrink-0 text-brand-muted animate-spin" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-subtle" />
            )}
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search MCP servers..."
              className="min-w-0 flex-1 bg-transparent text-sm text-content placeholder:text-faint focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-subtle transition-colors hover:bg-surface-2 hover:text-content"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-faint flex items-center gap-1 mr-1">
              <Tag className="h-3.5 w-3.5" /> Filter by tags:
            </span>
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTags((prev) => isSelected ? prev.filter((t) => t !== tag) : [...prev, tag])}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-all border",
                    isSelected ? "bg-brand border-brand text-brand-fg shadow-glow/10" : "bg-surface-2 border-line text-muted hover:border-line-strong hover:text-content"
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading / Empty / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : sortedServers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-line bg-surface-2/40">
          <AlertCircle className="h-8 w-8 text-subtle" />
          <p className="mt-4 text-sm text-content font-medium">No MCP servers match your filters</p>
          <button onClick={() => { setSearchQuery(""); setSelectedTags([]); }} className="mt-4 text-xs font-semibold text-brand-muted hover:text-brand underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              <span className="font-medium text-content tabular-nums">{sortedServers.length}</span> {sortedServers.length === 1 ? "server" : "servers"}
            </p>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-faint" />
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy(sortBy === opt ? null : opt)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-all border",
                    sortBy === opt ? "bg-brand border-brand text-brand-fg" : "bg-surface-2 border-line text-muted hover:border-line-strong"
                  )}
                >
                  {SORT_LABELS[opt]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sortedServers.map((server) => (
              <div key={server.id} className="flex flex-col rounded-card border border-line bg-surface p-5 transition-all duration-300 hover:border-brand-line hover:shadow-glow/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-3 shadow-inner">
                      <Terminal className="h-5 w-5 text-brand-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-content">{server.name}</h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <RatingStars rating={server.avg_rating} count={server.rating_count} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted flex-1">{server.description}</p>
                
                {server.tags && server.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {server.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-subtle">
                        {tag}
                      </span>
                    ))}
                    {server.tags.length > 3 && (
                      <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-subtle">
                        +{server.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-faint">
                    <span className="flex items-center gap-1" title="Installs">
                      <Download className="h-3.5 w-3.5" />
                      {formatCompact(server.export_count)}
                    </span>
                    <span className="flex items-center gap-1" title="Stars">
                      <Star className="h-3.5 w-3.5" />
                      {formatCompact(server.star_count)}
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "gap-1.5 transition-colors",
                      copiedStatus[server.id] && "bg-emerald-500/10 border-emerald-500/50 text-emerald-500"
                    )}
                    onClick={() => handleCopyConfig(server)}
                  >
                    {copiedStatus[server.id] ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" /> Copied JSON
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy Config
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
