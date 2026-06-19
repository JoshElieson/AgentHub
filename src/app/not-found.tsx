import { AppShell } from "@/components/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-12 text-center sm:py-20">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface-2 text-muted">
          <SearchX className="h-7 w-7" />
        </div>
        <p className="mt-6 font-mono text-sm text-brand-muted">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-content">
          This package couldn&apos;t be found
        </h1>
        <p className="mt-2 max-w-md text-muted">
          The agent, page, or resource you&apos;re looking for doesn&apos;t exist
          or may have been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/explore" variant="primary">
            Explore the marketplace
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Back home
          </ButtonLink>
        </div>
      </div>
    </AppShell>
  );
}
