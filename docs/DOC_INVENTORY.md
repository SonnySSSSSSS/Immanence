# Documentation Inventory & Migration Map

**Purpose**: Organize existing docs against the new standard; identify gaps and cleanup needs.

**Last Updated**: 2026-03-22

---

## Tier 1: Entry Points

| File | Status | Notes |
|------|--------|-------|
| `.github/copilot-instructions.md` | ✅ Ready | Updated with examples, diagrams, photic description |
| `CLAUDE.md` | ✅ Ready | Covers rules, commands, architecture overview |
| `AGENTS.md` (root) | ✅ Ready | Defines authority, task specs, reuse-first |
| `README.md` | ✅ Ready | Feature overview + setup |

---

## Tier 2: Architecture & Reference

| File | Status | Notes |
|------|--------|-------|
| `ARCHITECTURE.md` (root) | ✅ Ready | Canonical system map — use this. `docs/ARCHITECTURE.md` is legacy, retained for reference only. |
| `docs/DEVELOPMENT.md` | ✅ Ready | Setup, scripts, state persistence |
| `docs/LLM_INTEGRATION.md` | ✅ Ready | LLM proxy setup, validation functions, API |
| `docs/PHILOSOPHY.md` | ✅ Ready | Design principles, core philosophy |
| `docs/DOC_ORGANIZATION_STANDARD.md` | ✅ NEW | Standard for organizing all docs across agents |

---

## Tier 3: Feature Specifics

| File | Status | Tier 2 Ref | Notes |
|------|--------|-----------|-------|
| `docs/AVATAR_SYSTEM.md` | ✅ Ready | ARCHITECTURE.md | Avatar rendering, stage/path/attention axes |
| `docs/CYCLE_SYSTEM.md` | ✅ Ready | ARCHITECTURE.md | Consistency cycles, checkpoints |
| `docs/INTEGRATION.md` | ✅ Ready | — | Multi-AI workflow |
| `docs/INTEGRATION.md` | ✅ Ready | — | Multi-AI workflow (see INTEGRATION.md) |
| `docs/HOW-TO-USE-SAFELY.md` | ✅ Ready | — | User-facing safety |
| `docs/4 Modes User Manual.md` | ✅ Ready | — | End-user Four Modes guide |
| `docs/BASELINE_*.md` (3 files) | 🟡 Unclear | — | Avatar baseline selection — needs review |
| `docs/AVATAR_*.md` (5 files) | 🟡 Unclear | AVATAR_SYSTEM.md | Avatar implementation specs — may consolidate |
| `docs/SESSION_SUMMARY_FIX.md` | 🟡 Old | — | Old task log — archive or delete? |
| `docs/attention-axis-logic.md` | 🟡 Unclear | AVATAR_SYSTEM.md | Appears to be subsection of AVATAR — consider consolidation |

---

## Tier 4: Task Logs & Changelogs

| File | Status | Notes |
|------|--------|-------|
| `CHANGELOG.md` | ✅ Ready | Version history + breaking changes |
| `Deprecated / Historical` | ✅ Ready | Recent work summary |
| `PROJECT_STATUS.md` | ✅ Ready | Current phase, blockers, next steps |
| `TASK-2026-01-05-A.md` → `E.md` | ✅ Ready | 5 recent task logs — good examples |
| `TASK-2026-01-07-A.md` | ✅ Ready | Recent task log |

---

## Tier 5: Scratch / Experimental (CLEANUP NEEDED)

| File | Status | Action |
|------|--------|--------|
| `docs/DOCUMENTATION_AUDIT.md` | 🔴 Transient | Review & delete if completed |
| `docs/FOR_Deprecated / Historical.md` | 🔴 Transient | Delete (task-specific notes) |
| `PHASE_2_*.md` (3 files) | 🔴 Transient | Archive to `docs/archive/` — historical handoff docs |

---

## Consolidation Opportunities

### AVATAR subsystem (5+ files)

Current:

- `docs/AVATAR_SYSTEM.md` (core)
- `docs/AVATAR_ANIMATION_IMPLEMENTATION.md` (spec)
- `docs/AVATAR_CONTAINER_CORE_SPEC.md` (spec)
- `docs/AVATAR_CONTRACT.md` (interface)
- `docs/AVATAR_JEWEL_SPEC.md` (feature)
- `docs/AVATAR_RETROFIT.md` (work log)
- `docs/attention-axis-logic.md` (logic)
- `docs/BASELINE_*.md` (3 files, baseline selection)

**Recommendation**: Consolidate into two docs:

1. `docs/AVATAR_SYSTEM.md` — Main reference (merge CONTRACT, ANIMATION, JEWEL, attention-axis)
2. `docs/AVATAR_IMPLEMENTATION.md` — Spec-level detail (CONTAINER_CORE_SPEC, BASELINE_*)

**Action**:

- [ ] Review each file's content
- [ ] Merge into consolidated structure
- [ ] Delete or archive redundant files
- [ ] Update cross-references in ARCHITECTURE.md

### Task Logs (6 files)

Currently in root `docs/`:

- `TASK-2026-01-05-A.md` → `E.md`
- `TASK-2026-01-07-A.md`

**Recommendation**: Keep recent (< 3 months) in `docs/`, archive older to `docs/archive/TASKS/`

**Action**:

- [ ] Create `docs/archive/TASKS/` folder
- [ ] Move completed/old task logs
- [ ] Link from Deprecated / Historical to archive for historical reference

### Historical Phase Docs (3 files)

- `PHASE_2_HANDOFF.md`
- `PHASE_2_IMPLEMENTATION.md`
- `PHASE_2_INTEGRATION_COMPLETE.md`

**Recommendation**: Archive to `docs/archive/PHASES/` for historical reference

**Action**:

- [ ] Create `docs/archive/PHASES/` folder
- [ ] Move phase docs
- [ ] Update CHANGELOG.md with reference

---

## Setup Archive Folders

```bash
mkdir -p docs/archive/TASKS
mkdir -p docs/archive/PHASES
mkdir -p docs/archive/SPECS

# Git commands to move & track
git mv docs/TASK-*.md docs/archive/TASKS/ 2>/dev/null || true
git mv docs/PHASE_2_*.md docs/archive/PHASES/ 2>/dev/null || true
git add docs/archive/
git commit -m "refactor: organize docs into archive structure per DOC_ORGANIZATION_STANDARD"
```

---

## Quick Reference: Where to Find What

### As an agent starting on the Immanence OS codebase

1. **First 5 minutes**: Read `.github/copilot-instructions.md`
2. **Before major changes**: Skim `ARCHITECTURE.md` (root) + `AGENTS.md` (root)
3. **For specific feature**: Jump to relevant Tier 3 doc (AVATAR_SYSTEM.md, CYCLE_SYSTEM.md, etc.)
4. **For task context**: Check Deprecated / Historical + PROJECT_STATUS.md
5. **When stuck**: Reference `docs/DOC_ORGANIZATION_STANDARD.md` (this folder structure)

### As a project lead coordinating agents

1. **Daily standup**: Check `Deprecated / Historical`
2. **Planning**: Review `PROJECT_STATUS.md` + `CHANGELOG.md`
3. **Architecture decisions**: Delegate to `docs/AGENTS.md` (planning constraint)
4. **Docs health**: Monthly prune transient docs + archive old tasks

---

## Next Steps

1. ✅ **Completed**: `.github/copilot-instructions.md` (enhanced)
2. ✅ **Completed**: `docs/DOC_ORGANIZATION_STANDARD.md` (created)
3. ✅ **Completed**: This inventory (`docs/DOC_INVENTORY.md`, created)
4. 📋 **TO DO**: Consolidate AVATAR subsystem docs (review all 5+ files, merge, delete redundant)
5. 📋 **TO DO**: Archive old PHASE_2_*.md docs
6. 📋 **TO DO**: Set up `docs/archive/` folder structure
7. 📋 **TO DO**: Clean up `FOR_Deprecated / Historical.md` and `DOCUMENTATION_AUDIT.md`

---

## Document Ownership

| Category | Owner | Update Frequency |
|----------|-------|------------------|
| Tier 1 (Entry points) | Project Lead | Quarterly |
| Tier 2 (Architecture) | Project Lead + Senior Dev | On major changes |
| Tier 3 (Features) | Feature Owner + Team | As needed |
| Tier 4 (Logs) | Current Agent | Per change + weekly lead review |
| Tier 5 (Scratch) | Current Agent | Monthly prune |

---

## Questions?

Refer to `docs/DOC_ORGANIZATION_STANDARD.md` for full rationale and examples.
