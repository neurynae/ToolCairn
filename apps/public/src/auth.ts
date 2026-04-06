import { PrismaAdapter } from '@auth/prisma-adapter';
import { buildAuthConfig } from '@toolpilot/auth';
import { prisma } from '@toolpilot/db';
import NextAuth from 'next-auth';

const config = buildAuthConfig(PrismaAdapter(prisma), async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, passwordHash: true },
  });
  return user;
});

// biome-ignore lint/suspicious/noExplicitAny: TS2742 — next-auth v5 deep type portability issue; 'any' is intentional here to break the inferred type reference chain
const _result = NextAuth(config) as any;

export const handlers = _result.handlers as {
  GET: (req: Request) => Promise<Response>;
  POST: (req: Request) => Promise<Response>;
};
export const auth = _result.auth as (...args: unknown[]) => Promise<unknown>;
export const signIn = _result.signIn as (...args: unknown[]) => Promise<unknown>;
export const signOut = _result.signOut as (...args: unknown[]) => Promise<unknown>;
