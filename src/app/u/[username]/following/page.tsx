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
  if (!profile) return { title: "Creator not found · Nuclexa" };
  return {
    title: `Who ${profile.name} (@${profile.username}) follows · Nuclexa`,
    description: `See who ${profile.name} follows on Nuclexa.`,
  };
}

export default async function FollowingPage({ params }: PageProps) {
  const { username } = await params;
  return <ConnectionsPage username={username} initialTab="following" />;
}
