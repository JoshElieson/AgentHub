import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative overflow-hidden rounded-md",
        className
      )}
      aria-hidden
    >
      <Image
        src="/logo.png"
        alt=""
        fill
        sizes="40px"
        priority
        className="object-cover"
      />
      <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/15" />
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
  showMark = false,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
  showMark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2", className)}
    >
      {showMark && <LogoMark className="h-7 w-7" />}
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-content">
          Nucl<span className="text-brand-muted">exa</span>
        </span>
      )}
    </Link>
  );
}
