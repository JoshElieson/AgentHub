import { AgentsBrowseClient } from "./agents-browse-client";

export const metadata = {
  title: "Agents — AgentDock",
  description:
    "Build, run, and share AI agents. Create custom agents with natural language prompts, connect tools from the registry, and let anyone run them with pay-as-you-go credits.",
};

export default function AgentsBrowsePage() {
  return <AgentsBrowseClient />;
}
