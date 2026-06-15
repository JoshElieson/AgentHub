import { PrismaClient } from "@prisma/client";

// Single PrismaClient instance, reused across hot reloads in dev so we don't
// exhaust the database connection pool. See:
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * True when a database connection string is configured. Auth/profile features
 * persist to Postgres only when this is set; otherwise the app stays in
 * mock-data dev mode and never touches the database (so `next build` and local
 * dev work with zero infrastructure).
 */
export const isDbConfigured = Boolean(process.env.DATABASE_URL);
