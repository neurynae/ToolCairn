---
name: remind
description: Recall persistent memory into context — PRIMER, feedback patterns, project state
user-invocable: true
allowed-tools: Read, Bash
---

Load persistent memory into the current context so this session has full awareness of project state, past decisions, and learned patterns.

## Steps

1. **Read PRIMER.md** — current phase, recent commits, next steps, blockers, key technical notes:
   ```
   C:\Users\ANMOL RAJ SONI\.claude\projects\D--ToolPilot\memory\PRIMER.md
   ```

2. **Read MEMORY.md index** — list of all memory files:
   ```
   C:\Users\ANMOL RAJ SONI\.claude\projects\D--ToolPilot\memory\MEMORY.md
   ```

3. **Read the most relevant feedback files** — scan MEMORY.md index for feedback entries that are likely relevant to the current task (read up to 5 most recently created or most topic-relevant ones). Feedback files are at:
   ```
   C:\Users\ANMOL RAJ SONI\.claude\projects\D--ToolPilot\memory\feedback\
   ```

4. **Read key project files** — always read the files from:
   ```
   C:\Users\ANMOL RAJ SONI\.claude\projects\D--ToolPilot\memory\project\
   ```

5. **Synthesize and report** — After reading, output a concise summary:
   - Current phase and what's done
   - The 3 most important next steps
   - Any feedback rules that are highly relevant to what the user might be working on next
   - Any open blockers

Do NOT just dump the raw file contents — synthesize into a useful briefing that orients the session.
