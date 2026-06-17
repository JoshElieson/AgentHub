"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserCollection, CollectionKind, UserCollectionItem } from "./types";

// ---------------------------------------------------------------------------
// Hook: useCollections — list all collections for the current user.
// ---------------------------------------------------------------------------

export function useCollections(opts?: { mine?: boolean }) {
  const [collections, setCollections] = useState<
    (UserCollection & { item_count?: number })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { getAnonId } = await import("@/lib/anon-id");
      const anonId = getAnonId();
      const params = new URLSearchParams({ anonId });
      if (opts?.mine) params.set("mine", "true");

      const res = await fetch(`/api/collections?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections ?? []);
      }
    } catch {
      // API error — show empty state
    } finally {
      setLoading(false);
    }
  }, [opts?.mine]);

  useEffect(() => {
    load();
  }, [load]);

  return { collections, loading, refresh: load };
}

// ---------------------------------------------------------------------------
// Hook: useCollection — fetch a single collection by ID with resolved items.
// ---------------------------------------------------------------------------

export function useCollection(id: string | null) {
  const [collection, setCollection] = useState<UserCollection | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/collections/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data.collection ?? null);
      }
    } catch {
      // API error — show not-found
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { collection, loading, refresh: load, setCollection };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
];

function randomGradient(): string {
  return COVER_GRADIENTS[Math.floor(Math.random() * COVER_GRADIENTS.length)];
}

export async function createCollection(data: {
  name: string;
  kind: CollectionKind;
  description?: string;
}): Promise<UserCollection | null> {
  const { getAnonId } = await import("@/lib/anon-id");
  const anonId = getAnonId();

  try {
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        kind: data.kind,
        anonId,
        description: data.description ?? "",
        cover_color: randomGradient(),
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.collection) return json.collection;
    }
  } catch {
    // API error
  }

  return null;
}

export async function updateCollection(
  id: string,
  updates: { name?: string; description?: string; cover_color?: string }
): Promise<boolean> {
  const { getAnonId } = await import("@/lib/anon-id");
  const anonId = getAnonId();

  try {
    const res = await fetch(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonId, ...updates }),
    });
    if (res.ok) return true;
  } catch {
    // API error
  }

  return false;
}

export async function deleteCollection(id: string): Promise<boolean> {
  const { getAnonId } = await import("@/lib/anon-id");
  const anonId = getAnonId();

  try {
    const res = await fetch(`/api/collections/${id}?anonId=${anonId}`, {
      method: "DELETE",
    });
    if (res.ok) return true;
  } catch {
    // API error
  }

  return false;
}

export async function addCollectionItem(
  collectionId: string,
  itemId: string,
  itemKind: "skill" | "mcp"
): Promise<boolean> {
  const { getAnonId } = await import("@/lib/anon-id");
  const anonId = getAnonId();

  try {
    const res = await fetch(`/api/collections/${collectionId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, itemKind, anonId }),
    });
    if (res.ok) return true;
  } catch {
    // API error
  }

  return false;
}

export async function removeCollectionItem(
  collectionId: string,
  itemId: string
): Promise<boolean> {
  const { getAnonId } = await import("@/lib/anon-id");
  const anonId = getAnonId();

  try {
    const res = await fetch(`/api/collections/${collectionId}/items`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, anonId }),
    });
    if (res.ok) return true;
  } catch {
    // API error
  }

  return false;
}
