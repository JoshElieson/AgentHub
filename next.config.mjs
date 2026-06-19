import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root (multiple lockfiles exist on this machine).
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Keep builds resilient for the MVP skeleton — lint/types are run via dedicated scripts.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  experimental: {
    outputFileTracingExcludes: {
      "**/*": [
        ".next/cache/**/*",
        ".git/**/*",
        ".agents/**/*",
        ".claude/**/*",
        "scripts/**/*",
      ],
    },
  },
};

export default nextConfig;
