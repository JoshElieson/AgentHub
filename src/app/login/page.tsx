import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { getSessionUser } from "@/lib/session";
import {
  isAuthConfigured,
  isGithubConfigured,
  isGoogleConfigured,
} from "@/lib/auth";
import { LoginButtons } from "./login-buttons";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Nuclexa to publish and manage your AI packages.",
};

export default async function LoginPage() {
  // Already signed in → straight to the dashboard.
  const current = await getSessionUser();
  if (current?.isAuthenticated) redirect("/dashboard");

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
              <Logo href="/" className="[&>span]:text-2xl" />
              <h1 className="mt-5 text-xl font-semibold tracking-tight text-content">
                Sign in to Nuclexa
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Publish and manage your AI packages.
              </p>
            </div>

            {/* Providers (real OAuth — GitHub / Google) */}
            <LoginButtons
              github={isGithubConfigured}
              google={isGoogleConfigured}
            />

            {isGithubConfigured && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-2xs text-subtle">
                <ShieldCheck className="h-3 w-3 text-success" />
                GitHub is recommended for developers.
              </p>
            )}

            {/* Divider */}
            <div className="my-6 flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-line" />
              <span className="text-2xs font-medium uppercase tracking-wider text-faint">
                or
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            {/* Configuration / sign-up note */}
            {!isAuthConfigured ? (
              <div className="rounded-card border border-warning/30 bg-warning-dim p-4">
                <div className="flex items-start gap-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content">
                      Sign-in isn&apos;t configured yet
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      Add{" "}
                      <code className="font-mono text-2xs">GITHUB_ID</code> /{" "}
                      <code className="font-mono text-2xs">GITHUB_SECRET</code>{" "}
                      (and/or the Google equivalents) to{" "}
                      <code className="font-mono text-2xs">.env.local</code>,
                      then restart the dev server to enable GitHub &amp; Google
                      sign-in.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-card border border-line bg-surface-2 p-4">
                <p className="text-xs leading-relaxed text-muted">
                  New to Nuclexa? Signing in with a provider creates your
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
