"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/session";
import {
  updateProfile,
  regenerateAvatar,
  disconnectAccount,
  deleteAccount,
} from "@/lib/actions";
import {
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Github,
  Info,
  Loader2,
  Settings2,
  Shuffle,
  Trash2,
} from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-content placeholder:text-faint transition-colors focus:border-brand-line focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-content">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-subtle">{hint}</span>}
    </label>
  );
}

type Note = { tone: "success" | "error" | "info"; text: string } | null;

const PROVIDERS = [
  {
    key: "github",
    label: "GitHub",
    icon: <Github className="h-5 w-5" />,
  },
  {
    key: "google",
    label: "Google",
    icon: <span className="text-sm font-semibold text-content">G</span>,
  },
];

export function ProfileSettings({
  user,
  connectedProviders,
  canPersist,
}: {
  user: SessionUser;
  connectedProviders: string[];
  /** True when a database is connected, so profile changes can be saved. */
  canPersist: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<Note>(null);
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);

  // `github` / `twitter` are no longer editable here, but they stay in the form
  // so save() passes their existing values through unchanged (the public profile
  // still renders them) rather than nulling them out.
  const [form, setForm] = useState({
    name: user.name,
    username: user.username,
    website: user.website ?? "",
    location: user.location ?? "",
    github: user.github ?? "",
    twitter: user.twitter ?? "",
    bio: user.bio ?? "",
  });

  const initial = {
    name: user.name,
    username: user.username,
    website: user.website ?? "",
    location: user.location ?? "",
    github: user.github ?? "",
    twitter: user.twitter ?? "",
    bio: user.bio ?? "",
  };
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const readOnly = !canPersist;

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    setNote(null);
    startTransition(async () => {
      const res = await updateProfile(form);
      if (res.ok) {
        setNote({ tone: "success", text: "Profile saved." });
        router.refresh();
      } else {
        setNote({
          tone: res.code === "mock" ? "info" : "error",
          text: res.error,
        });
      }
    });
  }

  function changeAvatar() {
    setNote(null);
    startTransition(async () => {
      const res = await regenerateAvatar();
      if (res.ok) {
        setAvatarColor(res.data.avatarColor);
        router.refresh();
      } else {
        setNote({
          tone: res.code === "mock" ? "info" : "error",
          text: res.error,
        });
      }
    });
  }

  function connect(provider: string) {
    signIn(provider);
  }

  function disconnect(provider: string) {
    setNote(null);
    startTransition(async () => {
      const res = await disconnectAccount(provider);
      if (res.ok) {
        setNote({ tone: "success", text: `Disconnected ${provider}.` });
        router.refresh();
      } else {
        setNote({ tone: "error", text: res.error });
      }
    });
  }

  function removeAccount() {
    if (
      !window.confirm(
        "Permanently delete your account and all published packages? This cannot be undone."
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteAccount();
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        setNote({
          tone: res.code === "mock" ? "info" : "error",
          text: res.error,
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {readOnly && (
        <div className="flex items-start gap-2.5 rounded-card border border-info/30 bg-info-dim p-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <p className="text-xs leading-relaxed text-muted">
            <span className="font-medium text-content">Read-only.</span> Connect a
            database (<code className="font-mono text-2xs">DATABASE_URL</code>) to
            persist profile changes. The form below is fully wired — it just
            won&apos;t save until then.
          </p>
        </div>
      )}

      {note && <NoteBanner note={note} />}

      {/* Profile */}
      <section className="card p-5">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-brand-muted" />
          <h3 className="text-sm font-semibold text-content">Profile</h3>
        </div>
        <p className="mt-1 text-sm text-muted">
          This information appears on your public creator profile.
        </p>

        <div className="mt-5 flex items-center gap-4">
          <Avatar
            name={form.name || user.name}
            color={avatarColor}
            image={user.image}
            size="xl"
          />
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={changeAvatar}
              disabled={pending}
            >
              <Shuffle className="h-3.5 w-3.5" />
              Shuffle color
            </Button>
            <p className="mt-1.5 text-xs text-subtle">
              {user.image
                ? "Your photo comes from your sign-in provider."
                : "A gradient is generated from your account."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              className={inputCls}
              placeholder="Your name"
            />
          </Field>
          <Field label="Username">
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-line bg-surface-3 px-3 text-sm text-subtle">
                @
              </span>
              <input
                type="text"
                value={form.username}
                onChange={set("username")}
                className={cn(inputCls, "rounded-l-none")}
                placeholder="username"
              />
            </div>
          </Field>
          <Field label="Website" hint="Shown on your profile.">
            <input
              type="url"
              value={form.website}
              onChange={set("website")}
              className={inputCls}
              placeholder="https://example.com"
            />
          </Field>
          <Field label="Location">
            <input
              type="text"
              value={form.location}
              onChange={set("location")}
              className={inputCls}
              placeholder="City, Country"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Bio" hint="A short description, max 280 characters.">
              <textarea
                value={form.bio}
                onChange={set("bio")}
                rows={3}
                maxLength={280}
                className={cn(inputCls, "resize-none")}
                placeholder="Tell people what you build…"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-line pt-4">
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              setForm(initial);
              setNote(null);
            }}
            disabled={pending || !dirty}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={save}
            disabled={pending || !dirty}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </section>

      {/* Connected accounts */}
      <section className="card p-5">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-brand-muted" />
          <h3 className="text-sm font-semibold text-content">
            Connected accounts
          </h3>
        </div>
        <p className="mt-1 text-sm text-muted">
          Link accounts to sign in and verify package ownership.
        </p>

        <div className="mt-4 divide-y divide-line rounded-lg border border-line">
          {PROVIDERS.map((acc) => {
            const connected = connectedProviders.includes(acc.key);
            return (
              <div
                key={acc.key}
                className="flex items-center justify-between gap-3 p-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface-2 text-content">
                    {acc.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-content">
                      {acc.label}
                      {connected && (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-subtle">
                      {connected ? "Connected" : "Not connected"}
                    </span>
                  </div>
                </div>
                {connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect(acc.key)}
                    disabled={pending || readOnly}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => connect(acc.key)}
                    disabled={readOnly}
                  >
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Danger zone */}
      <section className="card border-danger/30 p-5">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-danger" />
          <h3 className="text-sm font-semibold text-danger">Danger zone</h3>
        </div>
        <p className="mt-1 text-sm text-muted">
          Irreversible and destructive actions.
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger-dim/40 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-content">
                Delete account
              </div>
              <span className="text-xs text-subtle">
                Permanently remove your account and all published packages.
              </span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={removeAccount}
              disabled={pending || readOnly}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function NoteBanner({ note }: { note: NonNullable<Note> }) {
  const tone = {
    success: "border-success/30 bg-success-dim text-success",
    error: "border-danger/30 bg-danger-dim text-danger",
    info: "border-info/30 bg-info-dim text-info",
  }[note.tone];
  const Icon =
    note.tone === "success"
      ? CheckCircle2
      : note.tone === "error"
        ? AlertCircle
        : Info;
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-card border p-3.5 text-sm",
        tone
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="text-content">{note.text}</span>
    </div>
  );
}
