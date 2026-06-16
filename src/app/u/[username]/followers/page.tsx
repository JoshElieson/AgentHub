import type { Metadata } from "next";
import { creators } from "@/lib/data";
import { getProfileByUsername } from "@/lib/profile";
import { ConnectionsPage } from "../follow-page";

interface PageProps {
  params: Promise<{ username: string }>;
}

export function generateStaticParams() {
  return creators.map((c) => ({ username: c.username }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Creator not found · AgentDock" };
  return {
    title: `People following ${profile.name} (@${profile.username}) · AgentDock`,
    description: `See who follows ${profile.name} on AgentDock.`,
  };
}

export default async function FollowersPage({ params }: PageProps) {
  const { username } = await params;
  return <ConnectionsPage username={username} initialTab="followers" />;
}
