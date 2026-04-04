import { PrismaClient } from '@toolpilot/db';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function makePrisma() {
  const client = new PrismaClient();
  // Eagerly connect so we detect failures fast rather than on first query
  client.$connect().catch(() => {
    // Ignore — Prisma will retry on the next query
  });
  return client;
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Wraps a Prisma call with one reconnect attempt.
 * When Docker restarts Postgres, the existing connection pool goes stale.
 * This helper discards the stale client and creates a fresh one on failure.
 */
export async function withReconnect<T>(fn: (db: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (
      msg.includes("Can't reach database") ||
      msg.includes('connection') ||
      msg.includes('ECONNREFUSED')
    ) {
      // Force a fresh client
      await prisma.$disconnect().catch(() => {});
      const fresh = new PrismaClient();
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = fresh;
      return fn(fresh);
    }
    throw err;
  }
}
