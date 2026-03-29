import type { GraphEdge, Result, ToolCategory, ToolNode } from '@toolpilot/core';
import type { ToolNeighborhood } from '../queries/tool.queries.js';

export interface RepositoryError {
  code: string;
  message: string;
}

export interface DirectEdge {
  edgeType: string;
  weight: number;
  effective_weight: number;
  confidence: number;
  direction: 'a_to_b' | 'b_to_a';
}

export interface ToolRepository {
  createTool(tool: ToolNode): Promise<Result<ToolNode, RepositoryError>>;
  findByName(name: string): Promise<Result<ToolNode | null, RepositoryError>>;
  findByCategory(category: ToolCategory): Promise<Result<ToolNode[], RepositoryError>>;
  findByCategories(categories: ToolCategory[]): Promise<Result<ToolNode[], RepositoryError>>;
  upsertEdge(edge: GraphEdge): Promise<Result<void, RepositoryError>>;
  getRelated(toolName: string, depth?: number): Promise<Result<ToolNode[], RepositoryError>>;
  getToolNeighborhood(name: string): Promise<Result<ToolNeighborhood | null, RepositoryError>>;
  getDirectEdges(nameA: string, nameB: string): Promise<Result<DirectEdge[], RepositoryError>>;
  deleteTool(name: string): Promise<Result<void, RepositoryError>>;
  toolExists(name: string): Promise<Result<boolean, RepositoryError>>;
}
