/**
 * tsup bundle config for the published @toolpilot/mcp npm package.
 *
 * Entry point: src/index.ts (which uses server.prod.ts in production mode)
 * Output: dist-publish/index.js — a single bundled ESM file
 *
 * All @toolpilot/* workspace packages are bundled inline.
 * @modelcontextprotocol/sdk is kept external (peer dep, already bundled by it).
 * Node built-ins are not bundled.
 */
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist-publish',
  bundle: true,
  sourcemap: true,
  clean: true,
  // Keep MCP SDK external — it needs its own resolution
  external: ['@modelcontextprotocol/sdk'],
  // Bundle all internal workspace packages
  noExternal: [/@toolpilot\/.*/],
  // Ensure node: imports work
  platform: 'node',
});
