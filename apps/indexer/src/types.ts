import type { ToolNode } from '@toolpilot/core';

export interface ExtractedToolData {
  name: string;
  display_name: string;
  description: string;
  github_url: string;
  homepage_url?: string;
  license: string;
  language: string;
  languages: string[];
  package_managers: Record<string, string>;
  deployment_models: string[];
}

export interface CrawlerResult {
  source: 'github' | 'npm' | 'pypi' | 'crates.io';
  url: string;
  raw: unknown;
  extracted: ExtractedToolData;
}

export interface ProcessedTool {
  node: ToolNode;
  vector: number[];
  relationships: Array<{
    targetId: string;
    edgeType: string;
    weight: number;
    confidence: number;
    source: string;
    decayRate: number;
  }>;
}

export interface IndexJob {
  toolId: string;
  priority: number;
}
