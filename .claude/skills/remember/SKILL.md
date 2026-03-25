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

3. **If `$ARGUMENTS` is provided**, save that specific learning:
   - Classify as: `user` / `feedback` / `project` / `reference`
   - Write to an appropriately named file in `C:\Users\ANMOL RAJ SONI\.claude\projects\D--ToolPilot\memory\` with proper frontmatter
   - Add a pointer line to `MEMORY.md`

Report what was saved and why it will matter in future sessions.
