import type { NextConfig } from 'next';

const config: NextConfig = {
  // Skip Next.js's own type checking during build — tsc via `pnpm typecheck` handles this
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
    '@toolpilot/tools',
  ],
};

export default config;
