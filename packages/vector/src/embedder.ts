import { config } from '@toolpilot/config';
import { VectorError } from './errors.js';

const NOMIC_API_URL = 'https://api.nomic.ai/v1/embeddings';
const NOMIC_MODEL = 'nomic-embed-code-v1.5';
const BATCH_SIZE = 100;

export async function embedText(
  text: string,
  taskType: 'search_document' | 'search_query' = 'search_document',
): Promise<number[]> {
  const results = await embedBatch([text], taskType);
  const result = results[0];
  if (!result) throw new VectorError('embedText: no embedding returned');
  return result;
}

export async function embedBatch(
  texts: string[],
  taskType: 'search_document' | 'search_query' = 'search_document',
): Promise<number[][]> {
  const apiKey = config.NOMIC_API_KEY;
  if (!apiKey) throw new VectorError('NOMIC_API_KEY is not configured');

  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch(NOMIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NOMIC_MODEL,
        texts: batch,
        task_type: taskType,
      }),
    });

    if (!response.ok) {
      throw new VectorError(`Nomic API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { embeddings: number[][] };
    embeddings.push(...data.embeddings);
  }

  return embeddings;
}

/** Canonical text for embedding a ToolNode. */
export function toolEmbedText(name: string, description: string, category: string): string {
  return `${name}\n${description}\n${category}`;
}
