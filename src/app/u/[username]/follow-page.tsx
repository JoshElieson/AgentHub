import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserCheck, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { FollowList } from "@/components/follow-list";
import {
  getFollowList,
  getProfileByUsername,
  type FollowDirection,
} from "@/lib/profile";
import { getSessionUser } from "@/lib/session";

/**
 * Shared followers/following view. Both `/u/[username]/followers` and
 * `/u/[username]/following` render this — `initialTab` just decides which tab
 * opens first. Both lists are loaded server-side so the tabs switch instantly.
 */
export async function ConnectionsPage({
  username,
  initialTab,
}: {
  username: string;
  initialTab: FollowDirection;
}) {
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const viewer = await getSessionUser();
  const viewerId = viewer?.isAuthenticated ? viewer.id : null;
  const viewerUsername = viewer?.isAuthenticated ? viewer.username : null;
  const viewerSignedIn = Boolean(viewer?.isAuthenticated);

  const [followers, following] = await Promise.all([
    getFollowList(profile, "followers", viewerId),
    getFollowList(profile, "following", viewerId),
  ]);

  const tabs = [
    {
      id: "followers",
      label: "Followers",
      icon: <Users className="h-4 w-4" />,
      content: (
        <FollowList
          people={followers}
          total={profile.followers}
          direction="followers"
          profileName={profile.name}
          viewerId={viewerId}
          viewerUsername={viewerUsername}
          viewerSignedIn={viewerSignedIn}
        />
      ),
    },
    {
      id: "following",
      label: "Following",
      icon: <UserCheck className="h-4 w-4" />,
      content: (
        <FollowList
          people={following}
          total={profile.following}
          direction="following"
          profileName={profile.name}
          viewerId={viewerId}
          viewerUsername={viewerUsername}
          viewerSignedIn={viewerSignedIn}
        />
      ),
    },
  ];

  return (
    <AppShell>
      <div className="py-8 sm:py-10">
        <Link
          href={`/u/${profile.username}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-subtle transition-colors hover:text-content"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to profile
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <Avatar
            name={profile.name}
            color={profile.avatarColor}
            image={profile.image}
            size="lg"
            className="ring-2 ring-line"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-content">
                {profile.name}
              </h1>
              {profile.isVerified && <VerifiedBadge />}
            </div>
            <div className="font-mono text-sm text-subtle">
              @{profile.username}
            </div>
          </div>
        </div>

        <Tabs tabs={tabs} defaultTab={initialTab} className="mt-8" />
      </div>
    </AppShell>
  );
}
