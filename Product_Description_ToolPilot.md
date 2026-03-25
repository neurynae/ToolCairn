# ToolPilot — The Intelligence Layer Between AI Agents and the Software Ecosystem

> *"Not a directory. Not a marketplace. The infrastructure layer that agents query at runtime to find, use, debug, and improve the tools they need."*

---

## 1. Executive Summary

ToolPilot is an agent-first, graph-powered tool intelligence platform that fundamentally reimagines how developers and AI agents discover, evaluate, use, and debug open source software tools. Unlike traditional directories (Product Hunt, TAAFT) or enterprise review platforms (G2, Capterra), ToolPilot doesn't answer "what tools exist in category X?" — it answers "given my specific stack, constraints, and use case, what should I actually use, and how?"

The platform operates as two faces of a single system: an **MCP (Model Context Protocol) server** that any AI agent can query programmatically at runtime, and a **web interface** for human-driven discovery. The core is a continuously evolving **graph-based knowledge mesh** of tools, use cases, compatibility relationships, and health signals — built by auto-indexing open source projects from GitHub, and refined over time through agent feedback loops and community contributions.

A key differentiator is ToolPilot's **human-in-the-loop guided discovery** — rather than dumping a list of tools on the user, the system progressively narrows down the perfect match through a series of intelligent clarification questions, ensuring the final recommendation hits the nail on the head.

ToolPilot covers the complete developer-agent workflow in one coherent system:

**Find** the right tool → **Use** it correctly → **Debug** when something breaks → **Contribute** fixes back → **Learn** from outcomes to improve future recommendations.

No other platform covers more than one of these steps. ToolPilot covers all five, and each step generates data that makes every subsequent interaction better.

---

## 2. The Problem

### 2.1 The Tool Explosion

The agentic AI era has created an unprecedented explosion of software tools. Developers face a paradox of choice — thousands of tools across categories, with new ones launching daily. Traditional discovery methods are broken:

- **Search engines** return SEO-optimized marketing pages, not contextual recommendations.
- **AI chatbots** (ChatGPT, Perplexity) have stale training data, don't know about tools launched last month, and can't assess current maintenance health or version compatibility.
- **Directories** (TAAFT, Product Hunt) show flat lists without understanding the user's specific situation.
- **Enterprise review platforms** (G2, Capterra) are pay-to-play, structurally hostile to open source, and lack agent-queryable interfaces.
- **GitHub Trending** shows what's new, not what's right for a specific use case.

### 2.2 The Agent Discovery Gap

A critical shift has occurred: **the primary consumer of tool recommendations is no longer a human browsing a website — it's an AI agent making decisions at runtime.** Agents in Claude Code, Cursor, and autonomous workflows need to select tools programmatically, but have no reliable, structured, machine-queryable source to consult. Agent accuracy collapses past 30 tools when descriptions overlap, and becomes essentially random beyond 100 tools.

There is no mature, open-source standard for agent and tool registries. Every major player (Google, Microsoft, IBM, Anthropic) is building separate, fragmented solutions. The result: agents guess, hallucinate, or rely on stale training data when choosing tools.

### 2.3 The Post-Discovery Gap

Even when an agent finds the right tool, the problems continue:

- **Stale knowledge**: The agent's training data references deprecated methods or outdated APIs, causing silent failures.
- **No debugging pathway**: When something breaks, the agent can't distinguish "I'm using this wrong" from "this is a known bug."
- **No feedback loop**: The ecosystem never learns from the agent's experience — what worked, what didn't, and why.

---

## 3. The Solution

### 3.1 Core Concept

ToolPilot is the **npm registry moment for the agentic era**. npm didn't win because it was a pretty website. It won because it became the authoritative, machine-queryable source every tool, every developer, and every build system hits automatically when they need a package. You don't browse npm — you query it.

ToolPilot applies this principle across the open source software ecosystem — MCP servers, libraries, npm packages, Python libraries, Docker images — with an intelligence layer that understands context, not just keywords.

### 3.2 The Two Interfaces

**Interface 1: MCP Server (The Primary Product)**

Any AI agent — Claude Code, Cursor, custom autonomous agents — adds ToolPilot as an MCP server once. From that point, the agent can query at runtime:

```
search_tools("I need a self-hostable vector database, Rust or Go, active maintenance, MIT license")
→ Guided multi-stage discovery with clarification → precise recommendation
```

```
check_issue("qdrant search returns null on filtered queries, version 1.8.0")
→ "Known bug, reported 3 weeks ago, fix in PR #847 under review"
```

```
report_outcome(query_id, chosen_tool, reason, outcome)
→ Feeds back into graph weights, improving future recommendations
```

The agent never opens a browser. It queries ToolPilot directly and gets structured JSON responses with reasoning.

**Interface 2: Web Application (Secondary, Human-Facing)**

A clean, fast, context-driven search for developers who want to browse and compare. The user describes their need in plain English, and ToolPilot walks them through a guided conversation — asking smart clarification questions at each stage — to arrive at the exact right tool. No categories, no dropdown filters, no overwhelming lists.

### 3.3 The Admin Portal

A visualization dashboard for platform operators to monitor the graph mesh in real time: edge weights pulsing based on activity, most traversed paths lighting up, declining tools fading, emerging tools brightening, and a review queue for AI-generated nodes awaiting confidence threshold graduation.

---

## 4. Architecture

### 4.1 The Graph-Based Knowledge Mesh

The core data structure is a **property graph with typed nodes, typed edges, and flexible properties**. This captures the relational nature of software tools — dependencies, competitions, complements, integrations — that flat lists and relational databases fundamentally miss.

**Node Types:**

| Node Type | Description | Example |
|-----------|-------------|---------|
| `Tool` | A software tool, library, or service | Qdrant, LangChain, FastAPI |
| `UseCase` | A specific problem or task | "vector search", "API gateway", "auth" |
| `Stack` | A technology stack context | "Python + Postgres + Docker" |
| `Pattern` | A common implementation approach | "RAG pipeline", "event-driven microservices" |
| `Requirement` | A constraint or preference | "MIT license", "self-hostable", "<100MB" |
| `Version` | A major version of a tool | Qdrant v1.8.0, Qdrant v1.7.0 |

**Edge Types:**

| Edge Type | Meaning | Example |
|-----------|---------|---------|
| `SOLVES` | Tool addresses a use case | Qdrant → SOLVES → "vector search" |
| `REQUIRES` | Tool needs a dependency | LangChain → REQUIRES → Python 3.9+ |
| `INTEGRATES_WITH` | Native integration exists | Qdrant → INTEGRATES_WITH → LangChain |
| `REPLACES` | Drop-in alternative | LanceDB → REPLACES → Qdrant (conditional) |
| `CONFLICTS_WITH` | Incompatible pairing | Tool A → CONFLICTS_WITH → Tool B |
| `POPULAR_WITH` | Co-occurrence in real codebases | FastAPI → POPULAR_WITH → Uvicorn |
| `BREAKS_FROM` | Breaking changes between versions | Qdrant v1.8 → BREAKS_FROM → Qdrant v1.7 |

**Edge Properties (on every edge):**

```json
{
  "weight": 0.87,
  "confidence": 0.92,
  "last_verified": "2026-03-20T14:30:00Z",
  "source": "usage_data | ai_generated | github_signal | manual",
  "decay_rate": 0.05
}
```

**Key Graph Design Principles:**

- **Temporal edges**: Every edge carries a timestamp and a decay function. Relationships not reinforced by actual usage gradually lose weight, preventing stale data from poisoning recommendations silently.
- **Version nodes**: Major versions exist as sub-nodes of tool nodes, capturing breaking changes, API differences, and version-specific compatibility data.
- **Anti-edges / conflict edges**: Negative relationships ("these two tools cannot run in the same process") are modeled explicitly alongside positive ones.
- **Ecosystem composition edges**: Statistical co-occurrence patterns derived from real GitHub repository analysis — not recommendations, but facts about how tools cluster in production codebases.
- **Health signal nodes**: Live maintenance indicators attached to each tool node — commit velocity, open issues trend, last release age, contributor count trend — auto-updated from GitHub.

### 4.2 Data Sourcing and Freshness

**Initial Population (Cold Start Solution):**

The supply side is pre-built without requiring any tool maker's cooperation. ToolPilot indexes directly from public GitHub data:

- Stars velocity (momentum, not just absolute count)
- Last commit date, PR response time, issue resolution rate → maintenance health score
- Contributor count trend → community health
- License type
- Download numbers from npm, PyPI, crates.io, Docker Hub
- MCP server card metadata (if available)
- README, official docs links, changelog links

The first 500 tools exist on the platform before it launches. No chicken-and-egg problem.

**Continuous Updates:**

Every search interaction triggers an asynchronous update cycle. The read and write paths are decoupled to prevent write contention from degrading search latency:

```
Search request → Graph read (fast, consistent)
                  ↓
              Returns result to user immediately
                  ↓ (async, non-blocking)
              Queues update job
                  ↓
              Background worker processes updates
                  → Refreshes health signals
                  → Processes AI-generated node/edge proposals
                  → Incorporates feedback from report_outcome calls
```

**AI-Generated Node/Edge Governance:**

When AI generates new nodes or edges (e.g., discovering a new use case relationship from a user query), they don't write directly to the main graph. They enter a **staging layer** with a confidence score. Nodes/edges graduate to the main graph only when confidence crosses a threshold — either from multiple independent AI sources agreeing, or usage data confirming the relationship is real. This prevents AI hallucinations from corrupting the mesh.

### 4.3 The Search Algorithm — Human-in-the-Loop Guided Discovery

This is ToolPilot's core differentiator. Unlike every other discovery platform that dumps a list of tools on the user, ToolPilot uses a **progressive narrowing approach** — each stage of the search executes silently in the background, and after each stage, the system asks the user/agent targeted clarification questions to refine the next stage. Tools are never shown until the final stage, ensuring the result is precise.

The user starts with a simple plain-English description of what they need. From that point, ToolPilot guides them through a conversation:

---

**Stage 1 — Semantic Retrieval + Use Case Clarification**

The user's initial query is embedded into a vector and matched against the graph to find the top ~50 semantically similar use-case nodes. This creates the broad candidate pool.

The user does NOT see these tools. Instead, ToolPilot analyzes the candidate pool and generates **use-case clarification questions** — asking about the nature and scope of what they're building.

*Example flow:*
```
User: "I need a database for my AI project"

ToolPilot (internally): Finds ~50 tools spanning vector DBs, graph DBs, 
document stores, relational DBs with vector extensions, etc.

ToolPilot (to user): 
  "What type of data will you primarily store and query?"
    → Embeddings / vectors for similarity search
    → Structured relational data  
    → Documents / JSON objects
    → Graph / relationship-heavy data
    → Mixed (multiple of the above)
```

The user's answer feeds directly into Stage 2.

---

**Stage 2 — Hard Filters + Constraint Clarification**

Using the user's Stage 1 response, ToolPilot applies hard filters — license type, language/runtime, deployment model, maintenance health threshold. This reduces candidates from ~50 to ~10-15.

Again, no tools are shown. Instead, ToolPilot generates **constraint clarification questions** based on the dimensions that would most effectively differentiate the remaining candidates.

*Example flow (continuing):*
```
User chose: "Embeddings / vectors for similarity search"

ToolPilot (internally): Filters to ~12 vector database candidates.
Analyzes which constraints would split them most effectively.

ToolPilot (to user):
  "A few things to narrow this down:"
    
  Deployment preference?
    → Self-hosted (run on my own infra)
    → Embedded (runs inside my app process)
    → Either is fine

  Language / runtime?
    → Python
    → Rust
    → Go  
    → Node.js
    → No strong preference

  License requirement?
    → Must be permissive (MIT, Apache 2.0)
    → Any open source license is fine
```

The user's answers feed into Stage 3.

---

**Stage 3 — Graph Traversal Re-ranking + Final Clarification**

For each remaining candidate (~3-5 tools), ToolPilot traverses the graph outward: how many edges connect this tool to the user's stated stack? How strong are those edges (weight × recency)? Tools deeply integrated into the user's ecosystem score higher than isolated tools.

Before revealing results, ToolPilot asks one final round of **decisive clarification questions** — the questions that would make the difference between the top 2-3 remaining candidates.

*Example flow (continuing):*
```
User chose: Self-hosted, Python, Permissive license

ToolPilot (internally): 4 tools remain. Graph traversal shows 2 
are deeply connected to user's likely stack, 2 are more niche.
The key differentiators between the top candidates are scale 
and filtering capability.

ToolPilot (to user):
  "Almost there. Two final questions:"
  
  Expected scale?
    → Small (< 1M vectors)
    → Medium (1M - 100M vectors)
    → Large (100M+ vectors)

  Do you need advanced filtering alongside vector search?
    → Yes, complex filters on metadata
    → Basic filtering is enough
    → Pure similarity search, no filtering
```

---

**Stage 4 — Precision Result + Structured Output**

With all clarification complete, ToolPilot has enough context to deliver a **precise, high-confidence recommendation** — not a list to browse, but 1-2 tools with clear reasoning for why each fits the user's exact situation.

From the final ranked list, up to two options are selected:

- **Stable pick**: Highest combined score on maintenance health + usage weight + edge strength.
- **Emerging pick**: Highest momentum score (stars velocity last 90 days + recent edge creation rate) even if absolute weight is lower.

If scores are within 5% of each other, or one tool clearly dominates after all the clarification, only one result is returned. The two-option format exists only when there's a genuine tradeoff worth surfacing.

*Example flow (final):*
```
User chose: Medium scale, Complex metadata filtering

ToolPilot (result):
  ┌─────────────────────────────────────────────────┐
  │ RECOMMENDED (Stable): Qdrant                     │
  │ Fit score: 0.96                                  │
  │ Why: Native Python client, self-hosted, MIT      │
  │ license, strongest production track record for   │
  │ filtered vector search at medium scale.          │
  │ Maintenance: Active (daily commits, <24h PR      │
  │ response time)                                   │
  ├─────────────────────────────────────────────────┤
  │ WORTH EVALUATING (Emerging): LanceDB             │
  │ Fit score: 0.82                                  │
  │ Why: Fastest momentum in last 90 days, embedded  │
  │ mode reduces infra overhead, columnar storage     │
  │ excels at metadata filtering. Newer, smaller      │
  │ community but rapidly growing.                   │
  └─────────────────────────────────────────────────┘
```

**Structured JSON Output (for agents):**

```json
{
  "query_id": "uuid-abc123",
  "interpretation": "self-hostable vector database, Python, permissive license, medium scale, complex metadata filtering",
  "clarification_history": [
    {"stage": 1, "question": "data_type", "answer": "embeddings_vectors"},
    {"stage": 2, "question": "deployment", "answer": "self_hosted"},
    {"stage": 2, "question": "language", "answer": "python"},
    {"stage": 2, "question": "license", "answer": "permissive"},
    {"stage": 3, "question": "scale", "answer": "medium"},
    {"stage": 3, "question": "filtering", "answer": "complex"}
  ],
  "results": [
    {
      "type": "stable",
      "tool": "qdrant",
      "version": "1.8.0",
      "reason": "Most production edge-weight for filtered vector search + Python native + MIT + medium scale proven",
      "fit_score": 0.96,
      "health": "active",
      "docs": {
        "official": "https://qdrant.tech/documentation/",
        "readme": "https://github.com/qdrant/qdrant/blob/master/README.md",
        "changelog": "https://github.com/qdrant/qdrant/blob/master/CHANGELOG.md",
        "api_reference": "https://api.qdrant.tech/"
      },
      "trust_hierarchy": ["official_docs", "changelog", "readme", "training_data"],
      "prompt_hint": "Prioritise official docs and changelog over training data. Check changelog for breaking changes since the version in use."
    },
    {
      "type": "emerging",
      "tool": "lancedb",
      "version": "0.6.0",
      "reason": "Fastest momentum in last 90 days, embedded mode reduces infra, columnar storage strong for metadata filtering",
      "fit_score": 0.82,
      "health": "active",
      "docs": { "..." : "..." },
      "trust_hierarchy": ["official_docs", "changelog", "readme", "training_data"],
      "prompt_hint": "..."
    }
  ],
  "presentation_hint": "Present stable option first as the safe default, emerging option as worth evaluating for cutting-edge performance."
}
```

---

**How This Works for Agents vs Humans:**

For **agents (MCP calls)**: The agent can either pass rich context upfront (stack, constraints, scale) to skip clarification stages and go straight to the result, or engage in the multi-turn guided flow by answering the clarification questions programmatically. The `clarification_history` in the response allows the agent to understand exactly why a tool was recommended and relay the reasoning to the user.

For **humans (web interface)**: The experience feels like talking to an expert consultant. The user types a plain English description, gets asked 2-3 rounds of smart questions, and receives a precise recommendation with clear reasoning. No browsing, no comparing, no decision fatigue.

**Why This Approach Wins:**

The guided approach ensures ToolPilot never shows the wrong tools. By the time Stage 4 presents a result, the system has accumulated enough context to achieve near-perfect precision. This is fundamentally different from every other platform that shows you 50 results and expects you to filter yourself. ToolPilot does the filtering for you, with you.

### 4.4 Documentation Layer (Lean Architecture)

Rather than building and maintaining a complex documentation indexing pipeline, ToolPilot takes a deliberately lean approach: store links to official documentation, READMEs, changelogs, and API references — then provide guidance to the consuming agent on how to prioritize these sources.

Each tool node carries:

```json
{
  "tool": "qdrant",
  "version": "1.8.0",
  "docs": {
    "official": "https://qdrant.tech/documentation/",
    "readme": "https://github.com/qdrant/qdrant/blob/master/README.md",
    "changelog": "https://github.com/qdrant/qdrant/blob/master/CHANGELOG.md",
    "api_reference": "https://api.qdrant.tech/"
  },
  "prompt_hint": "Prioritise official docs and changelog over training data. Check changelog for breaking changes since the version in use.",
  "trust_hierarchy": ["official_docs", "changelog", "readme", "training_data"]
}
```

The agent fetches what it needs, when it needs it, at the right version. Current agents with web access read live documentation better than any static index could maintain. ToolPilot doesn't serve documentation — it serves **guidance on how to consume documentation**. This is a fundamentally lighter responsibility with the same outcome, and eliminates the need for crawlers, freshness SLAs, and version-sync lag.

### 4.5 Issue Intelligence Layer

When an agent or developer hits a problem with a recommended tool, ToolPilot provides a diagnostic pathway that no other platform offers:

**Step 1 — Symptom Embedding:**
The agent describes the error. ToolPilot embeds it semantically and searches against the tool's GitHub Issues index.

**Step 2 — Triage Decision:**

| Similarity Score | Response |
|-----------------|----------|
| > 0.85 | "Confirmed known issue. Status: open / in PR / fixed in version X" |
| 0.60 – 0.85 | "Possibly related to these known issues. Confirm if relevant." |
| < 0.60 | "Not found in known issues. This may be unreported." |

**Step 3 — Auto-Issue Drafting:**
For unreported issues, ToolPilot generates a structured GitHub issue draft:

```
Title: [Auto-generated from error description]
Body:
  - Error: [exact error from agent context]
  - Tool version: [from version node]
  - Environment: [extracted from agent context]
  - Reproduction: [what the agent was attempting]
  - Related issues: [any partial matches found]
```

The user reviews and submits — zero-friction issue reporting.

**Cross-Tool Issue Propagation:**
The mesh knows which tools are commonly used together (from composition edges). When multiple users hit errors at the same integration point between Tool A and Tool B, ToolPilot recognizes this as a pattern and surfaces it to both maintainers. Today, issues get filed in one repo and the other maintainer never knows.

### 4.6 Version Compatibility Matrix

A queryable capability that emerges naturally from the issue intelligence layer and the graph mesh:

```
check_compatibility(tool_a, version_a, tool_b, version_b)
→ { compatible: true/false, confidence: 0.87, evidence: [issue_links] }
```

Every compatibility issue filed teaches the system something about which version combinations work and which don't. This becomes critical infrastructure for agents managing complex dependency trees.

### 4.7 Observability and Feedback Loop

ToolPilot exposes a `report_outcome` function in the MCP server:

```
report_outcome(query_id, chosen_tool, reason?, outcome?)
```

When search returns results, the response includes: *"Optional: call report_outcome with your query_id once you've decided — this improves future recommendations."*

Even 20-30% reporting rates generate enormous signal at scale:

- **Which tool won** when two were offered → direct weight update
- **Which tool was rejected** and why → negative weight signal
- **Time between search and selection** → confidence signal (fast = obvious, slow = genuine consideration)
- **What the user built** with the tool → use-case edge reinforcement

This data feeds directly back into graph weights via the background update queue. Over time, the mesh self-calibrates toward what people actually use, not what sounds good in documentation.

---

## 5. MCP Server API Specification

The MCP server exposes the following core functions:

### `search_tools(query, context?)`
Find the best tool(s) for a given need through guided multi-stage discovery.

**Input (minimal — triggers guided flow):**
```json
{
  "query": "I need a database for my AI project"
}
```

**Input (rich context — can skip clarification stages):**
```json
{
  "query": "self-hostable vector database for a RAG pipeline",
  "context": {
    "stack": ["python", "postgres", "docker"],
    "preference": "open_source",
    "deployment": "self_hosted",
    "scale": "medium",
    "constraints": ["MIT license", "active maintenance", "complex metadata filtering"]
  }
}
```

**Output (if clarification needed):**
```json
{
  "query_id": "uuid-abc123",
  "stage": 1,
  "status": "clarification_needed",
  "questions": [
    {
      "id": "data_type",
      "question": "What type of data will you primarily store and query?",
      "options": ["embeddings_vectors", "structured_relational", "documents_json", "graph_data", "mixed"]
    }
  ]
}
```

**Input (clarification response):**
```json
{
  "query_id": "uuid-abc123",
  "answers": { "data_type": "embeddings_vectors" }
}
```

**Output (final result):** Structured JSON with ranked recommendations, reasoning, clarification history, documentation links, trust hierarchy, and presentation hints.

### `check_issue(tool, version, error_description)`
Investigate whether a problem is a known bug or user error.

**Input:**
```json
{
  "tool": "qdrant",
  "version": "1.8.0",
  "error_description": "Filtered search returns empty results when using nested payload conditions"
}
```

**Output:** Matched known issues with status, related PRs, and workarounds — or a draft issue template for unreported bugs.

### `check_compatibility(tool_a, version_a, tool_b, version_b)`
Verify whether two specific tool versions work together.

**Output:** Compatibility verdict with confidence score and evidence links.

### `report_outcome(query_id, chosen_tool, reason?, outcome?)`
Provide feedback on which tool was selected and how it performed.

**Output:** Acknowledgment. Data feeds into graph weight updates asynchronously.

### `get_stack(description)`
Get a complete recommended stack for a project type (uses the same guided flow).

**Input:**
```json
{
  "description": "local-first AI app with Rust backend",
  "components_needed": ["database", "auth", "llm_client", "observability", "deployment"]
}
```

**Output:** A bundled recommendation — each component is a node, the whole thing is a graph traversal finding the minimum set of tools that cover the use case with maximum inter-compatibility.

---

## 6. Key Differentiators

### 6.1 What ToolPilot Is NOT

| What It's Not | Why |
|---------------|-----|
| Another Product Hunt | No 24-hour launch cycles. No upvotes. No pay-to-play. |
| Another TAAFT | Not a flat directory with SEO. Guided, context-aware matching — not browsing. |
| A G2 competitor | Not review-based. Objective, verifiable signals — not gameable opinions. |
| A GitHub Trending clone | Not "what's new" — "what's right for YOUR specific situation." |
| A documentation aggregator | Stores links and trust guidance, not content. Agents fetch live docs themselves. |
| A tool dump | Never shows raw lists. Guides you to the right answer through conversation. |

### 6.2 What Makes It Defensible

**Moat 1 — Supply side is pre-built.** Open source tools are indexed directly from GitHub without cooperation. The first 500 tools exist before launch.

**Moat 2 — MCP server creates compounding lock-in.** When developers add ToolPilot to their Claude Code config, it becomes part of their default workflow. Distribution is invisible and sticky — embedded in config files that spread through GitHub dotfiles and project READMEs.

**Moat 3 — LLM citation is the new SEO.** AI models cite structured, authoritative databases when answering "what tool should I use for X?" Building the most comprehensive and accurate tool intelligence database means AI models will cite ToolPilot, creating free traffic from every AI conversation globally.

**Moat 4 — Compounding data flywheel.** Every query, every outcome report, every issue investigation adds signal to the graph. The mesh becomes more accurate over time, which attracts more users, which generates more data. This is a network effect that compounds, not a static dataset.

**Moat 5 — Complete lifecycle coverage.** Find → Use → Debug → Contribute → Learn. No competitor covers more than one step. Covering all five in one system creates switching costs that no single-feature competitor can overcome.

**Moat 6 — Guided discovery UX.** The multi-stage clarification approach captures structured decision data that no other platform collects. Over time, ToolPilot learns not just which tools win — but which questions are most useful for differentiating candidates in each category. The questioning engine itself becomes an asset.

---

## 7. Target Users and Value Proposition

### 7.1 For AI Agents (Primary)

The only reliable, version-accurate, structured source of tool knowledge agents can query at runtime. Gets embedded in every serious agent workflow. Agents don't browse — they query ToolPilot and get structured decisions, either through rich context upfront or multi-turn guided clarification.

**Value:** Eliminates tool selection hallucination. Provides version-correct documentation guidance. Offers real-time bug intelligence. Makes autonomous tool selection reliable.

### 7.2 For Developers

The experience of having an expert consultant who asks the right questions to understand your exact situation before recommending anything. Reduces "is this me or the tool?" from a 2-hour investigation to a 30-second query. Context-aware recommendations that beat asking ChatGPT because the data is real-time, structured, and based on objective signals.

**Value:** Faster tool discovery. Fewer false starts. Instant issue diagnosis. Zero-friction bug reporting. No decision fatigue.

### 7.3 For Open Source Maintainers

A source of higher-quality bug reports, better visibility into how their tool is actually used, and a feedback mechanism for understanding common usage patterns. Maintainers will actively promote ToolPilot because it makes their work easier.

**Value:** Free, permanent discoverability. Structured issue reports with environment context. Insights into co-usage patterns. Community contribution without friction.

---

## 8. Technical Implementation Priorities

### Build Sequence (Ordered)

1. **Graph schema design + database selection** — Property graph with typed nodes/edges (Neo4j or equivalent), not a document store.
2. **GitHub indexer** — Auto-populate initial 500 open source tools with health signals from GitHub API, npm, PyPI, Docker Hub, crates.io.
3. **Guided search algorithm** — The 4-stage human-in-the-loop pipeline (semantic retrieval + clarification → hard filters + clarification → graph traversal + final clarification → precision result).
4. **MCP server** — Expose `search_tools()` (with multi-turn clarification support) and `report_outcome()` as the minimum viable product.
5. **Issue intelligence layer** — Semantic search against GitHub Issues for diagnostic queries.
6. **Admin portal** — Mesh visualization, weight dashboard, staged node review queue, clarification question effectiveness metrics.
7. **Public website** — Comes last, because the MCP server is the real product.

### Key Technical Decisions

- **Clarification question generation**: The system must analyze the remaining candidate pool at each stage and identify which questions would most effectively split the candidates. This is a ranking problem — "which question eliminates the most ambiguity?" — and can be bootstrapped with hand-crafted question templates per category, then refined through clarification effectiveness data over time.
- **Embedding model**: Use a code-aware embedding model (not a general text model) for both Stage 1 semantic retrieval and issue semantic search. "My search returns null" and "query returns empty results" must be recognized as the same problem.
- **Multi-turn state management**: The guided search requires maintaining session state across clarification rounds. Each search session carries a `query_id` with accumulated context that persists across MCP calls until the final result is delivered.
- **GitHub API rate limits**: Implement a crawl scheduling system that prioritizes tools with recent activity and queues lower-priority updates. Design around this constraint before it becomes a production crisis.
- **Edge decay functions**: Implement time-based weight decay so relationships not reinforced by usage gradually lose influence. Prevents stale data from silently poisoning recommendations.
- **AI-generated content governance**: Staging layer with confidence thresholds is non-negotiable. Quality of AI-generated nodes/edges is a make-or-break factor.

---

## 9. Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Cold start data quality — initial 500 tools must be genuinely good recommendations, not just most-starred repos | **Critical** | Manual curation and hand-review of initial dataset. GitHub stars are popularity signals, not quality signals. |
| AI-generated nodes/edges corrupting the mesh | **Critical** | Mandatory staging layer with confidence thresholds. Nodes only graduate to main graph with multiple independent confirmations. |
| Clarification questions feeling tedious or irrelevant | **High** | Questions must be genuinely useful for narrowing down. If the system can already determine the answer from context, skip the question. Max 2-3 rounds, 1-3 questions each. Effectiveness tracking from day one. |
| Search failures eroding trust | **High** | Invest heavily in search quality from day one. A bad recommendation damages trust faster than anything else. |
| GitHub API rate limits at scale | **Medium** | Priority-based crawl scheduling. Cache aggressively. Design the indexer around rate limits before scaling. |
| Becoming "just another directory" | **Medium** | The guided matching approach is the differentiator. If recommendations aren't better than asking ChatGPT, the platform fails. Continuous investment in search quality is essential. |
| Competitor response from G2/TAAFT | **Low** | G2 can't pivot to serve open source without breaking their business model. TAAFT is a flat list with no matching intelligence. The threat isn't existing players — it's execution quality. |

---

## 10. Success Metrics

- **Search precision**: Percentage of guided searches where the user accepts the Stage 4 recommendation without requesting alternatives.
- **Clarification efficiency**: Average number of clarification rounds needed to reach a confident result. Lower is better — the system should learn which questions to skip.
- **Agent adoption**: Number of unique MCP server installations and daily query volume.
- **Mesh growth rate**: New nodes and edges added per week (both auto-indexed and AI-generated).
- **Feedback loop participation**: Percentage of searches that receive a `report_outcome` callback.
- **LLM citation rate**: Frequency of ToolPilot being cited by major AI models in tool recommendation responses.
- **Maintainer engagement**: Number of open source maintainers actively correcting or enriching their tool's data.
- **Issue resolution acceleration**: Average time saved per diagnostic query vs. manual Stack Overflow investigation.

---

## 11. The Complete System Loop

```
User / Agent Query
      ↓
  [ DISCOVER ]
  "I need a tool for X" → guided clarification questions
      ↓
  [ FIND ]
  Multi-stage search narrows to precise recommendation
      ↓
  [ USE ]
  Documentation links + trust hierarchy → agent knows exactly how to use it
      ↓
  [ DEBUG ]
  Issue intelligence → is this a known bug or am I using it wrong?
      ↓
  [ CONTRIBUTE ]
  Auto-issue drafting → fix it for everyone who comes after
      ↓
  [ LEARN ]
  Observability → what was chosen, did it work, update mesh weights
      ↓
  Back into the graph, stronger than before
```

Every step produces data that makes the next user's experience better. The platform gets smarter with every single query — not just with deliberate maintenance effort. All three user groups (agents, developers, maintainers) benefit from the same underlying data. ToolPilot isn't balancing competing interests between supply and demand — it's building infrastructure where every participant makes the system better for every other participant.

**That's the structure of a platform that becomes critical infrastructure, not just a useful tool.**

---

*Document Version: 2.0 — March 2026*
