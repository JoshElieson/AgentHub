"use client";

import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

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

function Tag({
  children,
  tone = "brand",
}: {
  children: React.ReactNode;
  tone?: "brand" | "muted";
}) {
  const cls =
    tone === "brand"
      ? "bg-brand-fg/15 text-brand-fg ring-brand-fg/20"
      : "bg-surface-3 text-subtle ring-line";
  return (
    <span
      className={`absolute right-2.5 inline-flex items-center rounded-sm px-2 py-0.5 text-2xs font-semibold tracking-wide ring-1 ring-inset ${cls}`}
    >
      {children}
    </span>
  );
}

/**
 * OAuth sign-in buttons. Each provider's button is enabled only when that
 * provider's credentials are configured (see isGithubConfigured /
 * isGoogleConfigured); otherwise it's disabled with a "Not configured" tag so
 * users get a clear signal instead of a NextAuth error.
 */
export function LoginButtons({
  github,
  google,
}: {
  github: boolean;
  google: boolean;
}) {
  return (
    <div className="mt-7 space-y-3">
      <Button
        variant="primary"
        size="lg"
        className="relative w-full"
        disabled={!github}
        title={github ? undefined : "Set GITHUB_ID and GITHUB_SECRET to enable"}
        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
      >
        <Github className="h-4 w-4" />
        Continue with GitHub
        {github ? null : <Tag tone="muted">Not configured</Tag>}
      </Button>

      <Button
        variant="secondary"
        size="lg"
        className="relative w-full"
        disabled={!google}
        title={
          google
            ? undefined
            : "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable"
        }
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <GoogleGlyph className="h-4 w-4" />
        Continue with Google
        {!google && <Tag tone="muted">Not configured</Tag>}
      </Button>
    </div>
  );
}
