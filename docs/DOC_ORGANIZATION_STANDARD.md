# Documentation Organization Standard

**For: Immanence OS & Multi-Agent Collaboration**

This standard ensures all documentation is organized, discoverable, and optimized for AI agents working across the codebase.

---

## Principles

1. **Single Source of Truth**: One primary doc per topic; cross-reference only when necessary
2. **Agent-First Design**: Docs are written to help agents be productive immediately, not for human reading primarily
3. **Discoverable Naming**: Doc names reveal purpose; no "scratch" or "misc" docs
4. **Consistent Structure**: All docs follow the same hierarchy and section format
5. **Linked Ecosystem**: Clear reference paths between related docs
6. **Versioned & Dated**: Important docs include version/date info for context

---

## Document Categories & Purposes

### Tier 1: Entry Points (What agents read first)

These files orient agents to the codebase:

| File | Purpose | Audience |
|------|---------|----------|
| `.github/copilot-instructions.md` | AI agent quick-start (30–50 lines). Architecture, patterns, verification steps | Claude/Copilot/Deprecated / Historical |
| `CLAUDE.md` | Project philosophy, rules, command reference | All agents |
| `docs/AGENTS.md` | Authority chain, task specs, reuse-first planning | All agents |
| `README.md` | Public overview, feature list, setup instructions | Humans + agents |

**How agents use Tier 1:**
- Start with `.github/copilot-instructions.md` → 5 minutes to understand big picture
- Reference `CLAUDE.md` for rules/state keys
- Reference `docs/AGENTS.md` for task format & planning constraint
- Reference `README.md` for context only if confused

---

### Tier 2: Architecture & Reference (Deep dive)

These docs explain "how things work" across the system:

| File | Purpose | Scope | When to read |
|------|---------|-------|--------------|
| `docs/ARCHITECTURE.md` | Component ownership, store wiring, data flows | Full app | Understanding data flow or modifying multiple files |
| `docs/DEVELOPMENT.md` | Setup, scripts, state persistence, troubleshooting | Development environment | Setting up dev or fixing build issues |
| `docs/LLM_INTEGRATION.md` | Ollama setup, API reference, validation functions | LLM subsystem | Modifying Four Modes or validation logic |
| `docs/CYCLE_SYSTEM.md` | Consistency cycles, checkpoints, mode switching | Cycle feature | Modifying cycle/streak tracking |
| `docs/PHILOSOPHY.md` | Design principles, why constraints exist | Project intent | Understanding "why" behind decisions |

**How agents use Tier 2:**
- Read before major refactors across multiple stores
- Reference when modifying data flow or component hierarchy
- Cite for justification when making architectural decisions

---

### Tier 3: Feature Specifics (Narrowly scoped)

These docs explain specific subsystems or features:

| File | Purpose | Scope | When to read |
|------|---------|-------|--------------|
| `docs/AVATAR_SYSTEM.md` | Avatar rendering, stage/path/attention axes | Avatar component | Modifying Avatar.jsx or related |
| `docs/INTEGRATION.md` | Multi-AI workflow, cross-agent handoff | Development workflow | Working with multiple agents |
| `docs/MULTI_AI_WORKFLOW.md` | Agent roles, task routing | Team coordination | Assigning tasks to different agents |
| `docs/HOW-TO-USE-SAFELY.md` | User-facing safety guidelines | UX | Feature changes affecting users |
| `docs/4 Modes User Manual.md` | End-user guide for Four Modes training | UX reference | Understanding feature from user POV |

**How agents use Tier 3:**
- Reference when modifying specific subsystem
- Use to understand feature context before coding
- Link from Tier 2 docs for detailed reference

---

### Tier 4: Task Logs & Changelogs (Historical)

These docs track work and changes:

| File | Pattern | Purpose | Audience |
|------|---------|---------|----------|
| `CHANGELOG.md` | Maintained | Version history + breaking changes | Agents doing releases/versioning |
| `Deprecated / Historical` | Maintained | Recent work summary + blockers | Agents picking up work |
| `TASK-{DATE}-{ID}.md` | Task-specific | Single task spec + outcome | Assigned agent + reviewer |
| `PROJECT_STATUS.md` | Maintained | Current phase, blockers, next steps | All agents |

**How agents use Tier 4:**
- Check `Deprecated / Historical` before starting to see recent context
- Reference `CHANGELOG.md` when versioning
- File new `TASK-{DATE}-{ID}.md` for complex multi-step work
- Check `PROJECT_STATUS.md` for current priorities

---

### Tier 5: Scratch / Experimental (Transient)

These docs are work-in-progress or exploratory:

| Pattern | Purpose | Cleanup |
|---------|---------|---------|
| `{topic}_DRAFT.md` | Experimental ideas | Delete when decision made |
| `{topic}_RESEARCH.md` | Research notes, not canonical | Archive or delete monthly |
| `FOR_*.md` (e.g., `FOR_Deprecated / Historical.md`) | One-off notes for specific agent | Delete after task completion |

**Guideline**: Delete or archive transient docs monthly. They should not accumulate.

---

## Document Structure Template

All Tier 1–3 docs should follow this structure:

```markdown
# [Topic Name]

**Last Updated**: [DATE] | **Version**: [NUMBER or N/A] | **Audience**: [Agents/Humans/Both]

## Purpose

[1–2 sentences explaining what this doc covers and when to read it]

---

## Quick Reference

[If needed: table, checklist, or command list for fast lookup]

---

## Core Concept

### [Major Section]

[Explanation of concept with examples]

#### [Subsection]

[Details, code examples, or specifications]

---

## Common Tasks / Workflows

### Task: [Specific action agents might do]

[Step-by-step process with references to relevant files/stores]

---

## Related Docs

- [Link to Tier 2/3 docs]
- [Link to AGENTS.md for task specs]

---

## Troubleshooting

[Common errors and resolutions specific to this topic]
```

---

## Naming Conventions

### DO

- ✅ `ARCHITECTURE.md` — Clear, topic-centered
- ✅ `CYCLE_SYSTEM.md` — Descriptive, specific
- ✅ `AVATAR_SYSTEM.md` — Feature-specific
- ✅ `TASK-2026-01-10-A.md` — Date + ID for task logs
- ✅ `docs/LLM_INTEGRATION.md` — Underscore separates words

### DON'T

- ❌ `notes.md` — Too generic
- ❌ `misc-stuff.md` — Ambiguous
- ❌ `todo.md` — Use Deprecated / Historical instead
- ❌ `backup_architecture.md` — Use version control for old versions
- ❌ `TEMP_FIX.md` — Too transient; file as TASK instead

---

## Cross-Referencing Guide

### From Agent Entry Points

`.github/copilot-instructions.md` → 
- Links to `docs/AGENTS.md` (task specs)
- Links to `docs/ARCHITECTURE.md` (deep dives)
- Links to `docs/DEVELOPMENT.md` (commands)
- Links to `docs/LLM_INTEGRATION.md` (LLM setup)

### From CLAUDE.md

- Links to `docs/AGENTS.md` (authority, planning)
- Links to `docs/DEVELOPMENT.md` (setup)
- Links to state store docs (cycle, avatar, etc.)

### From Tier 2 Docs (ARCHITECTURE.md, DEVELOPMENT.md, etc.)

- Links to Tier 3 feature docs (AVATAR_SYSTEM.md, CYCLE_SYSTEM.md, etc.)
- Links to `docs/AGENTS.md` (for task templates)
- Links to `Deprecated / Historical` (recent changes)

### From Tier 3 Feature Docs

- Links back to relevant Tier 2 docs
- Links to source files (via line numbers)
- Links to Tier 4 task logs if applicable

### From Task Logs (TASK-{DATE}-{ID}.md)

- Links to relevant feature/architecture docs
- Links to CHANGELOG.md (if versioned)
- Links to specific source files modified

---

## Maintenance Schedule

| Action | Frequency | Owner |
|--------|-----------|-------|
| Update Deprecated / Historical | After each major change | Current agent |
| Update PROJECT_STATUS.md | Weekly or phase-end | Project lead |
| Prune transient docs (`*_DRAFT.md`, `FOR_*.md`) | Monthly | Project lead |
| Review & update CHANGELOG.md | Per release | Project lead |
| Refresh `.github/copilot-instructions.md` | Quarterly or major arch change | Project lead |
| Archive completed TASK logs | Quarterly | Project lead |

---

## Enforcement

### For Agents

✅ **DO:**
- Start with `.github/copilot-instructions.md`
- Reference Tier 2 docs before making multi-file changes
- File new TASK logs for complex work
- Link to docs when explaining decisions

❌ **DON'T:**
- Create new generic docs without approval
- Leave `*_DRAFT.md` or `FOR_*.md` files uncleaned
- Modify Tier 1–2 docs without understanding ownership (see AGENTS.md)

### For Project Lead

✅ **DO:**
- Maintain Deprecated / Historical and PROJECT_STATUS.md
- Review Tier 1–2 docs quarterly
- Assign doc ownership in complex features
- Prune transient docs monthly

---

## Migration Path (For Existing Docs)

If you have scattered docs, migrate using this priority:

1. **Keep Tier 1**: `.github/copilot-instructions.md`, `CLAUDE.md`, `docs/AGENTS.md`, `README.md`
2. **Keep Tier 2**: `ARCHITECTURE.md`, `DEVELOPMENT.md`, `LLM_INTEGRATION.md`
3. **Consolidate Tier 3**: Merge smaller feature docs into subsections of ARCHITECTURE.md or feature-specific files
4. **Archive Tier 4**: Move old task logs to `docs/archive/` folder
5. **Delete Tier 5**: Remove or archive all `*_DRAFT.md`, `FOR_*.md`, `TEMP_*.md` files

---

## Example: Adding a New Feature

When implementing a new feature across multiple files:

1. **Write a TASK log** (`docs/TASK-2026-01-15-A.md`)
   - Links to existing docs showing where changes go
   - Lists Allowlist/Denylist files
   - References Tier 2 docs for context

2. **Update relevant Tier 3 docs** (if new subsystem)
   - Create `docs/{FEATURE}_SYSTEM.md` if warranted
   - Or add subsection to `docs/ARCHITECTURE.md`

3. **Update `.github/copilot-instructions.md`** (if affects patterns)
   - Add to "Where to make specific changes" section
   - Add code examples if new pattern

4. **Update Deprecated / Historical** (as you work)
   - Note progress and blockers

5. **Update CHANGELOG.md** (on release)
   - Document breaking changes or major features

---

## Quick Start: Setting Up Docs for New Project

If starting a new project using this standard:

```bash
# Create Tier 1 (entry points)
touch .github/copilot-instructions.md
touch CLAUDE.md
touch docs/AGENTS.md
touch README.md

# Create Tier 2 (architecture reference)
touch docs/ARCHITECTURE.md
touch docs/DEVELOPMENT.md
touch docs/PHILOSOPHY.md

# Create Tier 4 (logs)
touch Deprecated / Historical
touch PROJECT_STATUS.md
touch CHANGELOG.md

# Create archive for old task logs
mkdir -p docs/archive/
```

Then fill each file using the **Document Structure Template** above.

---

## Questions?

If doc organization is unclear, refer to:
- `.github/copilot-instructions.md` — Quick overview
- `docs/AGENTS.md` — Authority & file ownership
- This file — Full standard with examples

