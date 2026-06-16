"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAnonId } from "@/lib/anon-id";

export type InstallKind = "skill" | "mcp";

interface InstalledState {
  /** True once the initial fetch has resolved. */
  ready: boolean;
  isInstalled: (kind: InstallKind, id: string) => boolean;
  /** Optimistically mark an item installed (called right after a successful install). */
  markInstalled: (kind: InstallKind, id: string) => void;
  /** Optimistically drop an item (the dashboard uninstall action). */
  markUninstalled: (kind: InstallKind, id: string) => void;
}

const noop = () => {};

const InstalledContext = createContext<InstalledState>({
  ready: false,
  isInstalled: () => false,
  markInstalled: noop,
  markUninstalled: noop,
});

/**
 * Loads the set of skills + MCP servers the current anonymous user has
 * installed, once, and shares it across the app so list cards can show an
 * "Installed" pill without a fetch per card. Detail pages call `markInstalled`
 * after a successful install so the badge appears immediately on navigation.
 *
 * Mounted high in the tree (see <Providers>), the sets persist across
 * client-side navigation between marketplace pages.
 */
export function InstalledProvider({ children }: { children: React.ReactNode }) {
  const [skillIds, setSkillIds] = useState<Set<string>>(new Set());
  const [mcpIds, setMcpIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const anonId = getAnonId();
        const res = await fetch(`/api/skills/installed?anonId=${anonId}`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setSkillIds(new Set((data.skills ?? []).map((s: any) => s.id)));
          setMcpIds(new Set((data.mcpServers ?? []).map((s: any) => s.id)));
        }
      } catch {
        // Offline / no DB — treat everything as not-installed.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isInstalled = useCallback(
    (kind: InstallKind, id: string) =>
      kind === "skill" ? skillIds.has(id) : mcpIds.has(id),
    [skillIds, mcpIds]
  );

  const markInstalled = useCallback((kind: InstallKind, id: string) => {
    const setter = kind === "skill" ? setSkillIds : setMcpIds;
    setter((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markUninstalled = useCallback((kind: InstallKind, id: string) => {
    const setter = kind === "skill" ? setSkillIds : setMcpIds;
    setter((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ ready, isInstalled, markInstalled, markUninstalled }),
    [ready, isInstalled, markInstalled, markUninstalled]
  );

  return (
    <InstalledContext.Provider value={value}>
      {children}
    </InstalledContext.Provider>
  );
}

export function useInstalled() {
  return useContext(InstalledContext);
}

/** Convenience: reactive "is this item installed by me?" boolean. */
export function useIsInstalled(kind: InstallKind, id: string | undefined) {
  const { isInstalled } = useInstalled();
  return id ? isInstalled(kind, id) : false;
}
