import type { AgentPackage } from "@/lib/types";
import { compatFromPlatforms, CompatibilityTable } from "@/components/compatibility-table";
import { MarkdownPanel } from "@/components/markdown-panel";
import { PermissionGrid } from "@/components/permission-grid";
import { CommandBlock } from "@/components/ui/command-block";
import { LicenseBadge, PlatformBadge } from "@/components/ui/badge";
import { PLATFORM_LABELS } from "@/lib/taxonomy";
import {
  ImageIcon,
  MonitorPlay,
  ShieldCheck,
  Terminal,
} from "lucide-react";

/** A labelled framed area used for the (mock) demo / screenshot region. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold tracking-tight text-content">
      {children}
    </h3>
  );
}

export function OverviewTab({ agent }: { agent: AgentPackage }) {
  const compatRows = agent.compatibility ?? compatFromPlatforms(agent.platforms);

  return (
    <div className="space-y-10">
      {/* README */}
      <section>
        <MarkdownPanel content={agent.readme} />
      </section>

      {/* Demo / screenshot placeholder */}
      <section>
        <SectionTitle>Demo</SectionTitle>
        <div className="mt-3 overflow-hidden rounded-card border border-line bg-surface">
          <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            </span>
            <span className="ml-2 font-mono text-2xs text-subtle">
              {agent.packageId} — preview
            </span>
          </div>
          <div className="grid min-h-[240px] place-items-center bg-hero-grid px-6 py-12">
            <div className="flex flex-col items-center text-center">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-surface-2 text-brand-muted">
                <MonitorPlay className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-muted">
                Interactive demo coming soon
              </p>
              <p className="mt-1 max-w-xs text-xs text-subtle">
                <ImageIcon className="mr-1 inline h-3 w-3 align-[-2px]" />
                A short walkthrough of {agent.name} in action will appear here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported platforms */}
      <section>
        <SectionTitle>Supported platforms</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          {agent.platforms.map((p) => (
            <PlatformBadge key={p} platform={p} className="px-2 py-1 text-xs" />
          ))}
        </div>
        {agent.platforms.length === 0 && (
          <p className="mt-2 text-sm text-subtle">No platforms declared.</p>
        )}
      </section>

      {/* Installation commands */}
      <section>
        <SectionTitle>Installation</SectionTitle>
        <p className="mt-1 text-sm text-muted">
          Install or export {agent.name} for any platform it supports.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {agent.installCommands.map((c) => (
            <CommandBlock
              key={c.platform}
              label={PLATFORM_LABELS[c.platform]}
              command={c.command}
            />
          ))}
        </div>
      </section>

      {/* Required environment */}
      {agent.requiredEnv && agent.requiredEnv.length > 0 && (
        <section>
          <SectionTitle>Required environment</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {agent.requiredEnv.map((env) => (
              <code
                key={env}
                className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-xs text-brand-muted"
              >
                {env}
              </code>
            ))}
          </div>
        </section>
      )}

      {/* Example usage */}
      {agent.exampleUsage && (
        <section>
          <SectionTitle>Example usage</SectionTitle>
          <div className="mt-3 rounded-card border border-line bg-surface p-5">
            <MarkdownPanel content={agent.exampleUsage} />
          </div>
        </section>
      )}

      {/* Required permissions */}
      <section>
        <SectionTitle>Required permissions</SectionTitle>
        <PermissionGrid permissions={agent.permissions} className="mt-3" />
      </section>

      {/* Compatibility */}
      <section>
        <SectionTitle>Compatibility</SectionTitle>
        <p className="mt-1 text-sm text-muted">
          How {agent.name} behaves across supported runtimes.
        </p>
        <div className="mt-3">
          <CompatibilityTable rows={compatRows} />
        </div>
      </section>

      {/* License + safety note */}
      <section>
        <SectionTitle>License &amp; safety</SectionTitle>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-content">
              <Terminal className="h-4 w-4 text-subtle" />
              License
            </div>
            <div className="mt-2 flex items-center gap-2">
              <LicenseBadge license={agent.license} />
              <span className="text-xs text-subtle">
                {agent.license === "Proprietary" || agent.license === "Unknown"
                  ? "Review terms before commercial use."
                  : "Open source — free for commercial use."}
              </span>
            </div>
          </div>
          <div className="card flex items-start gap-3 p-4">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-success/30 bg-success-dim text-success">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-medium text-content">Safety note</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Every install shows its full permission scope before it runs.
                {agent.isSecurityReviewed
                  ? " This package has been security reviewed by Nuclexa."
                  : " Review the requested permissions and source repository before installing."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
