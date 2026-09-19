import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) return value;
  const url = new URL(value);
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "1");
  if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "20");
  return url.toString();
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    datasources: { db: { url: getDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
