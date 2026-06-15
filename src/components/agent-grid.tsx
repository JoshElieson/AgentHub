import type { AgentPackage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AgentCard } from "./agent-card";

export function AgentGrid({
  agents,
  className,
  columns = 3,
}: {
  agents: AgentPackage[];
  className?: string;
  columns?: 2 | 3 | 4;
}) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid grid-cols-1 gap-3", cols, className)}>
      {agents.map((a) => (
        <AgentCard key={a.slug} agent={a} />
      ))}
    </div>
  );
}
