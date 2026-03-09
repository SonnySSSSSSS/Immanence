# CLAUDE.md

This file is the Claude-specific overlay for this repo.
`AGENTS.md` is the authoritative policy file for task format, authority, and implementation gates.
Use `docs/DOCS_INDEX.md` for the doc map and `ARCHITECTURE.md` for the current system map.

## Workspace

- Work only in `D:\Unity Apps\immanence-os`.
- Do not use `.claude-worktrees` or any git worktree path for active development.
- Run dev servers, verification, and backups from the main repo folder.

## Current Repo Snapshot

Checked against local files on 2026-03-09:

- frontend runtime: React 18 with Vite (`rolldown-vite`)
- major client state: Zustand stores under `src/state/`
- visual runtime: React Three Fiber plus standard React surfaces
- auth: Supabase auth is enabled in `src/components/auth/AuthGate.jsx` and `src/lib/supabaseClient.js`
- local AI integration: `/api/ollama` proxy in `vite.config.js`
- deployment base: `/` in development and `/Immanence/` for build and preview

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run preview
npm run deploy
```

## Claude Workflow Notes

- Follow the active task spec from `AGENTS.md` before editing anything.
- Prefer the canonical entry docs first: `AGENTS.md`, `ARCHITECTURE.md`, and `docs/DOCS_INDEX.md`.
- Keep changes atomic. Do not expand the file scope beyond the allowlist.
- For multi-file behavior work, identify the actual source-of-truth store, helper, or service before editing the UI layer.
- For documentation work, update touched cross-references so they point to canonical files rather than duplicate summaries.

## High-Risk Surfaces

- `src/App.jsx` coordinates shell state, auth handoff, section navigation, overlays, and dev gates.
- `src/components/PracticeSection.jsx` owns the largest active-session flow.
- `src/state/offlineFirstUserStateKeys.js` defines the export and import boundary for core user state.
- `src/lib/devPanelGate.js` and `src/dev/uiDevtoolsGate.js` are separate production gates and should stay conceptually separate.
- `src/components/IndrasNet.jsx` has a dedicated protection doc at `docs/PARTICLE_SYSTEM_PROTECTION.md`; read that before changing display-mode behavior there.

## Verification Expectations

- UI or behavior work needs runtime proof or surface verification. Build success alone is not enough.
- Documentation-only work should verify filenames, paths, and cross-references.
- When code changes affect production behavior, prefer `npm run lint` and `npm run build` unless the task is explicitly docs-only.
