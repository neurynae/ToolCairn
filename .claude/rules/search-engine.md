---
paths: ["packages/search/**"]
---
# Search Engine Rules
- Stage 1: Always combine BM25 + vector via RRF fusion
- Stage 2: Apply Qdrant payload filters, never filter in application code
- Stage 3: Compute temporal decay at query time, never as batch jobs
- Stage 4: Two-option logic only when gap < 20% AND stable/emerging split exists
- Clarification questions: max 3 per stage, must have measurable information gain
- Total search latency budget: < 200ms excluding clarification wait
