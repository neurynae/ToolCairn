---
paths: ["packages/graph/**"]
---
# Graph Query Rules
- All Cypher queries parameterized (never string-interpolate values)
- Use neo4j-driver session management (auto-close sessions)
- Effective weight formula: base_weight × exp(-decay_rate × days_since_verified)
- All repository methods return typed results, never raw records
