## Purpose

This file tells AI coding agents how to be immediately productive in Immanence OS.
Follow repository-specific rules, workflows, and examples — not generic advice.

## Quick start
- Dev server: `npm run dev` (opens at http://localhost:5175/Immanence/)
- Build: `npm run build`; Preview: `npm run preview`; Deploy: `npm run deploy`
- LLM (local) proxy: `/api/ollama` — see `docs/LLM_INTEGRATION.md` and `src/services/llmService.js`
- Lint: `npm run lint` (run before committing)

## Big picture (what to know first)
- Frontend-only, local-first React app (Vite + React 19, using `rolldown-vite@7.2.5`). Entry: `src/App.jsx`.
- State: many small Zustand stores under `src/state/` using `persist` middleware (localStorage keys prefixed `immanenceOS.*` or `immanence-*`).
- Major sections in `App.jsx`: `PracticeSection`, `WisdomSection`, `ApplicationSection`, `NavigationSection`.
- 3D/avatar code lives in `src/components/*` (protected files listed below).
- Build version format: `v3.25.62` (major.minor.patch) located around line 384 in `src/App.jsx`.

## Essential patterns & conventions
- **Increment build version**: after ANY code change, update the patch version (last digit) in `src/App.jsx` around line 384.
- **Small, focused edits only**: Avoid broad refactors unless explicitly assigned.
- **Single-line anchors**: Use minimal diffs — do NOT perform multi-line blind replacements.
- **Task specification**: All tasks must supply: Goal, Allowlist (files to modify), Denylist, Constraints, Verification steps, Commit message. See `docs/AGENTS.md`.
- **Reuse First**: Before creating new components, list existing ones and explicitly state reuse decision (see `docs/AGENTS.md` Planning Constraint).
- **Working directory**: ALWAYS work in `D:\Unity Apps\immanence-os` — NEVER use `.claude-worktrees/` folders.

## Protected files (show diff first, wait for approval)
- `src/components/Avatar.jsx`
- `src/components/MoonOrbit.jsx`
- `src/components/MoonGlowLayer.jsx`

## LLM & verification
- Ollama is expected locally (`ollama`); recommended model `gemma3:1b`. Pull with `ollama pull gemma3:1b`.
- LLM calls go through `src/services/llmService.js`. Tests and quick checks available in DevPanel (Ctrl+Shift+D) → LLM Test Panel.
- Use dev panel tests and browser visual checks when changing visuals or flows (DevPanel is canonical verification UI).

## Where to make specific changes (examples)
- Add a new practice type: `src/data/practiceFamily.js` → component in `src/components/` → session logic in `practiceStore.js` → register in `PracticeSection.jsx` (see `docs/DEVELOPMENT.md`).
- Update LLM prompts: edit `src/services/llmService.js` and verify via DevPanel → LLM Test Panel.
- Add Zustand store: `src/state/{name}Store.js` with `persist` middleware and unique storage key.

## Build & troubleshooting notes
- Vite uses a base path `/Immanence/` (see `vite.config.js`) — verify routing when previewing or deploying.
- Dev mode uses base `/`, production uses `/Immanence/` to avoid MIME-type errors with double-base paths.
- If dev server fails: remove `node_modules/.vite` and restart: `rm -rf node_modules/.vite && npm run dev`.
- Ollama troubleshooting: `ollama list`, `ollama --version`, ensure `http://localhost:11434` reachable.
- Port conflicts: Expected port is `5175`. If server starts on `5174+`, another process is holding the port — run reset scripts.
- Protected patterns: Particle system in `IndrasNet.jsx` uses 3-layer protection (React `key` prop critical) — see `docs/PARTICLE_SYSTEM_PROTECTION.md`.

## Commit & verification checklist
1. Include a concise commit message describing goal and verification steps.
2. Increment version in `src/App.jsx` (patch digit).
3. Run `npm run lint` and `npm run dev` (visual smoke test).
4. Run DevPanel verifications relevant to change (LLM tests, Avatar previews, Data Management).

## Task-sizing rules for agents
- Prefer reuse and small extensions. When proposing multiple-file refactors include explicit rollback/verifications.
- Do not modify locked/protected files unless task explicitly allows and human approves.

## Where to look for more context
- Project README: `README.md` (root)
- Architecture and development rules: `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/LLM_INTEGRATION.md`, `docs/AGENTS.md`, `CLAUDE.md`.

If anything here is unclear or you want more examples (e.g., common single-line anchors or a sample task spec), tell me which area and I'll expand.

