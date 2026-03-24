# AGENTS

This is the canonical agent policy for `D:\Unity Apps\immanence-os`.
If repo instructions conflict, this file wins.
Use `docs/DOCS_INDEX.md` for the current doc map.

## Workspace Rule

- Work only in the canonical workspace: `D:\Unity Apps\immanence-os`.
- Do not run, edit, or back up from `.claude-worktrees/...`.
- If a tool edits a worktree during an AI session, copy the changes back to the main folder before running or committing.
- Run dev servers and backups from the main folder only.

## Authority Chain

1. HUMAN (repo owner) - final authority
2. ChatGPT (planner/adviser) - planning, specs, review, debugging guidance without repo edits
3. VS Code agent (Copilot) - small or medium code edits and docs
4. Codex CLI / Codex - multi-file refactors and harder bug fixes
5. Claude Code - last resort for complex or high-stakes changes

No agent may override a higher authority.

## Task Spec Requirements

Every task must define:

- Goal
- Files to modify (ALLOWLIST)
- Files NOT to modify (DENYLIST)
- Constraints
- Verification step(s)
- Commit message

If any item is missing, the task is invalid.

### Path Format Rule

- ALLOWLIST and DENYLIST entries must use exact repo-relative paths such as `src/components/HomeHub.jsx`.
- Do not use filename-only entries.
- Do not mix repo-relative and absolute paths in the same spec.
- Use absolute paths only when a task explicitly requires absolute-path mode, and then use them consistently.

Optional task flags:

- `NO COMMIT WITHOUT HUMAN APPROVAL`
- `IMPLEMENT UNCOMMITTED, VERIFY FIRST`
- `COMMIT AFTER HUMAN PASS/FAIL ONLY`

## Pre-Implementation Gates

### Spec Lint Gate

Before implementation, validate the spec against this checklist:

- single hypothesis
- single atomic change
- exact file allowlist
- explicit no-sequencing rule
- clear success/fail screenshot signal, or `N/A` for non-visual work
- explicit stop gate

If the step is a probe, the spec must also include probe markers:

- `// PROBE:<domain>:START`
- `// PROBE:<domain>:END`

If any required item is missing, ambiguous, or conflicting:

- reject implementation
- return a concise lint-fail report
- request a corrected spec
- do not edit files

Exception:

- if the defect qualifies for `Spec Auto-Fix (Unambiguous Only)`, the executing agent may normalize the spec and continue without requesting a full rewrite.

#### Spec Auto-Fix (Unambiguous Only)

If a spec's intent is clear and the only issues are minor and unambiguous, the executing agent may normalize the spec internally and proceed.

Auto-fixable cases include:

- formatting, punctuation, and obvious typos
- filename-only allowlist entries that map to exactly one repo-relative path
- repo-relative allowlist paths that do not exist but map unambiguously to one current file
- stale or mistaken allowlist paths that unambiguously identify the current owner file
- replacing a nonexistent config, module, or asset path with the real owner file or files when the mapping is clear from the codebase
- adding closely coupled owner files that are obviously required to complete the same single atomic change, when those files are unique and directly implied by the requested work
- filling harmless omissions with safe defaults when intent is obvious:
  - missing no-sequencing rule -> `No sequencing; perform only the listed atomic change.`
  - missing screenshot signal for non-visual work -> `N/A`
  - missing stop gate -> `Stop if allowlist or denylist intent becomes ambiguous, if required proof cannot be established, or if implementation requires files outside the corrected allowlist.`

When using auto-fix, the executing agent must:

- normalize or correct the spec text internally
- explicitly list the corrections made (`old -> new`)
- keep the change single-purpose and atomic
- implement and verify per the corrected spec

Files omitted from the original allowlist remain out of scope unless they are added through this unambiguous auto-fix process.

If any correction is ambiguous, material, or would require guessing intent, stop and request clarification; do not implement or commit.

Examples of ambiguity that still require a stop:

- multiple plausible file matches
- unclear constraints
- unclear verification
- a requested change that stops being atomic after correction

### Stateful UI Debug Gate

Use this gate when a UI bug depends on derived state, selectors, services, or multi-step logic.

Before implementation, the executing agent must:

1. Identify the exact render surface.
2. Identify the exact upstream state source.
3. Prove one concrete failing runtime case.
4. Isolate visual layer versus logic layer by forcing the change on one known item, then remove that force before the final implementation.
5. State the exact implementation predicate.

If any proof is missing:

- stop
- report what is missing
- do not implement or commit

### Runtime Proof Gate

Use this gate when the failure is in logic, state, data flow, or other derived runtime behavior.

Before implementation, the executing agent must:

1. State the exact failing behavior in one sentence.
2. Identify the runtime source of truth.
3. Prove one concrete failing case with input or state, actual output, and expected output.
4. State the correction boundary: rendering, predicate, transformation, matching, or persistence.

If the runtime proof is missing:

- stop
- report the missing proof
- do not implement

### Verification Hierarchy

- Visual or UI bugs: build success is not enough. Confirm the target surface, and use screenshots when the spec asks for them.
- Logic or behavior bugs: provide at least one concrete before and after case. Build success is not enough.
- Build or config work: build success is enough only when the requested outcome is purely build or config scoped.

When a task defines a visual success signal, validation is incomplete until the visible surface matches it.

### Runtime Semantics Rule

- Do not infer runtime state from comments, labels, or docstrings alone.
- Do not recreate business logic in the UI layer if an existing service already computes that state.
- When a service already defines the meaning of a state, consume that meaning directly unless the task explicitly requires changing the service.

## Pre-Build Reality Check

// PROBE:REALITY_CHECK:START
Before creating a new project, feature, tool, library, or large refactor, run a Reality Check first.

Input:

- one sentence describing what you want to build

Minimum evidence source:

- GitHub repository search, using a real search rather than memory

Optional evidence sources:

- Hacker News (Algolia)
- npm registry
- PyPI
- Product Hunt, if a token is available

Required output:

- `Reality Signal: <0-100>`
- `Top competitors found` with at least 3 GitHub-first competitors, including stars and links
- `Coverage summary` with numbers only:
  - GitHub repo count and top star counts
  - HN mentions, if used
  - npm package count, if used
  - PyPI package count, if used

Scoring rubric:

- Start at 0
- Add GitHub coverage points (0-60)
  - Repo count: 0 (none), 10 (1-10), 20 (11-100), 30 (101+)
  - Star pressure: 0 (top <50), 10 (50-499), 20 (500-1999), 30 (2000+)
- Add discussion and registry points (0-40)
  - HN mentions: 0 (0), 5 (1-10), 10 (11-50), 20 (51+)
  - Package ecosystem: 0 (none), 10 (some), 20 (many)
- Clamp to 0-100

Decision gate:

- If `Reality Signal > 80`: stop and warn `High existing coverage.`
- If `Reality Signal 61-80`: proceed with caution and require 2-3 explicit differentiation angles
- If `Reality Signal <= 60`: green light

Required prompt when the score is above 60:

- `What specific gap will we own that competitors do not (workflow, audience, integration, distribution, performance, or UX)?`
// PROBE:REALITY_CHECK:END

## Locks

- Files listed in an active task are locked.
- Other agents must not modify locked files.
- No "small fixes" or "while I'm here" edits.

## Planning Constraint - Reuse First

Before proposing any new component, hook, store, or utility, planning agents must:

1. List existing components or systems that may already serve the role.
2. State whether each can be reused as-is, reused with minor extension, or is unsuitable with a specific reason.
3. Propose a new component only when reuse would add more complexity than it removes.

If reuse is possible, the plan must prefer reuse.

## Security Review

Before any production deployment, run `docs/PRODUCTION_SECURITY_CHECKLIST.md`.
That checklist is the release gate for all Critical and High security items.
It covers: secrets handling, authentication, authorization, rate limiting, input safety, LLM prompt injection, CORS, observability, dependency review, and scalability.
Use the Audit Record Template in section 15 to document findings per item.

## Definition of Done

A task is done only when:

- requested changes are committed, if a commit was requested
- required verification steps were run
- task status is updated if the task record uses one

If a task includes any no-commit or human-approval flag, done is blocked until that condition is satisfied.
