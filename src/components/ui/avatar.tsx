import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const SIZES = {
  xs: "h-5 w-5 text-[9px] rounded-md",
  sm: "h-7 w-7 text-[11px] rounded-md",
  md: "h-9 w-9 text-xs rounded-lg",
  lg: "h-12 w-12 text-sm rounded-xl",
  xl: "h-20 w-20 text-xl rounded-2xl",
  "2xl": "h-24 w-24 text-2xl rounded-2xl",
} as const;

export function Avatar({
  name,
  color,
  image,
  size = "md",
  square,
  className,
}: {
  name: string;
  color?: string;
  /** Optional photo URL (e.g. OAuth profile picture). Falls back to initials. */
  image?: string | null;
  size?: keyof typeof SIZES;
  square?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden font-semibold text-white ring-1 ring-inset ring-white/10",
        SIZES[size],
        square && "!rounded-md",
        className
      )}
      style={{
        background: color ?? "linear-gradient(135deg,#3A3F4A,#22262E)",
      }}
      aria-hidden
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
