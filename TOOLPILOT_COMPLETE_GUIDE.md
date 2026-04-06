# ToolPilot — Complete System Guide

> **Purpose**: End-to-end technical reference covering architecture, data flow, all 15 MCP tools, and real developer workflows. Use this in future sessions to resume context quickly.

---

## What Is ToolPilot?

ToolPilot is an **agent-first, graph-powered tool intelligence platform**. It gives AI agents (Claude, Cursor, Windsurf, etc.) live, real-time tool recommendations instead of relying on stale training data. It sits between the developer's agent and the open-source ecosystem.

**Primary surface**: MCP server (15 tools, stdio transport)  
**Secondary surfaces**: Admin portal (`localhost:3001`), Public website (`localhost:3005`)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Graph DB | Memgraph (Bolt via neo4j-driver) |
| Vector Store | Qdrant (768-dim, Nomic `nomic-embed-text-v1.5`) |
| Staging DB | PostgreSQL 16 (Prisma) |
| Queue | Redis 7 Streams (ioredis) |
| MCP Server | @modelcontextprotocol/sdk, TypeScript |
| Indexer | TypeScript, Node.js 22, GitHub REST API via @octokit/rest |
| Web | Next.js 15 App Router, Tailwind v4, Radix UI |
| Monorepo | pnpm workspaces + Turborepo |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — Agent Interface (MCP Server, stdio)                  │
│  15 tools: search_tools, get_stack, compare_tools, ...         │
└────────────────────────┬────────────────────────────────────────┘
                         │ queries / writes
┌────────────────────────▼────────────────────────────────────────┐
│  LAYER 2 — Graph Mesh + Vector Store                            │
│  Memgraph:  Tool + UseCase + Pattern + Stack nodes              │
│             REQUIRES + SOLVES + INTEGRATES_WITH + FOLLOWS edges │
│  Qdrant:    tool embeddings (768-dim) + issue intelligence      │
│  Postgres:  IndexedTool, AppSettings, SearchSession, McpEvent   │
│  Redis:     3 Streams — toolpilot:index / search / scheduler    │
└────────────────────────┬────────────────────────────────────────┘
                         │ index jobs
┌────────────────────────▼────────────────────────────────────────┐
│  LAYER 3 — Indexer (background worker, always running)          │
│  GitHub crawler → processTool → Memgraph + Qdrant + Postgres    │
│  Discovery scheduler: GitHub Search → new tools → index queue   │
│  Reindex scheduler: stale tools → refresh health signals        │
│  Cron loop: hourly check of AppSettings → fire triggers         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Graph Mesh — Node & Edge Types

### Node Types

| Label | Represents | Example |
|-------|-----------|---------|
| `Tool` | A library, framework, or CLI | `socket.io`, `prisma`, `vitest` |
| `UseCase` | A capability developers need | `realtime`, `authentication`, `orm` |
| `Pattern` | An architectural approach | `event-driven`, `microservices`, `ssr` |
| `Stack` | A named grouping of tools | `mern-stack`, `jamstack`, `tanstack` |

**Derived from GitHub topics**: `socket.io` has topics `["socket-io","websocket"]` → creates `UseCase:socket-io` and `UseCase:websocket` nodes.

Topic → node type inference:
- Contains `-stack` → **Stack**
- In `KNOWN_PATTERNS` set (`event-driven`, `graphql`, `ssr`, etc.) → **Pattern**
- Everything else → **UseCase** (default)

### Edge Types

| Type | Direction | Created From | Weight Range |
|------|-----------|-------------|--------------|
| `SOLVES` | Tool → UseCase | GitHub topics | 0.8 |
| `FOLLOWS` | Tool → Pattern | GitHub topics | 0.75 |
| `BELONGS_TO` | Tool → Stack | GitHub topics | 0.9 |
| `REQUIRES` | Tool → Tool | package.json deps | 0.85 |
| `INTEGRATES_WITH` | Tool → Tool | README mentions | 0.5 |
| `REPLACES` | Tool → Tool | suggest_graph_update | 0.7–0.9 |
| `COMPATIBLE_WITH` | Tool → Tool | suggest_graph_update | 0.7–0.9 |
| `POPULAR_WITH` | Tool → Tool | report_outcome feedback | auto-adjusted |

All edges carry: `weight`, `confidence`, `last_verified`, `source`, `decay_rate`

**Temporal decay**: `effective_weight = weight × exp(-decay_rate × days_since_verified)`

---

## Data Pipeline — From GitHub to Graph

### How a Tool Gets Indexed

```
1. TRIGGER (any of):
   ├── Auto-discovery cron (every 24h): GitHub Search → new repos → enqueue
   ├── compare_tools / verify_suggestion: missing tool → enqueue at priority 2
   └── Admin manual trigger: admin UI → enqueue batch

2. QUEUE: enqueueIndexJob(github_url, priority) → Redis Stream toolpilot:index

3. WORKER picks up job:

   handleIndexJob(github_url, priority)
     │
     ├── parseToolId() → normalize URL → "owner/repo"
     │
     ├── crawlGitHubRepo(owner, repo)
     │   ├── GET /repos/{owner}/{repo}          → metadata, stars, license
     │   ├── GET /repos/{owner}/{repo}/languages → language distribution
     │   ├── GET /repos/{owner}/{repo}/topics    → ["websocket","realtime","nodejs"]
     │   ├── GET /repos/{owner}/{repo}/contents  → root files (detect package manager)
     │   └── GET .../package.json                → declared dependencies
     │   [All via githubRequest() with shared rate limit + ETag caching]
     │
     ├── processTool(crawlerResult)
     │   ├── calculateHealth() → maintenance_score, commit_velocity, stars_velocity
     │   ├── filterNoise(topics) → remove ["javascript","typescript","library","npm"...]
     │   ├── buildTopicEdges() → [{UseCase:"websocket"}, {UseCase:"realtime"}, ...]
     │   ├── category = meaningfulTopics[0] ?? "other"
     │   ├── github_url = normalizeGitHubUrl(url)   ← canonical form
     │   ├── id = deterministicId(github_url)        ← SHA-256 → UUID (dedup key)
     │   ├── extractRelationships() → REQUIRES from deps, INTEGRATES_WITH from README
     │   └── generateEmbedding() → embedBatch([name + desc + topics], 'search_document')
     │
     ├── Write to all stores:
     │   ├── Memgraph: MERGE (t:Tool {id}) SET t.* = ...
     │   ├── Qdrant:   upsert {id, vector[768], payload: ToolNode}
     │   └── Postgres: upsert IndexedTool {github_url, id, "indexed"}
     │
     ├── Write REQUIRES/INTEGRATES_WITH edges to Memgraph
     │
     └── writeTopicNodes(toolId, topicEdges)
         ├── MERGE (:UseCase|Pattern|Stack {name})
         └── MERGE (t:Tool)-[:SOLVES|FOLLOWS|BELONGS_TO]->(n)
```

### Rate Limit Protection

```
crawlers/rate-limit.ts — single shared state between all crawlers

Core API (5000 req/hr):
  remaining > 500  → full speed (no delay)
  remaining 100–500 → +1s between calls
  remaining < 100  → +3s between calls, warns
  remaining = 0    → sleep until reset window + 5s buffer

Search API (30 req/min):
  remaining < 3    → sleep until reset + 2s

Cron budget gate: won't trigger discovery if maxIndexableTools < batchSize
  maxIndexableTools = floor((remaining - 100) / 5)
```

### Auto-Discovery Cron

```
Every hour:
  Read AppSettings from Postgres
    └── discovery_scheduler_enabled=true
        AND hoursSinceLast >= discovery_interval_hours (default: 24)
        AND rate budget OK (remaining ≥ batchSize × 5 calls)
        → enqueueDiscoveryTrigger() → Redis scheduler stream

    └── reindex_scheduler_enabled=true
        AND daysSinceLast >= 7
        AND rate budget OK (remaining ≥ 50 × 5 calls)
        → enqueueReindexTrigger()

Admin can toggle both on/off from Settings page with no restart needed.
Interval, batch size, min stars, topic list all configurable in Settings.
```

---

## The 4-Stage Search Pipeline

Every `search_tools` call runs through 4 stages:

```
Query: "WebSocket library for Node.js TypeScript"

Stage 1 — Hybrid Retrieval
  ├── Load corpus: 558 tool payloads from Qdrant
  ├── Build BM25 index (name:3.0 weight, description:1.0, topics:0.8)
  │   Note: name tokenized as full compound ("node-bunyan" not "node"+"bunyan")
  ├── Embed query: embedText(query, 'search_query') → 768-dim vector
  ├── Vector search in Qdrant: top 100 by cosine similarity
  ├── BM25 search over corpus
  └── RRF fusion → top 50 candidate IDs (ranked by semantic relevance)

Stage 2 — Filter + Rank
  ├── Fetch ALL 50 candidates from Qdrant (single request, not limit:15)
  ├── Apply clarification answers as in-memory filters
  │   (language, license, topics, deployment_model)
  ├── Sort by Stage 1 semantic rank (candidateIds.indexOf)
  ├── Return top 15 — semantic order preserved
  └── Graceful relaxation: drop language+license → drop topics → no filter

Stage 3 — Graph Rerank
  ├── Query Memgraph with candidate names
  ├── Sum effective edge weights (REQUIRES/INTEGRATES_WITH between candidates)
  ├── Add UseCase overlap bonus (shared SOLVES targets × 0.3)
  └── Combined: 0.6 × graphScore + 0.4 × stage2Score

Stage 4 — Precision Selection
  ├── If top-2 gap < 20% AND stable+emerging split → return both (two-option)
  └── Otherwise return top 1
```

### 3-Round Clarification

```
Round 1 (topics): "What type of tool?" — options from candidate topics
Round 2 (constraints): "Language?" "License?" "Deployment?"
Round 3 (decisive): "Between these final candidates?"

Session state stored in Postgres SearchSession.
search_tools → clarification_needed → agent calls search_tools_respond × up to 3
```

---

## All 15 MCP Tools

### Setup Tools

#### `toolpilot_init`
**When**: First time connecting to a new project  
**Does**: Writes agent instruction file (CLAUDE.md / .cursorrules), MCP config, `.toolpilot/tracker.html`

#### `init_project_config`
**When**: After toolpilot_init, once per project  
**Does**: Creates `.toolpilot/config.json` with detected tools (OSS + non-OSS separated)

#### `read_project_config`
**When**: Every session start (if config.json exists)  
**Does**: Parses config, surfaces `stale_tools` (>90 days), `pending_evaluation` list, agent instructions (skip already-confirmed tools)

#### `update_project_config`
**When**: After tool chosen/removed/evaluated  
**Actions**: `add_tool`, `remove_tool`, `update_tool`, `add_evaluation`  
**Does**: Returns updated config JSON + audit entry. Agent writes it back to file.

---

### Discovery Tools

#### `classify_prompt`
**When**: Before any tool search — checks if ToolPilot is even needed  
**Returns**: `{ tool_required: true/false, classification: "tool_discovery"|"stack_building"|... }`

#### `refine_requirement`
**When**: After classify_prompt says tool_required  
**Does**: Decomposes multi-need prompt into structured requirements. Fetches live UseCase names from graph for the LLM decomposition prompt.  
**Returns**: `decomposition_prompt`, `available_use_cases`, `inferred_requirements`, `agent_instructions`

#### `search_tools`
**When**: Searching for a specific tool  
**Flow**: 4-stage pipeline (see above). Returns results OR clarification questions.  
**Note**: Includes `non_indexed_guidance` when empty/low-confidence → agent should call `verify_suggestion`

#### `search_tools_respond`
**When**: Answering clarification questions from search_tools  
**Does**: Applies answers as filters, may ask another round (up to 3), then runs Stage 2–4

#### `get_stack`
**When**: Need a full stack recommendation  
**Does**: Detects multiple needs (auth, database, queue, etc.) via keyword matching, traverses UseCase nodes in parallel, merges cross-branch results  
**Example**: "SaaS with auth, DB, jobs" → 3 branches → supabase + bullmq + casbin composed

#### `verify_suggestion`
**When**: `search_tools` returned empty/low-confidence AND agent has suggestions  
**Does**:
1. Check each suggestion in Memgraph — if found, diagnose why search missed it
2. If not found — resolve bare name to GitHub URL via GitHub Search API
3. Enqueue at P0 priority (priority=2, urgent)
4. Compare agent suggestions vs ToolPilot's own semantic recs
5. Return verdict: agreement/disagreement with reasoning  
**Call again in ~2 min** after P0 indexing completes

---

### Evaluation Tools

#### `compare_tools`
**When**: Choosing between two specific tools  
**Does**: Head-to-head on health signals + graph edge analysis (COMPATIBLE_WITH, REPLACES, CONFLICTS_WITH)  
**Handles**: missing tools → auto-indexes at priority 2, returns partial data  
**Returns**: `dimensions[]`, `recommendation`, `confidence`, `decision_guide`

#### `check_compatibility`
**When**: "Does tool A work with tool B?"  
**Does**: Graph edge lookup (`getDirectEdges`), returns compatibility signal

#### `check_issue`
**When**: Agent has retried 2+ times AND consulted docs AND still failing  
**Flow** (see full flow below in Refined check_issue section)  
**Does**: Queries GitHub API directly for issues matching the error. Returns issue status, PR links, reaction option.

---

### Feedback & Graph Tools

#### `report_outcome`
**When**: After using a tool for a while (success, failure, or replacement)  
**Does**: Records in Postgres, adjusts edge weights in Memgraph (`POPULAR_WITH` edges boosted on success, `REPLACES` staged on replacement)

#### `suggest_graph_update`
**When**: Discovering a new tool or relationship  
**Types**: `new_tool`, `new_edge`, `new_use_case`, `update_health`  
**Auto-graduation**: Edges with confidence ≥ 0.8 between indexed tools graduate immediately. Others staged for admin review.

---

## check_issue — Refined Flow

> **Key principle**: Don't spam GitHub API. check_issue is the LAST resort, not first resort.

### When to Call (Agent Decision Tree)

```
Error occurs
  └── Agent attempts fix (retry 1)
  └── Agent attempts fix (retry 2)
  └── Still failing? → STEP 1: Use documentation

STEP 1 — Consult Documentation
  Use prompt_hint from search_tools result (docs URL, README, changelog)
  └── Agent reads docs, applies fix (retry 3)
  └── Agent reads docs, applies fix (retry 4)
  └── Still failing after docs? → STEP 2: Check GitHub issues

STEP 2 — Call check_issue (ONLY NOW)
  check_issue({
    tool_name: "ioredis",
    issue_title: "MaxRetriesPerRequestError serverless Lambda",
    retry_count: 4,       ← total retries attempted
    docs_consulted: true  ← confirms docs were checked
  })
```

### check_issue Internal Flow

```
check_issue({tool_name, issue_title, retry_count, docs_consulted})
  │
  ├── Gate check: retry_count < 4 OR docs_consulted=false
  │   → Return: { status: "too_early", guidance: "try docs first" }
  │
  ├── Verify tool in Memgraph → get github_url
  │
  ├── Search GitHub Issues API directly:
  │   GET /search/issues?q={issue_title}+repo:{owner}/{repo}+type:issue
  │   (no Qdrant, no local DB — live GitHub data)
  │
  ├── Also search for PRs:
  │   GET /search/issues?q={issue_title}+repo:{owner}/{repo}+type:pr
  │
  ├── CASE 1: No issues/PRs found
  │   → status: "not_found"
  │   → message: "No matching issue found on GitHub"
  │   → agent_instructions: "Research docs deeply, consider alternative approaches"
  │   → Return (do NOT suggest creating issue — may be config error)
  │
  ├── CASE 2: Open issue found, PR exists for it
  │   → status: "fix_in_progress"
  │   → Return: issue details + PR link + ETA if available
  │   → Add 👍 reaction to issue via POST /repos/{owner}/{repo}/issues/{n}/reactions
  │   → agent_instructions: "Fix is in progress, track PR #{n}"
  │
  ├── CASE 3: Open issue found, NO PR
  │   → status: "known_issue_no_fix"
  │   → Return: issue gist (title + key comments summary)
  │   → Add 👍 reaction to issue
  │   → Ask user: "This is a known open issue. Do you want to:
  │       (a) Create a new issue report (if your case differs)
  │       (b) Handle it yourself later
  │       (c) Ignore for now"
  │   → If user wants new issue → agent generates issue template
  │       (user copies manually — we don't auto-create)
  │
  └── CASE 4: Issue found but CLOSED (was fixed)
      → status: "fixed_in_version"
      → Return: which version fixed it, linked PR/commit
      → agent_instructions: "Update {tool} to version X to get the fix"
```

### Schema Changes

```typescript
checkIssueSchema = {
  tool_name: z.string(),
  issue_title: z.string(),
  retry_count: z.number().int().min(0).default(0),
  docs_consulted: z.boolean().default(false),
  issue_url: z.string().url().optional(),
}
```

---

## Project Config File Format

`.toolpilot/config.json`:

```json
{
  "version": "1.0",
  "project": {
    "name": "my-saas",
    "language": "TypeScript",
    "framework": "Next.js"
  },
  "tools": {
    "confirmed": [
      {
        "name": "ws",
        "source": "toolpilot",
        "version": "^8.0.0",
        "chosen_at": "2026-04-01T10:00:00Z",
        "last_verified": "2026-04-01T10:00:00Z",
        "chosen_reason": "Best WebSocket library for Node.js",
        "alternatives_considered": ["socket.io"],
        "query_id": "abc-123"
      },
      {
        "name": "Stripe",
        "source": "non_oss",
        "notes": "Paid API — not in ToolPilot index"
      }
    ],
    "pending_evaluation": [
      { "name": "prisma", "category": "orm", "added_at": "2026-04-01T..." }
    ]
  },
  "audit_log": [
    { "action": "init", "tool": "project", "timestamp": "...", "reason": "Initial setup" },
    { "action": "add_tool", "tool": "ws", "timestamp": "...", "reason": "Chosen via search_tools" }
  ]
}
```

**Staleness**: `last_verified` older than 90 days → flagged by `read_project_config`

---

## State — Where Everything Lives

| Data | Store | Key |
|------|-------|-----|
| Tool nodes + relationships | Memgraph | `(t:Tool)`, `(u:UseCase)`, `(:SOLVES)` |
| Tool embeddings + payloads | Qdrant `tools` | point_id = `deterministicId(github_url)` |
| Issue intelligence | Qdrant `issues` | filter: `tool_name` |
| Index job tracking | Postgres `IndexedTool` | `github_url` (normalized, unique) |
| Scheduler settings | Postgres `AppSettings` | id = `"global"` |
| Search sessions | Postgres `SearchSession` | `query_id` (UUID) |
| MCP events/analytics | Postgres `McpEvent` | per-call logging |
| Pending review | Postgres `StagedNode`/`StagedEdge` | admin approval queue |
| Job queue | Redis `toolpilot:index` | Stream, consumer group `toolpilot-consumers` |
| Scheduler triggers | Redis `toolpilot:scheduler` | run-discovery, run-reindex |
| Search events | Redis `toolpilot:search` | analytics |
| Project config | `.toolpilot/config.json` | per-project file |

---

## Deduplication — The Key Invariant

Every tool has exactly **one** canonical ID:

```
normalizeGitHubUrl("biomejs/biome")              → "https://github.com/biomejs/biome"
normalizeGitHubUrl("HTTP://GITHUB.COM/Biomejs/Biome/") → "https://github.com/biomejs/biome"

id = SHA-256("https://github.com/biomejs/biome") → UUID format
   → same URL = same id = Qdrant upsert (not insert) = no duplicates
```

Breaking this invariant causes duplicate Qdrant points (stale payloads, wrong topics).

---

## Known Limitations

| Limitation | Impact | Notes |
|-----------|--------|-------|
| ~80 repos have zero GitHub topics | Stay as `category: "other"` permanently | Unfixable — maintainers haven't tagged repos |
| Issue intelligence DB is sparse | `check_issue` often returns "not found" | Mitigated by direct GitHub API fallback |
| NOMIC_API_KEY must be in `.mcp.json` env | Embedding fails silently in MCP process | Claude Code doesn't inherit `.env` — add to `.mcp.json` |
| GitHub API 503s on `/languages` endpoint | P0 indexing fails temporarily | Transient, auto-retried on next reindex pass |
| Qdrant HNSW index | Created but may rebuild for new points | Status turns "yellow" during rebuild, search still works |

---

## Admin Portal Pages

| URL | Purpose |
|-----|---------|
| `/admin/graph` | 3D mesh visualization — nodes colored by category, edges by type |
| `/admin/weights` | Edge weight distribution, temporal decay visualization |
| `/admin/indexer` | Queue depth, recent jobs, failed tools, manual triggers |
| `/admin/settings` | Discovery/reindex toggles, topics, batch size, stars threshold, interval |
| `/admin/review` | Staged nodes/edges awaiting human approval |
| `/admin/metrics` | MCP tool call stats, session analytics |

---

## Quick Reference — When to Use Which Tool

| Situation | Tool |
|-----------|------|
| First time connecting to project | `toolpilot_init` → `init_project_config` |
| Starting a session | `read_project_config` |
| "I need a tool for X" | `classify_prompt` → `refine_requirement` → `search_tools` |
| Clarification questions returned | `search_tools_respond` |
| Need a full stack | `get_stack` |
| search_tools returned nothing | `verify_suggestion` (with agent's suggestions) |
| Choosing between 2 tools | `compare_tools` |
| "Does A work with B?" | `check_compatibility` |
| Error after 4+ retries + docs checked | `check_issue` |
| Tool worked great / was replaced | `report_outcome` |
| Found a new tool/relationship | `suggest_graph_update` |
| Tool added to project | `update_project_config` |

---

*Last updated: 2026-04-01 | Session: Graph Mesh + Search Pipeline Overhaul + verify_suggestion + check_issue refinement*
