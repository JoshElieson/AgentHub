"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/lib/actions";
import { Check, Loader2, UserPlus } from "lucide-react";

/**
 * Compact follow toggle used inside followers/following lists.
 * - `canFollow` (real DB user, viewer signed in): persists via the server action.
 * - otherwise (demo/mock profiles): optimistic, client-only toggle.
 */
export function InlineFollowButton({
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

  function onClick() {
    if (!canFollow) {
      // Demo profile — optimistic local toggle only.
      setFollowing((v) => !v);
      return;
    }

    const prev = following;
    setFollowing(!prev); // optimistic
    startTransition(async () => {
      const res = await toggleFollow(username);
      if (res.ok) {
        setFollowing(res.data.following);
        router.refresh();
      } else {
        setFollowing(prev); // roll back
        if (res.code === "auth") router.push("/login");
      }
    });
  }

  return (
    <Button
      variant={following ? "secondary" : "primary"}
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-pressed={following}
      aria-label={following ? `Unfollow ${username}` : `Follow ${username}`}
      className="shrink-0"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : following ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" />
          Follow
        </>
      )}
    </Button>
  );
}
