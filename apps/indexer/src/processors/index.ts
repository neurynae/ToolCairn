import { createHash } from 'node:crypto';
import type { DeploymentModel, ToolCategory, ToolNode } from '@toolpilot/core';
import pino from 'pino';
import type { CrawlerResult, ProcessedTool } from '../types.js';
import { generateEmbedding } from './embedding-processor.js';
import { calculateHealth } from './health-calculator.js';
import { extractRelationships } from './relationship-extractor.js';

const logger = pino({ name: '@toolpilot/indexer:processor' });

const VALID_DEPLOYMENT_MODELS: ReadonlySet<DeploymentModel> = new Set<DeploymentModel>([
  'self-hosted',
  'cloud',
  'embedded',
  'serverless',
]);

function toDeploymentModel(value: string): DeploymentModel {
  if (VALID_DEPLOYMENT_MODELS.has(value as DeploymentModel)) {
    return value as DeploymentModel;
  }
  return 'self-hosted';
}

/**
 * Generate a deterministic UUID v4-shaped ID from a GitHub URL.
 * Re-indexing the same tool always produces the same ID (prevents duplicate Qdrant points).
 */
function deterministicId(githubUrl: string): string {
  const hash = createHash('sha256').update(githubUrl).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Exclusion signals that override generic framework/server matches.
 * If any of these appear in the combined name+description, we skip 'web-framework'.
 */
const WEB_FRAMEWORK_EXCLUSIONS = [
  'mobile',
  'native app',
  'text editor',
  'rich text',
  'ui toolkit',
  'component library',
  'state management',
  'state manager',
  'rich-text',
  'wysiwyg',
  'ios',
  'android',
] as const;

/**
 * Infer a ToolCategory from name, description and language signals.
 * Defaults to 'other'.
 */
function inferCategory(name: string, description: string, language: string): ToolCategory {
  const lower = `${name} ${description}`.toLowerCase();

  if (
    lower.includes('vector') &&
    (lower.includes('database') || lower.includes('db') || lower.includes('store'))
  ) {
    return 'vector-database';
  }
  if (lower.includes('graph') && (lower.includes('database') || lower.includes('db'))) {
    return 'graph-database';
  }
  if (
    lower.includes('sql') ||
    lower.includes('relational') ||
    lower.includes('postgres') ||
    lower.includes('mysql')
  ) {
    return 'relational-database';
  }
  if (
    lower.includes('llm') ||
    lower.includes('language model') ||
    lower.includes('gpt') ||
    lower.includes('claude')
  ) {
    return 'llm-framework';
  }
  if (lower.includes('agent') && (lower.includes('framework') || lower.includes('sdk'))) {
    return 'agent-framework';
  }
  if (lower.includes('mcp') || lower.includes('model context protocol')) {
    return 'mcp-server';
  }
  if (lower.includes('embed') && (lower.includes('model') || lower.includes('api'))) {
    return 'embedding';
  }
  if (lower.includes('search') && !lower.includes('full-text')) {
    return 'search';
  }
  if (lower.includes('queue') || lower.includes('stream') || lower.includes('message broker')) {
    return 'queue';
  }
  if (lower.includes('cache') || lower.includes('redis') || lower.includes('memcache')) {
    return 'cache';
  }
  if (
    lower.includes('monitor') ||
    lower.includes('observabilit') ||
    lower.includes('metric') ||
    lower.includes('tracing')
  ) {
    return 'monitoring';
  }
  if (lower.includes('test') && (lower.includes('framework') || lower.includes('runner'))) {
    return 'testing';
  }
  if (lower.includes('auth') || lower.includes('oauth') || lower.includes('jwt')) {
    return 'auth';
  }
  if (
    lower.includes('devops') ||
    lower.includes('ci/cd') ||
    lower.includes('deploy') ||
    lower.includes('container')
  ) {
    return 'devops';
  }

  // web-framework: ONLY HTTP/API server frameworks, NOT mobile/native/UI/editor/state-management
  if (
    lower.includes('web') &&
    (lower.includes('framework') || lower.includes('server') || lower.includes('api'))
  ) {
    const hasExclusion = WEB_FRAMEWORK_EXCLUSIONS.some((term) => lower.includes(term));
    if (!hasExclusion) {
      return 'web-framework';
    }
  }

  // Language-based fallback
  if (language === 'Rust' || language === 'Go' || language === 'C' || language === 'C++') {
    return 'other';
  }

  return 'other';
}

/**
 * Orchestrates: health-calculator → relationship-extractor → embedding-processor
 * Builds a full ProcessedTool from a CrawlerResult.
 */
export async function processTool(crawlerResult: CrawlerResult): Promise<ProcessedTool> {
  const { extracted, raw } = crawlerResult;
  const now = new Date().toISOString();

  logger.info({ toolName: extracted.name }, 'Processing tool');

  const health = calculateHealth(raw);
  const relationships = extractRelationships(extracted, raw);

  const category = inferCategory(extracted.name, extracted.description, extracted.language);

  const deploymentModels: DeploymentModel[] = extracted.deployment_models.map(toDeploymentModel);

  const node: ToolNode = {
    id: deterministicId(extracted.github_url),
    name: extracted.name,
    display_name: extracted.display_name,
    description: extracted.description,
    category,
    github_url: extracted.github_url,
    homepage_url: extracted.homepage_url,
    license: extracted.license,
    language: extracted.language,
    languages: extracted.languages,
    deployment_models: deploymentModels,
    package_managers: extracted.package_managers,
    health,
    docs: {
      readme_url: `${extracted.github_url}/blob/main/README.md`,
    },
    created_at: now,
    updated_at: now,
  };

  let vector: number[] = [];
  try {
    vector = await generateEmbedding(node);
  } catch (e) {
    logger.warn(
      { toolName: node.name, err: e },
      'Embedding generation failed — skipping vector write',
    );
  }

  return {
    node,
    vector,
    relationships,
  };
}
