"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCompact } from "@/lib/utils";
import { toggleFollow } from "@/lib/actions";
import { Check, Loader2, UserPlus } from "lucide-react";

/**
 * Follow toggle for the creator profile header.
 * - `canFollow` (real DB user + oauth mode): persists via the server action.
 * - otherwise (demo/mock profiles): optimistic, client-only toggle.
 */
export function FollowButton({
  username,
  followers,
  initialFollowing = false,
  canFollow = false,
}: {
  username: string;
  followers: number;
  initialFollowing?: boolean;
  canFollow?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(followers);
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);

    if (!canFollow) {
      // Demo profile — optimistic local toggle only.
      setFollowing((v) => {
        setCount((c) => c + (v ? -1 : 1));
        return !v;
      });
      return;
    }

    // Optimistic update, reconciled with the server result.
    const prevFollowing = following;
    const prevCount = count;
    setFollowing(!prevFollowing);
    setCount((c) => c + (prevFollowing ? -1 : 1));

    startTransition(async () => {
      const res = await toggleFollow(username);
      if (res.ok) {
        setFollowing(res.data.following);
        setCount(res.data.followers);
        router.refresh();
      } else {
        // Roll back and surface the reason.
        setFollowing(prevFollowing);
        setCount(prevCount);
        setError(res.error);
        if (res.code === "auth") router.push("/login");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <div className="flex items-center gap-3">
        <Button
          variant={following ? "secondary" : "primary"}
          onClick={onClick}
          disabled={pending}
          aria-pressed={following}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : following ? (
            <>
              <Check className="h-4 w-4" />
              Following
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Follow
            </>
          )}
        </Button>
        <span className="text-xs text-subtle">
          <span className="font-medium tabular-nums text-content">
            {formatCompact(count)}
          </span>{" "}
          followers
        </span>
      </div>
      {error && <span className="text-2xs text-danger">{error}</span>}
    </div>
  );
}
