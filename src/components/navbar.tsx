"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Logo } from "./logo";
import { SearchBar } from "./search-bar";
import { Button, ButtonLink } from "./ui/button";
import { Avatar } from "./ui/avatar";
import {
  Bookmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import { useAuthStatus, useDisplayUser } from "./providers";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/collections", label: "Collections" },
  { href: "/docs", label: "Docs" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const status = useAuthStatus();
  const user = useDisplayUser();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-line glass">
      <div className="mx-auto flex h-14 w-full max-w-[1792px] items-center gap-3 px-4 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                isActive(l.href)
                  ? "bg-surface-2 text-content"
                  : "text-muted hover:bg-surface-2 hover:text-content"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="ml-auto hidden max-w-sm flex-1 lg:block">
          <SearchBar />
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          {user ? (
            <>
              <ButtonLink
                href="/publish"
                variant="secondary"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Upload className="h-3.5 w-3.5" />
                Publish
              </ButtonLink>
              <ButtonLink
                href="/saved"
                variant="secondary"
                size="sm"
                className="hidden w-8 px-0 sm:inline-flex"
                aria-label="Saved Packages"
                title="Saved Packages"
              >
                <Bookmark className="h-4 w-4" />
              </ButtonLink>
              <UserMenu
                user={user}
                onSignOut={() => signOut({ callbackUrl: "/" })}
              />
            </>
          ) : status === "loading" ? (
            // Avoid a sign-in/avatar flash while the session resolves.
            <span className="hidden h-8 w-20 animate-pulse rounded-md bg-surface-2 sm:block" />
          ) : (
            <ButtonLink href="/login" variant="primary" size="sm">
              Sign in
            </ButtonLink>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface-2 text-muted md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-line bg-surface px-4 py-3 md:hidden animate-fade-in">
          <SearchBar className="mb-3" />
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded px-3 py-2 text-sm font-medium",
                  isActive(l.href)
                    ? "bg-surface-2 text-content"
                    : "text-muted hover:bg-surface-2 hover:text-content"
                )}
              >
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <ButtonLink
                    href="/publish"
                    variant="secondary"
                    size="sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Upload className="h-3.5 w-3.5" /> Publish
                  </ButtonLink>
                  <ButtonLink
                    href="/dashboard"
                    variant="outline"
                    size="sm"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </ButtonLink>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 justify-start"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </Button>
              </>
            ) : (
              <ButtonLink
                href="/login"
                variant="primary"
                size="sm"
                className="mt-2"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </ButtonLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

// ---------------------------------------------------------------------------
// User dropdown
// ---------------------------------------------------------------------------

function UserMenu({
  user,
  onSignOut,
}: {
  user: {
    name: string;
    username: string;
    avatarColor: string | null;
    image: string | null;
  };
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center rounded-full transition-opacity hover:opacity-80"
        title={user.name}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar
          name={user.name}
          color={user.avatarColor ?? undefined}
          image={user.image}
          size="sm"
        />
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <button
            className="fixed inset-0 z-40 cursor-default"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-card border border-line bg-surface shadow-elevated animate-fade-in"
          >
            <div className="border-b border-line px-3 py-3">
              <div className="truncate text-sm font-medium text-content">
                {user.name}
              </div>
              <div className="truncate font-mono text-xs text-subtle">
                @{user.username}
              </div>
            </div>
            <div className="py-1">
              <MenuLink
                href={`/u/${user.username}`}
                icon={<UserIcon className="h-4 w-4" />}
                label="View profile"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/dashboard"
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Dashboard"
                onClick={() => setOpen(false)}
              />
              <MenuLink
                href="/dashboard?section=settings"
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
                onClick={() => setOpen(false)}
              />
            </div>
            <div className="border-t border-line py-1">
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-content"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-content"
    >
      <span className="text-subtle">{icon}</span>
      {label}
    </Link>
  );
}
