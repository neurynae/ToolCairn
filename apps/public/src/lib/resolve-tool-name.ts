import { MemgraphToolRepository } from '@toolpilot/graph';

const graphRepo = new MemgraphToolRepository();

/** Normalize a tool name for fuzzy matching — strips dots, hyphens, underscores, spaces, @ */
function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[@.\-_\s]/g, '');
}

/**
 * Resolve a user-supplied tool name to its canonical indexed name.
 * Tries exact match first, then falls back to fuzzy normalized match.
 * e.g. "nextjs" → "next.js", "mcpserver" → "mcp-server"
 */
export async function resolveToolName(name: string): Promise<string> {
  const exact = await graphRepo.findByName(name);
  if (exact.ok && exact.data != null) return name;

  const all = await graphRepo.getAllToolNames();
  if (!all.ok) return name;

  const qNorm = normalizeName(name);
  const prefixMatch = all.data.find((n) => normalizeName(n).startsWith(qNorm));
  if (prefixMatch) return prefixMatch;
  const subMatch = all.data.find(
    (n) => normalizeName(n).includes(qNorm) || qNorm.includes(normalizeName(n)),
  );
  return subMatch ?? name;
}
