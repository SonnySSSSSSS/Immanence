# AGENTS - Authority & Roles

This document governs how all AI agents operate in this repository.
If any repo instructions conflict, this file wins.
Use `docs/DOCS_INDEX.md` for the doc map.

## Workspace Rule (Mandatory)

- Work only in the canonical workspace: `D:\Unity Apps\immanence-os`.
- Do not run, edit, or back up from `.claude-worktrees/...`.
- If changes are made in a worktree during an AI session, copy them back to the main folder before running or committing.
- Run dev servers (`npm run dev`) and backups from the main folder only.

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

Optional task-level flags (must be explicit if used):
- `NO COMMIT WITHOUT HUMAN APPROVAL`
- `IMPLEMENT UNCOMMITTED, VERIFY FIRST`
- `COMMIT AFTER HUMAN PASS/FAIL ONLY`

## Pre-Implementation Gates (Mandatory)

### Spec Lint Gate

Before implementation, the executing agent MUST validate the spec against this checklist:

- Single hypothesis
- Single atomic change
- Exact file allowlist
- Explicit no-sequencing rule
- Clear success/fail screenshot signal
- Explicit stop gate (halt after commit and wait for human pass/fail)

If the requested step is a probe, the spec MUST also include:
- Probe markers (`// PROBE:<domain>:START` and `// PROBE:<domain>:END`)

If any required item is missing, ambiguous, or conflicting:
- REJECT implementation
- Return a concise lint-fail report
- Request a corrected spec
- Do not edit files

### Stateful UI Debug Gate

Applies when the task is a UI bug and the displayed result depends on derived state, selectors, services, or multi-step logic.

Before implementation, the executing agent MUST:

1. Identify the exact render surface
   - File + component that directly renders the failing UI element
2. Identify the exact upstream state source
   - Store selector, helper, service, or computation that determines the displayed state
3. Prove one concrete failing runtime case
   - Exact rendered item/index
   - Runtime object backing it
   - Field/value expected to drive the UI but currently failing
4. Isolate visual layer vs logic layer
   - Temporarily force the visual change on one known item to prove the layer is visible
   - Remove the force before final implementation
5. State the exact implementation predicate
   - The precise condition that will control the UI change, based on proven runtime data

If any step above is missing:
- STOP
- Report which proof is missing
- Do not commit
- Do not continue implementation

### Runtime Proof Gate

Applies when the task is a bug in logic, state, data flow, or any non-trivial behavior where the visible failure depends on derived runtime conditions.

Before implementation, the executing agent MUST:

1. Identify the exact failing behavior
   - What is wrong in the live product, in one sentence
2. Identify the runtime source of truth
   - The function, helper, selector, service, or data structure that actually determines the failing behavior
3. Prove one concrete failing case
   - Input/state
   - Actual output
   - Expected output
4. State the exact correction boundary
   - Which layer is wrong: rendering, predicate, transformation, matching, or persistence

If this proof is missing:
- STOP
- Report the missing runtime proof
- Do not implement

### Verification Hierarchy

Verification must match the failure type:

- Visual/UI bugs:
  - Build success is not sufficient
  - Require visual confirmation in the actual target surface
  - Prefer screenshot confirmation when the spec asks for it
- Logic/behavior bugs:
  - Require one concrete before/after case
  - Build success is not sufficient
- Build or config tasks:
  - Build success may be sufficient only if the requested outcome is purely build/config scoped

When a task has a visual success signal, implementation is not considered validated until the visible surface matches that signal.

### Runtime Semantics Rule

- Do not infer runtime state from comments, labels, or docstrings alone.
- Do not reconstruct existing business logic in the UI layer if a source-of-truth service already computes that state.
- When a service already defines the state meaning, consume that meaning directly unless the task explicitly requires changing the service.

---

## Pre-Build Reality Check (Mandatory for New Builds)

// PROBE:REALITY_CHECK:START
Before creating a new project, feature, tool, library, or large refactor, run a Reality Check first. Do not write implementation code until it is complete.

Input:
- One sentence describing what you want to build

Minimum evidence source:
- GitHub repository search (required; must use real search, not memory)

Optional evidence sources (if quick):
- Hacker News (Algolia)
- npm registry
- PyPI
- Product Hunt (if token is available)

Required output:
- `Reality Signal: <0-100>`
- `Top competitors found` (at least 3, GitHub-first, with stars + links)
- `Coverage summary` (numbers only, not vibes)
  - GitHub repo count + top star counts
  - HN mentions (optional)
  - npm package count (optional)
  - PyPI package count (optional)

Scoring rubric:
- Start at 0
- Add GitHub coverage points (0-60)
  - Repo count: 0 (none), 10 (1-10), 20 (11-100), 30 (101+)
  - Star pressure: 0 (top <50), 10 (50-499), 20 (500-1999), 30 (2000+)
- Add discussion/registry points (0-40)
  - HN mentions: 0 (0), 5 (1-10), 10 (11-50), 20 (51+)
  - Package ecosystem: 0 (none), 10 (some), 20 (many)
- Clamp to 0-100

Decision gate:
- If Reality Signal > 80: STOP. Warn: `High existing coverage.` Recommend pivot/differentiation before building.
- If Reality Signal 61-80: Proceed with caution. Require 2-3 explicit differentiation angles.
- If Reality Signal <= 60: Green light. Proceed normally.

Required prompt when score > 60:
- `What specific gap will we own that competitors do not (workflow, audience, integration, distribution, performance, or UX)?`
// PROBE:REALITY_CHECK:END

---

## Locks

- Files listed in an ACTIVE task are LOCKED.
- Other agents must not modify locked files.
- No "small fixes" or "while I'm here" edits.

---

## Planning Constraint - Reuse First

Applies to all planning agents (ChatGPT, Codex CLI/Codex, Claude Code when creating specs, and any LLM writing task specs).

Before proposing any NEW component, hook, store, or utility, the agent MUST:

1. Explicitly list existing components or systems that may already serve the role
2. State whether each can be:
   - Reused AS-IS
   - Reused with minor extension
   - Unsuitable (with a specific reason)
3. Propose a new component only if reuse would add more complexity than it removes

If reuse is possible, the plan MUST prefer reuse.

---

## Definition of DONE

A task is DONE only when:
- Changes are committed (if a commit was requested)
- Verification steps were run (if required)
- Status is updated in the task record, if the task uses one

If the task includes any `NO COMMIT` or human-approval flag, DONE cannot be reached until that approval condition is satisfied.
