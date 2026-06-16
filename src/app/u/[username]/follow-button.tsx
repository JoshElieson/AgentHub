"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/lib/actions";
import { Check, Loader2, UserPlus } from "lucide-react";

/**
 * Follow toggle for the creator profile header. The follower / following counts
 * live in the header's counts row (a single source of truth that reconciles on
 * refresh), so this button owns only the follow STATE.
 * - `canFollow` (real DB user + oauth mode): persists via the server action.
 * - otherwise (demo/mock profiles): optimistic, client-only toggle.
 */
export function FollowButton({
  username,
  initialFollowing = false,
  canFollow = false,
}: {
  username: string;
  initialFollowing?: boolean;
  canFollow?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);

    if (!canFollow) {
      // Demo profile — optimistic local toggle only.
      setFollowing((v) => !v);
      return;
    }

    const prevFollowing = following;
    setFollowing(!prevFollowing); // optimistic

    startTransition(async () => {
      const res = await toggleFollow(username);
      if (res.ok) {
        setFollowing(res.data.following);
        // Reconciles the header's follower count (server-rendered) with the edit.
        router.refresh();
      } else {
        setFollowing(prevFollowing); // roll back
        setError(res.error);
        if (res.code === "auth") router.push("/login");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
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
      {error && <span className="text-2xs text-danger">{error}</span>}
    </div>
  );
}
