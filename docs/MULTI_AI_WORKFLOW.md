# Multi-AI Collaboration Workflow

STATUS: Active for coordination and file ownership.
Use `docs/AGENTS.md` for authority and stack definitions.
Use `docs/DOCS_INDEX.md` for the current doc map.

## Purpose
This document defines the protocol for coordinating work between multiple AI assistants (ChatGPT planner/adviser, VS Code agent, Codex CLI/Codex, Claude Code) to prevent merge conflicts, code overwrites, and lost work.

## Current Roles (2026)
- ChatGPT (planner/adviser): specs, risk checks, prompts, acceptance criteria.
- VS Code Agent: executes small/medium tasks from a spec; must stop and show diff for review.
- Codex CLI/Codex: executes multi-file refactors + deeper bug fixes; must checkpoint often.
- Claude Code: use only for high-stakes changes or when others stall; treat as expensive "closer".

---

## Core Principles

1. **Atomic File Ownership**: Only ONE agent works on a given file at a time
2. **Transparent Communication**: Changes are surfaced in task notes or PR description
3. **Version Tracking**: Follow project versioning conventions if a file is designated for version bumps
4. **Session Isolation**: Check for active work on target files before starting

## Workflow Protocol

### Before Starting Work

1. Check if any agent is currently working on target files
2. If file is locked by another agent, wait or coordinate
3. Confirm the task scope, allowlist, and constraints

### During Work

1. Do NOT edit files locked by other agents
2. Keep changes within the allowlist
3. Prefer small, reviewable checkpoints on multi-file work

### After Completing Work

1. Summarize changes in the task record or PR description
2. Provide a concise diff for review
3. Note any follow-up risks or open questions

## Conflict Resolution

If two agents modified the same file:
- Surface the conflict to the human owner
- Share the diffs and requested outcome
- Wait for resolution before reapplying changes

## File Lock Protocol

- A file is considered locked when an agent begins active work on it
- User can override any lock with explicit instruction

## Persistent Spec Rules

- Every spec MUST start with a TASK ID in the format `TASK-YYYY-MM-DD-A`.
- Every spec MUST include a Recommended Executor (Codex or VS Code Agent). This is advisory only.
- ChatGPT defaults to planning/spec writing.
- Claude Code implements ONLY when explicitly assigned by the human.

## Planning Constraint - Reuse First

See `docs/AGENTS.md` -> Planning Constraint - Reuse First.
