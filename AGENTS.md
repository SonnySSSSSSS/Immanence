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

## Spec Lint Gate (Mandatory)

Before any implementation, the executing agent MUST validate the incoming spec against this checklist:

- Single hypothesis
- Single atomic change
- Exact file allowlist
- Explicit no-sequencing rule
- Clear success/fail screenshot signal
- Explicit stop gate (halt after commit and wait for human pass/fail)

If the requested step is a probe, spec MUST also include:
- Probe markers (`// PROBE:<domain>:START` and `// PROBE:<domain>:END`)

If ANY required item is missing, ambiguous, or conflicting:
- REJECT implementation
- Return a concise lint-fail report
- Request a corrected spec
- Do not edit files

# Pre-build Reality Check (Reality Signal)

// PROBE:REALITY_CHECK:START
Before creating any new project, feature, tool, library, or large refactor, run a Reality Check first. Do not write implementation code until this check is complete.

Input (one line):
- “<one-sentence description of what you want to build>”

Minimum required evidence source (must use real search, not memory):
- GitHub repository search (required)

Optional evidence sources (if quick to do):
- Hacker News (Algolia) discussion volume
- npm registry (JS/TS packages)
- PyPI (Python packages)
- Product Hunt (only if token is available)

Output (always produce this structure):
Reality Signal: <0–100>

Top competitors found (at least 3, GitHub-first):
- <name> — <stars> ⭐ — <link>
- <name> — <stars> ⭐ — <link>
- <name> — <stars> ⭐ — <link>

Coverage summary (numbers, not vibes):
- GitHub: <repo_count> repos found for query terms; top stars: <top_star_1>, <top_star_2>, <top_star_3>
- HN (optional): <mentions_count> mentions
- npm (optional): <package_count> relevant packages
- PyPI (optional): <package_count> relevant packages

Scoring rubric (simple, reproducible):
- Start from 0.
- Add GitHub coverage points (0–60):
  - Repo count bucket (0–30): 0 (none), 10 (1–10), 20 (11–100), 30 (101+)
  - Star pressure (0–30): 0 (top <50⭐), 10 (top 50–499⭐), 20 (top 500–1999⭐), 30 (top ≥2000⭐)
- Add discussion/registry points (0–40):
  - HN mentions bucket (0–20): 0 (0), 5 (1–10), 10 (11–50), 20 (51+)
  - Package ecosystem bucket (0–20): 0 (none), 10 (some), 20 (many)
- Clamp to 0–100.

Decision gate:
- If Reality Signal > 80: STOP. Warn: “High existing coverage.” Recommend pivot/differentiation before building.
- If Reality Signal 61–80: Proceed with caution. Require 2–3 differentiation angles (specific gaps, niche, UX wedge, integration wedge).
- If Reality Signal ≤ 60: Green light. Proceed normally.

Differentiation prompt (required when >60):
- “What specific gap will we own that competitors do not (workflow, audience, integration, distribution, performance, or UX)?”
// PROBE:REALITY_CHECK:END

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
