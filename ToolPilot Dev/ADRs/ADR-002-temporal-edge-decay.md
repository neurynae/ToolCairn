# ADR-002: Temporal Edge Decay Computed at Query Time

**Date**: 2026-03-25
**Status**: accepted

## Context

Graph edges representing tool relationships have a `last_verified` timestamp and a `decay_rate`. Older, unverified relationships should rank lower than recently verified ones. Two options: (a) batch job updates `weight` periodically, or (b) compute effective weight at query time.

## Decision

Compute temporal decay **at query time** using Cypher:

```cypher
WITH e,
  duration.inDays(e.last_verified, datetime()).days AS days_old,
  e.weight * exp(-e.decay_rate * duration.inDays(e.last_verified, datetime()).days) AS effective_weight
```

Formula: `effective_weight = base_weight × exp(-decay_rate × days_since_verified)`

## Consequences

**Positive**:
- Always accurate — no stale data from missed batch runs
- No background jobs needed — simpler operational model
- Default decay_rate of 0.05 = ~50% weight after ~14 days without verification

**Negative**:
- Slightly more computation per query (acceptable given Memgraph's in-memory speed)
- Requires Cypher to support `exp()` function (Memgraph MAGE provides this)
