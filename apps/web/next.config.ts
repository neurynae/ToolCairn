import type { NextConfig } from 'next';

const config: NextConfig = {
  // Skip Next.js's own type checking during build.
  // Type safety is enforced via `pnpm typecheck` (tsc with project references)
  // which properly resolves Prisma and workspace package types.
  // Next.js's incremental type checker doesn't support project references fully
  // and produces false-positive implicit-any errors for Prisma results.
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transpile workspace packages so Next.js can process their TypeScript/ESM
  transpilePackages: ['@toolpilot/core', '@toolpilot/config'],

  // Packages that should run only in Node.js (not bundled into the browser)
  serverExternalPackages: [
    'neo4j-driver',
    'ioredis',
    'pino',
    '@toolpilot/graph',
    '@toolpilot/vector',
    '@toolpilot/queue',
    '@toolpilot/db',
    '@toolpilot/search',
  ],
};

export default config;
