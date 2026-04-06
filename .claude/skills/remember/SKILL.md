---
name: remember
description: Save session learnings to persistent memory and update PRIMER.md with current project state
user-invocable: true
---

Save learnings from this session to persistent memory.

1. **REWRITE PRIMER.md** at `C:\Users\ANMOL RAJ SONI\.claude\projects\D--ToolPilot\memory\PRIMER.md`:
   - Run `git branch --show-current` in `D:\ToolPilot` to get active branch
   - Run `git log --oneline -5` to get recent commits
   - Summarize current session: phase status, what was completed (specific file names), what is in progress, next steps in priority order, open blockers, key technical decisions made
   - Update the `updated:` frontmatter timestamp to now
   - Keep under 70 lines — be specific, not vague

2. **EXTRACT PATTERNS** from this session:
   - Did the user correct an approach? → update or create a feedback memory file
   - Did something fail repeatedly? → feedback memory
   - Did a pattern work particularly well? → feedback memory
   - Was a new architectural decision made? → project memory
   - Only save what is non-obvious and genuinely useful in a future session
   - Skip if nothing noteworthy emerged

3. **OBSIDIAN VAULT** — Automatically write significant session learnings to `D:\ToolPilot\ToolPilot Dev\`:
   - Review the session for decisions/patterns worth preserving in the vault
   - **ADR** (Architecture Decision Record) → write to `D:\ToolPilot\ToolPilot Dev\ADRs\` if a significant architectural decision was made this session (e.g. new node type, search algorithm change, new MCP tool)
     - Filename: `ADR-NNN-short-title.md` (increment from the latest existing ADR number)
     - Format: `# ADR-NNN: Title`, `## Status: Accepted`, `## Context`, `## Decision`, `## Consequences`
   - **Research** → write to `D:\ToolPilot\ToolPilot Dev\Research\` if a root-cause investigation produced a non-obvious finding (e.g. Nomic task type asymmetry, BM25 name tokenization, Qdrant scroll ordering bug)
     - Filename: `YYYY-MM-DD-topic.md`
   - **Design** → write to `D:\ToolPilot\ToolPilot Dev\Design\` if a new feature was designed (interfaces, flow diagrams, data shapes)
   - Skip vault writes only if the session had no decisions or findings beyond routine fixes
   - Use your own judgement on what is vault-worthy — deliberate, non-obvious, reusable knowledge only

4. **If `$ARGUMENTS` is provided**, save that specific learning:
   - Classify as: `user` / `feedback` / `project` / `reference`
   - Write to an appropriately named file in `C:\Users\ANMOL RAJ SONI\.claude\projects\D--ToolPilot\memory\` with proper frontmatter
   - Add a pointer line to `MEMORY.md`

5. **REPORT** — Report what was saved and why it will matter in future sessions.
