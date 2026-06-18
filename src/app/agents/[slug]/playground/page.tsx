import { AgentPlayground } from "./playground-client";

export const metadata = {
  title: "Agent Playground — AgentDock",
  description: "Run an AI agent in real-time with streaming responses.",
};

export default function PlaygroundPage() {
  return <AgentPlayground />;
}
