"use client";

import { useEffect, useState } from "react";
import { getAnonId } from "@/lib/anon-id";

/**
 * Live count of skills + MCP servers the current viewer has installed, fetched
 * from the same per-user install tracking the dashboard uses. Rendered inside
 * the profile stat cell, so it returns just the number (the wrapper styles it).
 * Only meaningful on the owner's own profile — installs are keyed to the
 * viewer's anonymous id, not the profile's username.
 */
export function InstalledCountValue() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const anonId = getAnonId();
        const res = await fetch(`/api/skills/installed?anonId=${anonId}`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setCount(
            (data.skills?.length ?? 0) + (data.mcpServers?.length ?? 0)
          );
        }
      } catch {
        // Leave as placeholder on failure.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{count ?? "—"}</>;
}
