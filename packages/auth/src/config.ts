import type { NextAuthConfig } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { verifyPassword } from './password.js';
import { loginSchema } from './schemas.js';

/**
 * Build the Auth.js v5 configuration.
 * Call this with the Prisma adapter and db client injected so it
 * can be used in both Next.js and standalone contexts.
 */
export function buildAuthConfig(
  adapter: Adapter,
  findUserByEmail: (
    email: string,
  ) => Promise<{ id: string; email: string; passwordHash: string | null } | null>,
): NextAuthConfig {
  return {
    adapter,
    session: { strategy: 'jwt' },
    pages: {
      signIn: '/login',
      newUser: '/explore',
    },
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID ?? '',
        clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
        // Allow linking Google to an existing email/password account
        allowDangerousEmailAccountLinking: true,
      }),
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID ?? '',
        clientSecret: process.env.AUTH_GITHUB_SECRET ?? '',
        // Allow linking GitHub to an existing email/password account
        allowDangerousEmailAccountLinking: true,
      }),
      Credentials({
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const user = await findUserByEmail(parsed.data.email);
          if (!user || !user.passwordHash) return null;

          const valid = await verifyPassword(parsed.data.password, user.passwordHash);
          if (!valid) return null;

          return { id: user.id, email: user.email };
        },
      }),
    ],
    callbacks: {
      jwt({ token, user }) {
        if (user) {
          token.userId = user.id;
        }
        return token;
      },
      session({ session, token }) {
        if (token.userId && session.user) {
          (session.user as { id?: string }).id = token.userId as string;
        }
        return session;
      },
    },
  };
}
