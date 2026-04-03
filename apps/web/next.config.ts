import type { NextConfig } from 'next';

const config: NextConfig = {
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
