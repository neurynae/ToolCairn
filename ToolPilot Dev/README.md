# ToolPilot Dev — Obsidian Vault

This vault is the **Layer 5** knowledge base for building ToolPilot. It captures:

- **ADRs/** — Architecture Decision Records (why we made each technical choice)
- **Research/** — Library comparisons, benchmarks, external API analysis
- **Design/** — Feature design docs, data flow diagrams, wireframes
- **References/** — External docs, API notes, useful links

## How It Works

Claude Code reads this vault as part of its context (it's inside `D:\ToolPilot\`). When you write a new ADR or research note here, Claude picks it up automatically in the next session.

## Workflow

1. Made a significant technical decision? Write an ADR in `ADRs/`
2. Researched a library or approach? Save findings in `Research/`
3. Designing a new feature? Draft it in `Design/`

Use the template in `ADRs/template-adr.md` for new ADRs.

## Current ADRs

- [ADR-001: Memgraph as Graph Database](ADRs/ADR-001-graph-database.md)
- [ADR-002: Temporal Edge Decay at Query Time](ADRs/ADR-002-temporal-edge-decay.md)
