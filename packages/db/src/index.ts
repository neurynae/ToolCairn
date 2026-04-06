// @toolpilot/db — PostgreSQL via Prisma (staging layer + search sessions)
export { PrismaClient } from '@prisma/client';

import { PrismaClient } from '@prisma/client';

// Singleton — reuse across hot reloads in dev, single instance in prod
const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma._prisma ?? new PrismaClient({ log: [] });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma._prisma = prisma;
}
