import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Raleway } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// Thin geometric display face for the Impeccable UI spotlight — the closest
// web-hosted match to Avenir Next / SF Pro Display Ultralight.
const display = Raleway({
  subsets: ["latin"],
  weight: ["200", "300"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agentdock.dev"),
  title: {
    default: "AgentDock — The package registry for AI agents",
    template: "%s · AgentDock",
  },
  description:
    "Discover, install, and share AI agents, skills, MCP servers, workflows, and prompt packs. The open registry for installable AI capabilities.",
  keywords: [
    "AI agents",
    "Claude skills",
    "MCP servers",
    "Cursor rules",
    "agent registry",
    "prompt packs",
  ],
  openGraph: {
    title: "AgentDock — The package registry for AI agents",
    description:
      "The open registry for AI agents, skills, MCP servers, workflows, and prompt packs.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#080B10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No session is read here, so static pages aren't forced into dynamic
  // rendering. The client session is fetched lazily by <SessionProvider>
  // inside <Providers>; server pages read it via getSessionUser().
  return (
    <html
      lang="en"
      className={`dark ${sans.variable} ${mono.variable} ${display.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
