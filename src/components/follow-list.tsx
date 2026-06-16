import Link from "next/link";
import { UserRoundX, Users } from "lucide-react";
import type { FollowDirection, ProfileSummary } from "@/lib/profile";
import { formatCompact } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineFollowButton } from "@/components/inline-follow-button";

/**
 * Renders the people on one side of a profile's follow graph.
 * `total` is the canonical count (may exceed the rendered sample, in which case
 * we say so). When the viewer is signed in, each row gets a Follow toggle.
 */
export function FollowList({
  people,
  total,
  direction,
  profileName,
  viewerId,
  viewerUsername,
  viewerSignedIn,
}: {
  people: ProfileSummary[];
  total: number;
  direction: FollowDirection;
  profileName: string;
  viewerId: string | null;
  viewerUsername: string | null;
  viewerSignedIn: boolean;
}) {
  if (people.length === 0) {
    return (
      <EmptyState
        icon={<UserRoundX className="h-5 w-5" />}
        title={
          direction === "followers" ? "No followers yet" : "Not following anyone yet"
        }
        description={
          direction === "followers"
            ? `No one follows ${profileName} yet. When they do, they'll show up here.`
            : `${profileName} isn't following anyone yet.`
        }
      />
    );
  }

  const noun = direction === "followers" ? "followers" : "following";

  return (
    <div>
      <p className="mb-4 flex items-center gap-1.5 text-xs text-subtle">
        <Users className="h-3.5 w-3.5" />
        {total > people.length ? (
          <span>
            Showing{" "}
            <span className="font-medium tabular-nums text-content">
              {people.length}
            </span>{" "}
            of{" "}
            <span className="font-medium tabular-nums text-content">
              {formatCompact(total)}
            </span>{" "}
            {noun}
          </span>
        ) : (
          <span>
            <span className="font-medium tabular-nums text-content">
              {formatCompact(total)}
            </span>{" "}
            {noun}
          </span>
        )}
      </p>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {people.map((person) => {
          // Compare on stable id (robust to a not-yet-backfilled username);
          // fall back to username for mock creators whose id is null.
          const isSelf =
            person.id !== null && viewerId !== null
              ? person.id === viewerId
              : viewerUsername !== null && person.username === viewerUsername;
          return (
            <li
              key={person.username}
              className="card flex items-center gap-3 p-3"
            >
              <Link
                href={`/u/${person.username}`}
                className="group flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar
                  name={person.name}
                  color={person.avatarColor}
                  image={person.image}
                  size="lg"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-content transition-colors group-hover:text-white">
                      {person.name}
                    </span>
                    {person.isVerified && <VerifiedBadge />}
                  </div>
                  <div className="truncate font-mono text-xs text-subtle">
                    @{person.username}
                  </div>
                  {person.bio && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                      {person.bio}
                    </p>
                  )}
                </div>
              </Link>

              {viewerSignedIn && !isSelf && (
                <InlineFollowButton
                  username={person.username}
                  initialFollowing={person.viewerFollows}
                  canFollow={person.isDbUser}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
