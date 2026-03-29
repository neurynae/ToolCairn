// @toolpilot/graph — Memgraph client, Cypher queries, repositories

// Client
export {
  closeMemgraphDriver,
  getMemgraphDriver,
  getMemgraphSession,
  memgraphHealthCheck,
  type HealthCheckResult,
} from './client.js';

// Queries
export {
  CREATE_TOOL,
  DELETE_TOOL,
  FIND_TOOL_BY_NAME,
  FIND_TOOLS_BY_CATEGORY,
  GET_DIRECT_EDGES_BETWEEN,
  GET_RELATED_TOOLS,
  GET_TOOL_CO_OCCURRENCES,
  GET_TOOL_GRAPH_RERANK,
  GET_TOOL_NEIGHBORHOOD,
  TOOL_EXISTS,
  buildDecrementEdgeWeightQuery,
  buildIncrementEdgeWeightQuery,
  buildUpsertEdgeQuery,
  mapNeighborhoodRecords,
  mapRecordToToolNode,
  mapRecordToToolNodeWithScore,
  type CreateToolParams,
  type FindByCategoryParams,
  type FindByNameParams,
  type GetRelatedParams,
  type GetToolNeighborhoodParams,
  type ToolNeighborEdge,
  type ToolNeighborhood,
  type UpsertEdgeParams,
} from './queries/tool.queries.js';

// Repository interfaces
export type {
  DirectEdge,
  RepositoryError,
  ToolRepository,
} from './repositories/interfaces.js';

// Repository implementations
export { MemgraphToolRepository } from './repositories/tool.repository.js';

// Topology queries (for admin portal)
export {
  GET_EDGE_WEIGHT_SUMMARY,
  GET_GRAPH_TOPOLOGY,
  type EdgeWeightSummaryRow,
  type TopologyParams,
  type TopologyRow,
} from './queries/topology.queries.js';

// In-memory fakes (for unit testing)
export { FakeToolRepository } from './test/fakes/tool.repository.fake.js';
