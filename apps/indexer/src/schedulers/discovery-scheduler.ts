/**
 * Discovery Scheduler — finds new tools from GitHub and enqueues them for indexing.
 *
 * Flow:
 * 1. Read settings from AppSettings (topics, batch size, min stars, etc.)
 * 2. Skip if discovery_scheduler_enabled = false
 * 3. Search GitHub for repos matching topics
 * 4. Filter out already-indexed repos (query IndexedTool table)
 * 5. Enqueue new repos as index jobs (priority 0 = background)
 * 6. Update last_discovery_run timestamp
 * 7. Return count of new tools found/enqueued
 */

import { PrismaClient } from '@toolpilot/db';
import { enqueueIndexJob } from '@toolpilot/queue';
import pino from 'pino';
import { discoverReposAcrossTopics } from '../crawlers/github-discovery.js';

const logger = pino({ name: '@toolpilot/indexer:discovery-scheduler' });

export interface DiscoveryResult {
  found: number;
  newToSystem: number;
  enqueued: number;
  errors: string[];
}

interface DiscoverySettings {
  enabled: boolean;
  topics: string[];
  batchSize: number;
  minStars: number;
  lastPushedDays: number;
}

/**
 * Get settings from AppSettings table or return defaults.
 */
async function getSettings(prisma: PrismaClient): Promise<DiscoverySettings> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: 'global' },
  });

  return {
    enabled: settings?.discovery_scheduler_enabled ?? false,
    topics: settings?.discovery_topics ?? [
      'ai',
      'mcp',
      'mcp-server',
      'vector-db',
      'vector-database',
      'llm',
      'llm-framework',
      'rag',
      'retrieval-augmented-generation',
      'embedding',
      'embeddings',
      'chatbot',
      'conversational-ai',
      'agent',
      'ai-agent',
      'autonomous-agent',
    ],
    batchSize: settings?.discovery_batch_size ?? 20,
    minStars: settings?.discovery_min_stars ?? 100,
    lastPushedDays: settings?.discovery_last_pushed_days ?? 90,
  };
}

/**
 * Get list of already-indexed GitHub URLs to filter duplicates.
 */
async function getIndexedUrls(prisma: PrismaClient): Promise<Set<string>> {
  const tools = await prisma.indexedTool.findMany({
    select: { github_url: true },
    where: { index_status: { in: ['indexed', 'pending'] } },
  });

  return new Set(tools.map((t) => t.github_url));
}

/**
 * Run the discovery scheduler once.
 * Finds new repos from GitHub and enqueues them for indexing.
 */
export async function runDiscoveryScheduler(): Promise<DiscoveryResult> {
  const prisma = new PrismaClient();

  try {
    // 1. Check if discovery is enabled
    const settings = await getSettings(prisma);

    if (!settings.enabled) {
      logger.info('Discovery scheduler is disabled — skipping run');
      return { found: 0, newToSystem: 0, enqueued: 0, errors: [] };
    }

    logger.info(
      { topics: settings.topics, batchSize: settings.batchSize, minStars: settings.minStars },
      'Starting discovery scheduler',
    );

    // 2. Get already-indexed URLs
    const indexedUrls = await getIndexedUrls(prisma);
    logger.info({ indexedCount: indexedUrls.size }, 'Fetched already-indexed tools');

    // 3. Discover repos across topics
    const discovered = await discoverReposAcrossTopics(
      settings.topics,
      settings.minStars,
      settings.lastPushedDays,
      settings.batchSize * 2, // Fetch extra in case some are filtered
    );

    logger.info({ discovered: discovered.length }, 'GitHub discovery complete');

    // 4. Filter out already-indexed repos
    const newRepos = discovered.filter((repo) => {
      const url = `https://github.com/${repo.fullName}`;
      return !indexedUrls.has(url);
    });

    // 5. Enqueue new repos (limit to batch size)
    const toEnqueue = newRepos.slice(0, settings.batchSize);
    let enqueued = 0;
    const errors: string[] = [];

    for (const repo of toEnqueue) {
      try {
        const result = await enqueueIndexJob(repo.fullName, 0); // priority 0 = background
        if (result.ok) {
          enqueued++;
          logger.debug({ repo: repo.fullName, streamId: result.data }, 'Enqueued discovery job');
        } else {
          errors.push(`Failed to enqueue ${repo.fullName}: ${result.error}`);
        }
      } catch (err) {
        const errorMsg = `Error enqueuing ${repo.fullName}: ${err instanceof Error ? err.message : String(err)}`;
        errors.push(errorMsg);
        logger.error({ repo: repo.fullName, err }, 'Failed to enqueue');
      }
    }

    // 6. Update last_discovery_run timestamp
    await prisma.appSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', last_discovery_run: new Date() },
      update: { last_discovery_run: new Date() },
    });

    logger.info(
      { found: discovered.length, newToSystem: newRepos.length, enqueued },
      'Discovery scheduler complete',
    );

    return {
      found: discovered.length,
      newToSystem: newRepos.length,
      enqueued,
      errors,
    };
  } catch (err) {
    logger.error({ err }, 'Discovery scheduler failed');
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}
