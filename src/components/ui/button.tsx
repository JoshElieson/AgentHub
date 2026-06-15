import { cn } from "@/lib/utils";
import Link from "next/link";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-fg hover:bg-brand-hover active:bg-brand-hover border border-brand/60",
  secondary:
    "bg-surface-2 text-content hover:bg-surface-3 border border-line-strong",
  outline:
    "bg-transparent text-content hover:bg-surface-2 border border-line hover:border-line-strong",
  ghost:
    "bg-transparent text-muted hover:text-content hover:bg-surface-2 border border-transparent",
  danger:
    "bg-danger/10 text-danger hover:bg-danger/15 border border-danger/30",
  subtle: "bg-surface-3 text-content hover:bg-overlay border border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded",
  md: "h-9 px-4 text-sm gap-2 rounded-md",
  lg: "h-11 px-5 text-sm gap-2 rounded-md",
  icon: "h-9 w-9 rounded-md",
};

const base =
  "inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none select-none";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({
  className,
  variant = "secondary",
  size = "md",
  href,
  ...props
}: ButtonLinkProps) {
  const external = href.startsWith("http");
  const cls = cn(base, VARIANTS[variant], SIZES[size], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...props} />
    );
  }
  return <Link href={href} className={cls} {...props} />;
}
