import { AgentBuilderWizard } from "./agent-builder-wizard";

export const metadata = {
  title: "Create Agent — AgentDock",
  description:
    "Build your own AI agent with a system prompt, tools from the registry, and custom I/O configuration. Publish it for others to use with pay-as-you-go credits.",
};

export default function CreateAgentPage() {
  return <AgentBuilderWizard />;
}
