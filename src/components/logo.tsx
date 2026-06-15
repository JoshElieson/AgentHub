import { cn } from "@/lib/utils";
import Link from "next/link";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-md",
        className
      )}
      style={{ background: "linear-gradient(160deg,#8A6CFF,#6E4FF0)" }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[60%] w-[60%]">
        {/* stylized package / dock cube */}
        <path
          d="M12 2.5l8 4.2v9.6L12 21.5l-8-5.2V6.7l8-4.2z"
          stroke="white"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M4 6.7l8 4.4 8-4.4M12 21.5V11.1"
          stroke="white"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/15" />
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  showWordmark = true,
}: {
  className?: string;
  href?: string;
  showWordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2", className)}
    >
      <LogoMark className="h-7 w-7" />
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-content">
          Agent<span className="text-brand-muted">Dock</span>
        </span>
      )}
    </Link>
  );
}
