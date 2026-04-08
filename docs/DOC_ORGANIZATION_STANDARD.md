# Documentation Organization Standard

**Scope**: `immanence-os` documentation structure and maintenance rules.
**Last Updated**: 2026-04-08

## Principles

1. Keep one canonical doc per topic.
2. Prefer root-level canonical policy and architecture docs over duplicates.
3. Treat archive content as historical reference, not current source of truth.
4. Keep task specs and status pages current, minimal, and linked from the docs index.

## Canonical Sources

- Policy: `AGENTS.md` (repo root)
- Architecture map: `ARCHITECTURE.md` (repo root)
- Docs map: `docs/DOCS_INDEX.md`
- Operational log: `docs/WORKLOG.md`
- Release history: `docs/CHANGELOG.md`

## Directory Roles

- `docs/`: active documentation only
- `docs/archive/`: historical snapshots and superseded specs
- `docs/assets/`: doc-specific assets and references
- `docs/Future Features/`: exploratory material not yet committed as active spec

## Task-Spec Handling

1. Keep only active task specs in `docs/`.
2. Move completed task specs to `docs/archive/TASKS/`.
3. Remove broken task links from active index docs immediately.
4. Keep task filenames in `TASK-YYYY-MM-DD-X.md` format.

## Update Workflow

1. Update the target doc.
2. Update `docs/DOCS_INDEX.md` if entry points changed.
3. Confirm all referenced files exist.
4. Preserve archive files unless the task explicitly targets archive cleanup.

## Naming Rules

- Use descriptive uppercase snake-style filenames for system docs (for example `CYCLE_SYSTEM.md`).
- Use plain lowercase only when already established (`dev-workflow.md`, `font-system.md`).
- Avoid generic names such as `notes.md`, `misc.md`, `temp.md`.

## Minimum Metadata For Core Docs

Include at least:

- Purpose line
- Last updated date
- Explicit links to related canonical docs

## Pruning Rules

1. Remove or revise stale "outdated/deprecated" banners once replacements exist.
2. Remove references to files that no longer exist in `docs/`.
3. Convert outdated "next steps" lists into either:
   - an active task spec in `docs/`, or
   - a historical note in `docs/archive/`.

## Quick Audit Commands

```powershell
rg -n "TASK-20|outdated|deprecated|TODO" docs --glob "!docs/archive/**"
rg --files docs
```
