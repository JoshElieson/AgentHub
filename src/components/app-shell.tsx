import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { cn } from "@/lib/utils";

/**
 * Top-level chrome: sticky navbar + main content + footer. The navbar resolves
 * the current user client-side via the session (see Navbar), so AppShell stays
 * usable from both server and client pages without forcing dynamic rendering.
 */
export function AppShell({
  children,
  className,
  fullWidth,
}: {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className={cn("flex-1", className)}>
        {fullWidth ? (
          children
        ) : (
          <div className="mx-auto w-full max-w-site px-4 sm:px-6">{children}</div>
        )}
      </main>
      <Footer />
    </div>
  );
}

/** Section heading used across pages. */
export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-content sm:text-xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Vertical page section spacing helper. */
export function PageSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("py-8 sm:py-10", className)}>{children}</section>;
}
