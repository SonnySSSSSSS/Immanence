# AGENTS — Authority & Roles

This file defines how all AI agents must operate in this repository.

This file overrides any agent defaults.

## Workspace Rule (Mandatory)

- All agents must operate in the canonical workspace: `D:\Unity Apps\immanence-os`.
- Do not run, edit, or back up from `.claude-worktrees/...` folders.
- If changes are made in a worktree during an AI session, copy them back to the main folder before running or committing.
- All dev server runs (`npm run dev`) and backups are performed from the main folder.

---

## Authority Chain

1. HUMAN (repo owner) — final authority
2. Claude Code — central planner / architect
3. Gemini / Antigravity — complex implementer (when assigned)
4. Codex CLI — mechanical implementer (when assigned)

No agent may override a higher authority.

---

## Roles — Architect-Builder Split

### Claude Code (ARCHITECT)
- **Responsibilities:**
  - Research and analyze codebase to understand requirements
  - Plan implementations and design task specifications
  - Write technical specifications into `worklog.md` formatted for IDE execution
  - Define file scope, constraints, and validation steps
  - **STRICTLY PROHIBITED from modifying `/src` or any application code**
  - **MUST follow "Planning Constraint — Reuse First" when creating specs (see below)**

### IDE Agent / VS Code (BUILDER)
- **Responsibilities:**
  - Read tasks from `worklog.md`
  - Execute code changes as specified in task format
  - Test implementations and verify success
  - Record completion status, timestamps, and commit hashes in `worklog.md`
  - Report any blockers or clarifications needed back to ARCHITECT

### Gemini / Antigravity
- Implements complex or multi-file tasks (when assigned)
- May refactor ONLY within assigned scope
- Must follow specs exactly

### Codex CLI
- Implements mechanical or narrow tasks (when assigned)
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

## Planning Constraint — Reuse First

**Applies to:** All planning agents (Claude Code, Codex CLI, Gemini/Antigravity when creating specs, any LLM writing task specs)

Before proposing any NEW component, hook, store, or utility, you MUST:

1. **Explicitly list existing components or systems** that may already serve this role
2. **State whether each can be:**
   - Reused AS-IS
   - Reused with minor extension
   - Unsuitable (with specific reason)
3. **Only propose a new component** if reuse would cause more complexity than it removes

**If reuse is possible, the plan MUST prefer reuse.**

### Example (Good)

```markdown
## Component Analysis

**Requirement:** Display ritual session with timer and step progression

**Existing Components:**
1. `RitualSession.jsx` - Can be reused AS-IS
   - Already has intro/active/completion flow
   - Already has timer logic with pause/resume
   - Already has step progression
   - **Decision: REUSE**

2. `RitualStepDisplay.jsx` - Can be reused with minor extension
   - Already displays step instructions and images
   - Needs addition of thought text display for Step 2
   - **Decision: REUSE + EXTEND**

**New Components:**
None required. Reusing existing ritual components.
```

### Example (Bad)

```markdown
## Component Analysis

**Requirement:** Display ritual session with timer and step progression

**New Components:**
- `ThoughtDetachmentRitualSession.jsx` - New session component
- `ThoughtDetachmentRitualTimer.jsx` - Custom timer
- `ThoughtDetachmentStepDisplay.jsx` - Step display

❌ REJECTED: Did not analyze existing components for reuse
```

---

## Definition of DONE

A task is DONE only when:
- Changes are committed
- Commit hash is recorded in worklog
- Verification steps were run
- Status is updated to COMPLETED
