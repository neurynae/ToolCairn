# ToolPilot — Technical Deep Dive: Search, Storage, and Cross-Compatibility

> Research document covering the three make-or-break pillars of the ToolPilot platform.
> If any one of these fails, the product fails. This document explores the current state of the art and proposes concrete implementation strategies for each.

---

## 1. Storage: The Graph Engine

The graph database is the foundation everything else sits on. A wrong choice here means rewriting the entire system later.

### 1.1 Why a Property Graph (Not a Document Store, Not a Relational DB)

ToolPilot's data is fundamentally relational — tools depend on each other, compete, complement, integrate, conflict, and co-occur. A flat list or relational table misses these connections entirely. A property graph models them natively: nodes are entities (tools, use cases, versions), edges are relationships (SOLVES, CONFLICTS_WITH, INTEGRATES_WITH), and both carry typed properties.

The key requirement is that ToolPilot's graph is **dynamic** — edge weights change over time based on usage, new tools appear, old ones decay, version nodes get added. This isn't a static knowledge graph. It's a living, evolving system that needs to handle reads and writes concurrently without latency spikes.

### 1.2 Database Selection — The Real Options in 2026

After evaluating the landscape, three serious candidates emerge for ToolPilot's use case:

**Option A: Memgraph (Recommended for ToolPilot)**

Memgraph is an in-memory property graph database written in C++, fully Cypher-compatible, and open source. It's the right fit for ToolPilot for several specific reasons:

- **In-memory processing** delivers sub-millisecond read latency — critical because every MCP `search_tools()` call needs to complete fast enough that agents don't notice the delay. Agents making runtime tool decisions operate in milliseconds, not seconds.
- **Cypher + Bolt protocol compatibility** means the entire Neo4j ecosystem of drivers (Python, Rust, Node.js, Go) works out of the box. No vendor lock-in; you could migrate to Neo4j later if needed.
- **Built-in streaming connectors** (Kafka, Pulsar) support the decoupled read/write architecture — search results stream back immediately while update jobs flow through a message queue to the background writer.
- **MAGE algorithm library** provides pre-built graph algorithms (PageRank, community detection, shortest path) that directly support the graph traversal re-ranking in Stage 3 of the search.
- **Temporal Graph Networks (TGN) support** — Memgraph has native TGN capabilities, which are directly applicable to ToolPilot's time-decaying edge weight system. TGN uses a memory module that keeps historical dependencies for each node, meaning tool relationships can be updated based on temporal patterns without continuous retraining.
- NASA migrated from Neo4j to Memgraph for real-time performance — a strong validation for latency-sensitive graph workloads.

**Trade-off**: Being in-memory means the entire graph must fit in RAM. For ToolPilot's initial 500-5000 tools with ~50K-500K edges, this is trivially within a single node's capacity (well under 16GB). At 100K+ tools, you'd need to plan for horizontal scaling or tiered storage.

**Option B: FalkorDB**

FalkorDB is a low-latency graph database built on Redis, designed specifically for AI/GraphRAG workloads. It includes native vector indexing and similarity search — meaning you could potentially run both the graph traversal AND the semantic vector search within the same database, eliminating the need for a separate vector store. It supports cosine similarity and Euclidean distance for vector search alongside standard Cypher graph queries. This "unified graph + vector" approach reduces infrastructure complexity significantly.

**Trade-off**: Smaller ecosystem than Memgraph/Neo4j. Bolt protocol support is still experimental. Less battle-tested at scale.

**Option C: ArcadeDB**

ArcadeDB is a multi-model database supporting graph (Cypher + Gremlin), document, key-value, time-series, and vector data in a single engine under Apache 2.0 license. It passes 97.8% of the Cypher compatibility kit. The multi-model approach means you could store tool metadata (documents), graph relationships, version timelines (time-series), and embeddings (vectors) in one system.

**Trade-off**: Smaller community. Less real-world validation for high-throughput graph workloads compared to Memgraph.

### 1.3 Storage Architecture — The Dual-Layer Design

ToolPilot's storage needs two layers that work in concert:

**Layer 1: Property Graph (Memgraph)**
Stores the tool mesh — nodes, typed edges, weights, confidence scores, timestamps. Handles all graph traversal queries. This is the source of truth for tool relationships.

**Layer 2: Vector Store (Separate or Integrated)**

Stores semantic embeddings of use-case descriptions, tool descriptions, and issue descriptions. Handles Stage 1 semantic retrieval. Two approaches:

- **Integrated approach (FalkorDB)**: Graph + vectors in one database. Simpler infrastructure, but less flexibility in embedding model choice.
- **Separated approach (Memgraph + dedicated vector DB)**: Use Qdrant, Milvus, or LanceDB alongside Memgraph. More complex infrastructure, but each component is best-in-class. Qdrant is a strong choice here given it's Rust-native, MIT-licensed, and handles filtered vector search natively — which maps directly to ToolPilot's Stage 2 hard filters applied on top of vector results.

**Recommendation**: Start with the separated approach (Memgraph + Qdrant). The Stage 1 vector search and Stage 3 graph traversal have fundamentally different performance profiles, and decoupling them means you can optimize each independently. If infrastructure complexity becomes a bottleneck, evaluate FalkorDB as a unified alternative.

### 1.4 Temporal Edge Weight Decay — Implementation

Every edge in the graph carries a `weight`, `confidence`, `last_verified` timestamp, and `decay_rate`. The effective weight at query time is computed as:

```
effective_weight = base_weight × exp(-decay_rate × days_since_last_verified)
```

This exponential decay means relationships that aren't reinforced by actual usage (via `report_outcome` callbacks or fresh GitHub signal) gradually lose influence. A tool relationship verified yesterday has full weight; one verified 6 months ago with no reinforcing signal has negligible weight.

The decay function runs at **query time**, not as a batch job. This means the graph data stays immutable between updates — you're not constantly rewriting edge weights. Instead, the traversal algorithm computes effective weights on-the-fly during Stage 3. This eliminates write contention entirely for the decay mechanism.

For reinforcement, every `report_outcome` callback that confirms a tool was successfully used in a given context resets the `last_verified` timestamp and may increase the `base_weight`. This creates the self-calibrating feedback loop — popular, working combinations stay strong; unused or failing combinations naturally fade.

### 1.5 AI-Generated Node Governance — The Staging Layer

AI-generated nodes and edges don't write to the main graph. They enter a staging table (can be a simple PostgreSQL table or a separate Memgraph label) with:

```
{
  node_or_edge_data: {...},
  confidence: 0.0 - 1.0,
  source: "ai_generated",
  created_at: timestamp,
  supporting_evidence: [query_ids that triggered this],
  graduated: false
}
```

Graduation criteria (must meet ALL):
- Confidence ≥ 0.75
- At least 3 independent queries have produced the same relationship
- No contradicting evidence in the main graph
- Manual review approved (for the initial months; can be relaxed once quality patterns are established)

This prevents AI hallucinations from corrupting the mesh — which is a critical risk. A single bad edge ("Tool A integrates with Tool B" when it doesn't) could cascade into wrong recommendations for every user whose context touches those nodes.

---

## 2. Search: The Multi-Stage Guided Discovery Engine

Search is the product. If the recommendations aren't better than asking ChatGPT, ToolPilot has no reason to exist.

### 2.1 The Hybrid Vector-Graph Search Architecture

The current state of the art in retrieval systems (2026) has converged on a clear pattern: **hybrid retrieval combining vector search for breadth with graph traversal for depth outperforms either approach alone by 15-30% on faithfulness and answer relevancy.**

This is exactly what ToolPilot's 4-stage search implements, but with a critical twist: the **human-in-the-loop clarification** between stages acts as an active learning signal that eliminates ambiguity before the final ranking, rather than after.

Research from the HybridRAG paper (CIKM 2026) confirms: vector search provides broad, similarity-based retrieval while graph-based retrieval contributes structured, relationship-rich context. Combining both outperforms either individually at both the retrieval and generation stages.

### 2.2 Stage 1 — Semantic Retrieval: Embedding Model Selection

The embedding model choice is critical. ToolPilot embeds tool descriptions, use-case descriptions, and issue text — a mix of natural language and technical/code terminology. The wrong model produces poor candidates in Stage 1, and no amount of downstream filtering can recover from a bad initial pool.

**Recommended: Nomic Embed Code or Jina Code V2**

Code-aware embedding models are essential because ToolPilot's queries contain technical terminology that general text models handle poorly. "My search returns null" and "query returns empty results" must be recognized as semantically identical — a general text model might miss this because the surface-level words are completely different, but a code-aware model trained on issue bodies and documentation understands they describe the same symptom.

The Code-Embed family of models (published Nov 2024) is specifically designed for hybrid code retrieval — handling text-to-code, code-to-text, and code-to-code queries in a unified framework. This directly maps to ToolPilot's needs: user queries are natural language, tool descriptions mix prose and code, and issue bodies contain error messages and stack traces.

For issue semantic search specifically (Section 4.5 of the product doc), the GPTrace paper (ICSE 2026) demonstrates that LLM-based embeddings significantly outperform traditional crash deduplication methods. Their approach of embedding crash reports (analogous to ToolPilot's issue descriptions) and clustering by semantic similarity achieved high purity scores. ToolPilot can apply this same approach to match user-reported symptoms against indexed GitHub issues.

**Practical configuration:**

- **Embedding model**: Nomic Embed Code (open source, strong code + text performance)
- **Vector dimensions**: 768 (balances semantic richness with storage/compute cost)
- **Similarity metric**: Cosine similarity (standard for text/code embeddings)
- **Index type**: HNSW (Hierarchical Navigable Small World) — the standard for approximate nearest neighbor search. Qdrant uses this natively.
- **Top-K at Stage 1**: Retrieve top 50 candidates. This is the broad pool that subsequent stages narrow down.

**Matryoshka Representation Learning (MRL)**: Several 2026 embedding models (Qwen3-Embedding, Snowflake Arctic-Embed, EmbeddingGemma) support flexible output dimensions — you can generate embeddings at 768 dims for storage but truncate to 256 dims for fast approximate matching. This "coarse-to-fine" approach could be used for a two-pass retrieval: fast approximate matching at 256 dims to get top 200, then precise re-ranking at 768 dims to get top 50.

### 2.3 Stage 2 — Hard Filters: Structured Metadata Filtering

After Stage 1 returns the broad semantic pool (~50 candidates), Stage 2 applies hard constraints. These are non-negotiable filters based on the user's clarification answers from the first round of questions:

- License type (MIT, Apache 2.0, GPL, any)
- Language/runtime (Python, Rust, Go, Node.js)
- Deployment model (self-hosted, embedded, cloud)
- Maintenance health threshold (must have commits in last 90 days)
- Minimum community size (configurable)

**Implementation**: These filters operate on structured metadata attached to tool nodes — not on embeddings. This is a straightforward property filter on the graph or a separate metadata index. Qdrant supports payload filtering alongside vector search natively, meaning Stage 1 and Stage 2 can execute as a single filtered vector search query:

```python
# Qdrant filtered vector search (Stage 1 + Stage 2 combined)
results = qdrant_client.search(
    collection_name="tools",
    query_vector=embed(user_query),
    query_filter=Filter(
        must=[
            FieldCondition(key="license", match=MatchAny(any=["MIT", "Apache-2.0"])),
            FieldCondition(key="language", match=MatchValue(value="python")),
            FieldCondition(key="last_commit_days_ago", range=Range(lte=90)),
        ]
    ),
    limit=50
)
```

This collapses two stages into one network call while maintaining the logical separation. The clarification questions between stages still happen — the answers are accumulated and applied as filter parameters.

### 2.4 Stage 3 — Graph Traversal Re-ranking: The Differentiator

This is where ToolPilot's graph architecture pays off. After filtering to ~10-15 candidates, Stage 3 traverses the graph outward from each candidate to score how well it connects to the user's broader context.

**The algorithm:**

For each candidate tool `T` remaining after Stage 2:

1. **Stack compatibility score**: Traverse `INTEGRATES_WITH` and `POPULAR_WITH` edges from `T`. For each edge that connects to a tool already in the user's stated stack, add `edge.effective_weight` to the score. A tool that natively integrates with 3 things the user already uses scores higher than one that integrates with nothing.

2. **Ecosystem density score**: Count the total number of outgoing edges from `T` weighted by recency. A tool with many active connections to the broader ecosystem is better supported than an isolated one.

3. **Health-adjusted score**: Multiply by the tool's maintenance health score (derived from commit velocity, issue response time, contributor count trend). A tool with perfect stack compatibility but no commits in 6 months gets penalized.

4. **Anti-edge penalty**: If `T` has any `CONFLICTS_WITH` edges connecting to tools in the user's stack, apply a penalty or disqualify entirely.

5. **Co-occurrence boost**: If `T` has `POPULAR_WITH` edges connecting to other candidates in the current result set, boost — this indicates the tools are commonly used together and the recommendation is coherent.

**Cypher query pattern (Memgraph):**

```cypher
// For each candidate tool, compute context fit score
MATCH (t:Tool {id: $candidate_id})
OPTIONAL MATCH (t)-[r:INTEGRATES_WITH|POPULAR_WITH]->(stack_tool:Tool)
WHERE stack_tool.id IN $user_stack_ids
WITH t, 
     SUM(r.weight * EXP(-r.decay_rate * duration.inDays(r.last_verified, datetime()))) AS stack_score
OPTIONAL MATCH (t)-[c:CONFLICTS_WITH]->(conflict:Tool)
WHERE conflict.id IN $user_stack_ids
WITH t, stack_score, COUNT(c) AS conflict_count
RETURN t.id, 
       stack_score * t.health_score * (CASE WHEN conflict_count > 0 THEN 0.1 ELSE 1.0 END) AS final_score
ORDER BY final_score DESC
```

This traversal completes in milliseconds on Memgraph for 10-15 candidates — the graph is small enough that even multi-hop traversals are instant.

### 2.5 Stage 4 — Precision Selection: The Two-Option Logic

After Stage 3 produces a ranked list, Stage 4 selects the final 1-2 recommendations:

**Selection rules:**

- If the top candidate's `final_score` is ≥ 20% higher than the second candidate → return only the top candidate. The choice is obvious.
- If the top two candidates are within 20% of each other → check if they differ on the stable/emerging axis:
  - **Stable**: Highest maintenance health + total usage weight + edge count
  - **Emerging**: Highest 90-day stars velocity + recent edge creation rate
  - If one is clearly stable and the other clearly emerging → return both with labels
  - If both are in the same category → return only the top one
- If more than 2 tools need to be returned (multi-tool stack query via `get_stack()`) → return the minimum set that covers all requested components with maximum inter-compatibility (this becomes a minimum spanning subgraph problem on the mesh).

### 2.6 Clarification Question Generation — The Active Learning Layer

The human-in-the-loop clarification questions are not hand-coded per category. They're generated dynamically based on the candidate pool at each stage:

**Algorithm for question generation:**

1. After Stage 1 returns ~50 candidates, analyze which **dimensions** would most effectively partition them. If 30 candidates are vector DBs and 20 are relational DBs, the highest-information question is about data type. If all 50 are vector DBs, that question is useless — instead ask about deployment model or language.

2. Formally, compute the **information gain** of each possible question by measuring how evenly it splits the candidate pool. A question that splits 50 candidates into 25/25 has maximum information gain. A question that splits 50 into 48/2 is nearly useless.

3. Select the 1-3 questions with highest information gain at each stage. This ensures every question meaningfully narrows the field.

4. Over time, track which questions lead to successful outcomes (via `report_outcome` data). Questions that frequently lead to the user accepting the Stage 4 recommendation are promoted; questions that don't correlate with success are demoted or replaced.

This creates a self-improving questioning engine — an asset that no competitor can replicate because it's trained on ToolPilot's unique interaction data.

### 2.7 Search Optimization: BM25 + Vector + Graph (Triple Hybrid)

The 2026 consensus in the retrieval community is that the best systems use three retrieval strategies combined via Reciprocal Rank Fusion (RRF):

1. **Dense vector search** (semantic similarity) — catches meaning-based matches
2. **Sparse keyword search (BM25)** — catches exact term matches that vectors miss (e.g., specific library names, error codes, version numbers)
3. **Graph traversal** — catches relationship-based matches (co-usage, compatibility)

For ToolPilot, the Stage 1 retrieval should combine vector and BM25 before handing off to graph traversal in Stage 3:

```
User query → 
  BM25 search (exact terms: "qdrant", "MIT", "v1.8") → top 30 by term match
  Vector search (semantic: "vector database for similarity search") → top 30 by embedding
  → Reciprocal Rank Fusion → merged top 50
  → Stage 2 filters → ~15 candidates
  → Stage 3 graph traversal → ranked list
  → Stage 4 precision selection → 1-2 results
```

RRF formula: `RRF_score(d) = Σ 1/(k + rank_i(d))` where `k` is typically 60 and `rank_i(d)` is the rank of document `d` in result list `i`.

This triple-hybrid approach means ToolPilot catches tools whether the user describes them semantically ("I need something for similarity search"), by name ("is qdrant good?"), or by relationship ("what works with LangChain?").

---

## 3. Cross-Compatibility: The Version Compatibility Matrix

This is the least-solved problem in the entire architecture and potentially the most valuable feature. No platform reliably answers "does Tool A v2.3 work with Tool B v4.1?"

### 3.1 Data Sources for Compatibility Intelligence

Compatibility data doesn't exist in one place. ToolPilot must synthesize it from multiple signals:

**Source 1: GitHub Issues (Primary)**

GitHub issues are the richest source of real-world compatibility data. When Tool A breaks with Tool B, users file issues. The challenge is extracting structured compatibility signals from unstructured issue text.

**Extraction pipeline:**

1. **Index issues continuously** via GitHub API for all tools in the mesh. Store issue title, body, labels, status (open/closed), referenced PRs, and creation/resolution timestamps.

2. **Embed issues** using a code-aware embedding model (Nomic Embed Code or Jina Code V2). This creates the searchable issue index for the diagnostic query feature.

3. **Extract compatibility signals** using an LLM classification pass on issue bodies. For each issue, classify:
   - Does this issue mention another tool/library by name? → Extract the tool pair and versions
   - Is this a compatibility issue (dependency conflict, API mismatch, version incompatibility)?
   - What's the resolution? (fixed in version X, workaround exists, won't fix, user error)

4. **Create compatibility edges** in the graph: `Tool_A_v2.3 -[COMPATIBLE_WITH {confidence: 0.87}]-> Tool_B_v4.1` or `Tool_A_v2.3 -[CONFLICTS_WITH {confidence: 0.92, evidence: [issue_links]}]-> Tool_B_v4.0`

**Rate limit management**: GitHub API allows 5,000 requests/hour with authentication. For 500 tools with an average of 200 open issues each, initial indexing requires ~100K requests — achievable over a single day with careful scheduling. Ongoing sync only needs to check for new/updated issues, which is much lighter. Prioritize tools by: (a) tools with recent activity first, (b) tools in the top 100 by query frequency, (c) everything else on a weekly rotation.

**Source 2: Package Manager Dependency Trees**

npm, PyPI, crates.io, and Docker Hub all expose dependency information via APIs:

- `npm view <package> dependencies` → direct dependencies with version constraints
- PyPI JSON API → `requires_dist` field with version specifiers
- crates.io API → dependency list with version requirements
- Docker Hub → Dockerfile layers (requires image inspection)

This gives you **declared compatibility** — what the tool's maintainer says it works with. Cross-reference with GitHub issues to find **actual compatibility** — where declared and real-world diverge.

**Pipeline:**

```
For each tool in the mesh:
  1. Fetch declared dependencies from package manager API
  2. Parse version constraints (SemVer ranges, pip specifiers)
  3. Create REQUIRES edges with version constraints
  4. Cross-reference with GitHub issues mentioning the dependency
  5. If issues report problems within the declared version range:
     → Create CONFLICTS_WITH edge with evidence links
     → Lower confidence on the corresponding REQUIRES edge
```

**Source 3: Real-World Co-Occurrence in GitHub Repositories**

Analyze `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, and `docker-compose.yml` files across popular GitHub repositories to discover which tool+version combinations are actually used together in production.

This gives **empirical compatibility** — if 500 repos use Tool A v2.3 with Tool B v4.1 without filing issues, that's strong evidence of compatibility. If 50 repos use the combination and 10 have filed related issues, that's a warning signal.

**Implementation**: Use GitHub's code search API or BigQuery public dataset (GitHub Archive) to query for co-occurring package names across `package.json` / `requirements.txt` files. Aggregate counts and version ranges.

**Source 4: Changelog and Release Notes Parsing**

CHANGELOGs and GitHub Release notes frequently mention breaking changes, deprecations, and version-specific compatibility notes. An LLM extraction pass can parse these into structured data:

```
Input: "v2.0.0 - Breaking: Dropped support for Python 3.8. 
        Minimum required version of numpy is now 1.24."

Output: {
  "version": "2.0.0",
  "breaking_changes": [
    {"type": "dropped_support", "target": "python", "version": "<3.9"},
    {"type": "minimum_version", "target": "numpy", "version": ">=1.24"}
  ]
}
```

These structured breaking changes feed directly into the compatibility matrix as high-confidence edges.

### 3.2 The Compatibility Matrix Data Model

In the graph, version compatibility is modeled as edges between `Version` nodes:

```
(qdrant:Tool)-[:HAS_VERSION]->(qdrant_v1_8:Version {version: "1.8.0"})
(langchain:Tool)-[:HAS_VERSION]->(langchain_v0_2:Version {version: "0.2.0"})

(qdrant_v1_8)-[:COMPATIBLE_WITH {
  confidence: 0.91,
  evidence_type: "co_occurrence",
  evidence_count: 342,
  issue_count: 2,
  last_verified: "2026-03-20"
}]->(langchain_v0_2)
```

The `check_compatibility(tool_a, version_a, tool_b, version_b)` MCP function traverses these edges and returns:

```json
{
  "compatible": true,
  "confidence": 0.91,
  "evidence": {
    "co_occurrence_repos": 342,
    "known_issues": 2,
    "issue_links": ["github.com/..."],
    "declared_support": true,
    "last_verified": "2026-03-20"
  },
  "warnings": [
    "2 open issues report intermittent timeout when using batch operations with these versions"
  ]
}
```

### 3.3 Confidence Scoring for Compatibility

Not all compatibility evidence is equally reliable. ToolPilot uses a weighted confidence model:

| Evidence Type | Weight | Reasoning |
|--------------|--------|-----------|
| Declared dependency in package manager | 0.7 | Maintainer explicitly says it works, but doesn't guarantee edge cases |
| Co-occurrence in 100+ repos with 0 issues | 0.9 | Strong empirical evidence — hundreds of real-world deployments |
| Co-occurrence in 100+ repos with >5% issue rate | 0.5 | Works for most, but significant minority report problems |
| Changelog states explicit support | 0.85 | Official documentation is strong signal |
| Changelog states breaking change | 0.95 (for incompatibility) | Official announcement of incompatibility is near-certain |
| Single GitHub issue reports incompatibility | 0.4 | Could be user error, environment-specific, or edge case |
| Multiple independent issues report same incompatibility | 0.85 (for incompatibility) | Pattern across independent users is strong negative signal |
| `report_outcome` from ToolPilot users confirms compatibility | 0.8 | First-party data, but could be environment-specific |

Final confidence = weighted combination of all available evidence, capped at 0.95 (never claim certainty).

### 3.4 Cross-Tool Issue Propagation

When the issue intelligence layer detects that multiple users hit errors at the same integration point between Tool A and Tool B, it creates a **cross-tool compatibility alert**:

1. Embed the error descriptions from both Tool A's and Tool B's issue trackers
2. Cluster similar errors across both repos
3. If a cluster contains issues from both repos describing the same integration failure → create a `CONFLICTS_WITH` edge with the cluster as evidence
4. Optionally notify maintainers of both tools with a structured summary

This is data that currently gets lost in the gap between repositories. Maintainer A sees issues in their repo but doesn't know about related issues in Maintainer B's repo. ToolPilot's graph is the only place where this cross-repo pattern becomes visible.

### 3.5 Keeping Compatibility Data Fresh

Compatibility is not static. A new release of Tool A might fix an incompatibility with Tool B, or introduce a new one. ToolPilot's freshness system:

1. **Trigger on new releases**: When a tool publishes a new GitHub release, immediately re-parse its changelog and check for compatibility-related changes. Queue re-verification of all compatibility edges involving that tool.

2. **Trigger on new issues**: When a new issue is filed that mentions another tool by name, process it immediately for compatibility signals.

3. **Periodic re-verification**: Every 7 days, re-check the top 100 most-queried compatibility edges against current GitHub issue state. Has the issue been closed? Has a fix been merged?

4. **User-driven verification**: Every `report_outcome` that includes compatibility information (e.g., "used Tool A v2.3 with Tool B v4.1, worked fine" or "had to downgrade Tool B to v3.9") reinforces or weakens the relevant edges.

---

## 4. Putting It All Together: The Complete Query Flow

Here's how all three pillars work together in a single `search_tools()` call:

```
Agent calls: search_tools("I need a database for my AI project")

→ STAGE 1: SEMANTIC RETRIEVAL
  ├─ BM25 search on tool descriptions → top 30 by keyword match
  ├─ Vector search (Nomic Embed Code via Qdrant) → top 30 by semantic similarity
  └─ RRF fusion → merged top 50 candidates
  
→ CLARIFICATION ROUND 1 (human-in-the-loop)
  ├─ Analyze candidate pool: 25 vector DBs, 15 relational DBs, 10 document stores
  ├─ Highest information gain question: "What type of data?"
  └─ User answers: "Embeddings / vectors"
  
→ STAGE 2: HARD FILTERS (applied to Stage 1 results)
  ├─ Filter by data type → 25 vector DB candidates remain
  ├─ Apply any known constraints from context → ~15 remain
  └─ Metadata filters execute on Qdrant payload filtering
  
→ CLARIFICATION ROUND 2 (human-in-the-loop)
  ├─ Analyze remaining 15: 8 self-hosted, 4 embedded, 3 cloud-only
  ├─ Highest information gain questions: deployment, language, license
  └─ User answers: "Self-hosted, Python, MIT"
  
→ STAGE 2 CONTINUED: Apply new filters → ~5 candidates remain
  
→ STAGE 3: GRAPH TRAVERSAL RE-RANKING (Memgraph)
  ├─ For each candidate, traverse INTEGRATES_WITH edges to user's stack
  ├─ Compute effective_weight with temporal decay
  ├─ Apply health scores, anti-edge penalties, co-occurrence boosts
  ├─ Check version compatibility edges for user's stack versions
  └─ Produce ranked list with explainable scores
  
→ CLARIFICATION ROUND 3 (final, only if needed)
  ├─ Top 2-3 candidates are close. Key differentiator: scale requirement
  └─ User answers: "Medium scale, complex filtering"
  
→ STAGE 4: PRECISION SELECTION
  ├─ Top candidate (Qdrant): score 0.96, stable, strong filtering support
  ├─ Runner-up (LanceDB): score 0.82, emerging, embedded mode advantage  
  ├─ Gap > 20%? No (14% gap) → check stable/emerging split → yes → return both
  └─ Attach docs, trust_hierarchy, prompt_hints, compatibility data
  
→ RESPONSE returned to agent with full structured JSON

→ ASYNC (non-blocking):
  ├─ Queue mesh update job (reinforces queried edges)
  ├─ Log search session for clarification question effectiveness tracking
  └─ Wait for report_outcome callback
```

Total latency budget: < 200ms for the search stages (excluding human clarification wait time). Stage 1 (vector + BM25): ~50ms. Stage 2 (metadata filter): ~10ms. Stage 3 (graph traversal): ~30ms. Stage 4 (selection logic): ~5ms. Network overhead + serialization: ~50ms. Well within agent runtime expectations.

---

## 5. Key Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Graph database | Memgraph | In-memory C++, sub-ms reads, Cypher/Bolt compatible, TGN support, open source |
| Vector store | Qdrant (separate) | Rust-native, MIT, filtered vector search, HNSW index, production-proven |
| Embedding model | Nomic Embed Code | Code-aware, open source, strong on technical/code terminology |
| Sparse search | BM25 (via Qdrant or separate) | Catches exact term matches vectors miss |
| Fusion strategy | Reciprocal Rank Fusion (RRF) | Industry standard for combining multiple retrieval signals |
| Temporal decay | Exponential decay at query time | No write contention, weights computed on-the-fly |
| Compatibility signals | GitHub Issues + package managers + changelog + co-occurrence | Multi-source triangulation for robust confidence scoring |
| Issue embedding | Code-aware model (same as search) | Must recognize "returns null" ≈ "empty results" |
| Staging layer | PostgreSQL or separate Memgraph label | Simple, queryable, doesn't pollute main graph |
| Background queue | Kafka or Redis Streams | Decouples search reads from update writes |

---

## 6. What Can Go Wrong (And How to Detect It)

| Failure Mode | Detection | Response |
|-------------|-----------|----------|
| Stage 1 returns no relevant candidates | Empty result set after filtering | Fall back to broader query, ask user to rephrase |
| Embedding model misses technical terms | Low `report_outcome` acceptance rate for specific categories | Fine-tune embeddings on ToolPilot's own query-result pairs |
| Graph traversal over-penalizes new tools | New tools always lose to established ones regardless of fit | Cap health score penalty; ensure momentum score can override |
| Stale compatibility data causes wrong recommendation | User reports via `report_outcome` that recommended combo failed | Immediately flag the compatibility edge for re-verification |
| GitHub API rate limits block issue syncing | HTTP 429 responses, sync lag exceeds 48 hours | Implement backoff, prioritize high-traffic tools, cache aggressively |
| AI-generated edges pass staging with bad data | Recommendations degrade in specific categories | Monitor per-category acceptance rates; auto-quarantine categories with dropping rates |

---

*Research Document v1.0 — March 2026*
