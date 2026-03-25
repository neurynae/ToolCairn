# ADR-001: Use Memgraph as the Primary Graph Database

**Date**: 2026-03-25
**Status**: accepted

## Context

ToolPilot needs a graph database to store Tool nodes and their relationships (SOLVES, INTEGRATES_WITH, CONFLICTS_WITH, etc.) with weighted, time-decaying edges. Key requirements: Cypher query language, high-performance traversal, in-memory storage for low-latency reads, Docker deployment.

Evaluated: Neo4j (community), ArangoDB, Memgraph.

## Decision

Use **Memgraph** (`memgraph/memgraph-mage:latest`) with `neo4j-driver` for Bolt protocol access.

## Consequences

**Positive**:
- Full Cypher compatibility — same queries work against Neo4j if we ever migrate
- In-memory architecture = sub-millisecond traversal for the 200ms latency budget
- MAGE library provides graph algorithms (PageRank, community detection) out of the box
- Free for self-hosted use

**Negative**:
- Graph must fit in RAM — not suitable for very large graphs (> millions of nodes)
- Memgraph-specific MCP requires building Docker image from memgraph/ai-toolkit

**Neutral**:
- Using neo4j-driver (not memgraph-specific client) keeps future migration options open
