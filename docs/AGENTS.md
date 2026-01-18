# AGENTS - Authority & Roles

STATUS: Active. This doc overrides agent defaults.
Scope: authority, roles, task rules, planning constraint.
If conflicts with other docs, this file wins.
Use `docs/DOCS_INDEX.md` for the doc map.

This file defines how all AI agents must operate in this repository.

## Workspace Rule (Mandatory)

- All agents must operate in the canonical workspace: `D:\Unity Apps\immanence-os`.
- Do not run, edit, or back up from `.claude-worktrees/...` folders.
- If changes are made in a worktree during an AI session, copy them back to the main folder before running or committing.
- All dev server runs (`npm run dev`) and backups are performed from the main folder.

---

## Authority Chain

1. HUMAN (repo owner) - final authority
2. ChatGPT (planner/adviser) - planning, specs, review, debugging guidance (no repo edits)
3. VS Code agent (Copilot) - small/medium code edits and docs
4. Codex CLI / Codex - multi-file refactors and harder bug fixes
5. Claude Code - last resort for complex or high-stakes changes

No agent may override a higher authority.

---

## Task Rules

Every task MUST define:
- Goal
- Files to modify (ALLOWLIST)
- Files NOT to modify (DENYLIST)
- Constraints
- Verification step(s)
- Commit message

If any of the above are missing, the task is invalid.

---

## Locks

- Files listed in an ACTIVE task are LOCKED.
- Other agents must not modify locked files.
- No "small fixes" or "while I'm here" edits.

---

## Planning Constraint - Reuse First

**Applies to:** All planning agents (ChatGPT, Codex CLI/Codex, Claude Code when creating specs, any LLM writing task specs)

Before proposing any NEW component, hook, store, or utility, you MUST:

1. **Explicitly list existing components or systems** that may already serve this role
2. **State whether each can be:**
   - Reused AS-IS
   - Reused with minor extension
   - Unsuitable (with specific reason)
3. **Only propose a new component** if reuse would cause more complexity than it removes

**If reuse is possible, the plan MUST prefer reuse.**

---

## Definition of DONE

A task is DONE only when:
- Changes are committed (if a commit was requested)
- Verification steps were run (if required)
- Status is updated in the task record
