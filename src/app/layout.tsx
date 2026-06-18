import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Raleway, Alumni_Sans } from "next/font/google";
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

// Wordmark face for the hero headline — the same typeface the "Impeccable"
// logo uses on impeccable.style (Alumni Sans, a tall geometric display sans).
const wordmark = Alumni_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-wordmark",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nuclexa.dev"),
  title: {
    default: "Nuclexa — The package registry for AI agents",
    template: "%s · Nuclexa",
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
    title: "Nuclexa — The package registry for AI agents",
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
      className={`dark ${sans.variable} ${mono.variable} ${display.variable} ${wordmark.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
