import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Github,
  Info,
  ShieldCheck,
} from "lucide-react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { AUTH_MODE, getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to AgentDock to publish and manage your AI packages.",
};

/** Minimal multi-color Google "G" glyph. */
function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.04 12.26c0-.82-.07-1.6-.21-2.36H12v4.46h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.42-4.96 3.42-8.48z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1.03 7.62-2.8l-3.72-2.9c-1.03.7-2.36 1.1-3.9 1.1-3 0-5.55-2.03-6.46-4.76H1.7v2.99A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.54 14.64a7.2 7.2 0 0 1 0-4.6V7.06H1.7a12 12 0 0 0 0 10.88l3.84-3.3z"
      />
      <path
        fill="#EA4335"
        d="M12 4.74c1.69 0 3.21.58 4.4 1.72l3.3-3.3C17.7 1.18 15.1 0 12 0A12 12 0 0 0 1.7 7.06l3.84 2.98C6.45 6.77 9 4.74 12 4.74z"
      />
    </svg>
  );
}

export default async function LoginPage() {
  // Already signed in (real session) → straight to the dashboard.
  const current = await getSessionUser();
  if (current?.isAuthenticated) redirect("/dashboard");

  const isMock = AUTH_MODE === "mock";

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      {/* Subtle grid backdrop, consistent with the homepage hero */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-hero-grid" />

      {/* Top bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-site items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-content"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </header>

      {/* Centered card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="card p-7 sm:p-8">
            {/* Heading */}
            <div className="flex flex-col items-center text-center">
              <Logo href="/" showWordmark={false} className="[&>span]:h-10 [&>span]:w-10" />
              <h1 className="mt-5 text-xl font-semibold tracking-tight text-content">
                Sign in to AgentDock
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Publish and manage your AI packages.
              </p>
            </div>

            {/* Providers */}
            <div className="mt-7 space-y-3">
              <ButtonLink
                href="/api/auth/signin/github"
                variant="primary"
                size="lg"
                className="relative w-full"
              >
                <Github className="h-4 w-4" />
                Continue with GitHub
                <span className="absolute right-2.5 inline-flex items-center rounded-sm bg-brand-fg/15 px-2 py-0.5 text-2xs font-semibold tracking-wide text-brand-fg ring-1 ring-inset ring-brand-fg/20">
                  Recommended
                </span>
              </ButtonLink>

              <ButtonLink
                href="/api/auth/signin/google"
                variant="secondary"
                size="lg"
                className="w-full"
              >
                <GoogleGlyph className="h-4 w-4" />
                Continue with Google
              </ButtonLink>
            </div>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-2xs text-subtle">
              <ShieldCheck className="h-3 w-3 text-success" />
              GitHub is recommended for developers.
            </p>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-line" />
              <span className="text-2xs font-medium uppercase tracking-wider text-faint">
                or
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            {/* Dev / mock mode banner */}
            {isMock ? (
              <div className="rounded-card border border-info/30 bg-info-dim p-4">
                <div className="flex items-start gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content">
                      Running in dev mode
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      No OAuth secrets are configured — you&apos;re signed in as a
                      demo user.
                    </p>
                  </div>
                </div>
                <ButtonLink
                  href="/dashboard"
                  variant="outline"
                  size="md"
                  className="mt-3 w-full"
                >
                  Continue to dashboard
                  <ArrowRight className="h-3.5 w-3.5" />
                </ButtonLink>
              </div>
            ) : (
              <div className="rounded-card border border-line bg-surface-2 p-4">
                <p className="text-xs leading-relaxed text-muted">
                  New to AgentDock? Signing in with a provider creates your
                  account automatically — no separate sign-up required.
                </p>
              </div>
            )}

            {/* Card footer */}
            <p className="mt-6 text-center text-2xs leading-relaxed text-faint">
              By continuing you agree to our{" "}
              <Link
                href="/terms"
                className="text-subtle underline-offset-2 transition-colors hover:text-muted hover:underline"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-subtle underline-offset-2 transition-colors hover:text-muted hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* Below-card footer */}
          <p className="mt-6 text-center text-xs text-subtle">
            Want to look around first?{" "}
            <Link
              href="/explore"
              className="font-medium text-brand-muted transition-colors hover:text-brand"
            >
              Explore the marketplace
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
