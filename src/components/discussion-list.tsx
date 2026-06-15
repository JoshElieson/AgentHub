import type { Discussion } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Avatar } from "./ui/avatar";
import { CheckCircle2, MessageCircle, ArrowBigUp } from "lucide-react";

const CATEGORY_META: Record<
  Discussion["category"],
  { label: string; tone: string }
> = {
  "show-and-tell": { label: "Show & tell", tone: "border-brand-line text-brand-muted" },
  "q-and-a": { label: "Q&A", tone: "border-info/30 text-info" },
  ideas: { label: "Ideas", tone: "border-warning/30 text-warning" },
  general: { label: "General", tone: "border-line-strong text-muted" },
};

export function DiscussionList({ discussions }: { discussions: Discussion[] }) {
  return (
    <ul className="space-y-2.5">
      {discussions.map((d) => {
        const cat = CATEGORY_META[d.category];
        return (
          <li
            key={d.id}
            className="card-interactive flex items-start gap-3 p-4"
          >
            <Avatar name={d.authorName} color={d.avatarColor} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-sm border px-1.5 py-0.5 text-2xs font-medium",
                    cat.tone
                  )}
                >
                  {cat.label}
                </span>
                {d.isAnswered && (
                  <span className="inline-flex items-center gap-1 text-2xs font-medium text-success">
                    <CheckCircle2 className="h-3 w-3" /> Answered
                  </span>
                )}
              </div>
              <h4 className="mt-1.5 text-sm font-semibold text-content">{d.title}</h4>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{d.excerpt}</p>
              <div className="mt-2 text-xs text-subtle">
                {d.authorName} · {timeAgo(d.createdAt)}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 text-xs text-subtle">
              <span className="flex items-center gap-1 tabular-nums">
                <ArrowBigUp className="h-3.5 w-3.5" /> {d.upvotes}
              </span>
              <span className="flex items-center gap-1 tabular-nums">
                <MessageCircle className="h-3.5 w-3.5" /> {d.replies}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
