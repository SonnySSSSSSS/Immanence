# AGENTS — Authority & Roles

This file defines how all AI agents must operate in this repository.

This file overrides any agent defaults.

---

## Authority Chain

1. HUMAN (repo owner) — final authority
2. Claude Code — central planner / architect
3. Gemini / Antigravity — complex implementer (when assigned)
4. Codex CLI — mechanical implementer (when assigned)

No agent may override a higher authority.

---

## Roles

### Claude Code
- Produces task specs
- Defines file scope and constraints
- Does NOT implement unless explicitly assigned

### Gemini / Antigravity
- Implements complex or multi-file tasks
- May refactor ONLY within assigned scope
- Must follow specs exactly

### Codex CLI
- Implements mechanical or narrow tasks
- NO refactors
- NO architectural changes
- Minimal diffs only

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
- No “small fixes” or “while I’m here” edits.

---

## Definition of DONE

A task is DONE only when:
- Changes are committed
- Commit hash is recorded in worklog
- Verification steps were run
- Status is updated to COMPLETED
