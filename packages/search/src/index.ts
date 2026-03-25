// @toolpilot/search — 4-stage guided search pipeline
// Stage 1: Hybrid retrieval (BM25 + vector + RRF) → top 50
// Stage 2: Hard filters (Qdrant payload filters) → ~15
// Stage 3: Graph re-ranking (Memgraph Cypher + temporal decay) → ranked
// Stage 4: Precision selection (stable/emerging logic) → 1-2 results
// Implemented in Phase 3
export {};
