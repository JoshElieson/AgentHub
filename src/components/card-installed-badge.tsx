"use client";

import { InstalledBadge } from "@/components/installed-badge";
import { useIsInstalled, type InstallKind } from "@/lib/installed-context";

/**
 * Renders the "Installed" pill on a marketplace card when the current user has
 * installed that package. Lives in its own client component so the shared card
 * module (marketplace-cards.tsx) doesn't have to become client-only.
 */
export function CardInstalledBadge({
  kind,
  id,
  className,
}: {
  kind: InstallKind;
  id: string;
  className?: string;
}) {
  const installed = useIsInstalled(kind, id);
  if (!installed) return null;
  return <InstalledBadge size="xs" className={className} />;
}
