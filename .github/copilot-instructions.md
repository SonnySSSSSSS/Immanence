## Purpose

This file tells AI coding agents how to be immediately productive in Immanence OS.
Follow repository-specific rules, workflows, and examples — not generic advice.

## Quick start
- Dev server: `npm run dev` (opens at http://localhost:5175/Immanence/)
- Build: `npm run build`; Preview: `npm run preview`; Deploy: `npm run deploy`
- LLM (local) proxy: `/api/ollama` — see `docs/LLM_INTEGRATION.md` and `src/services/llmService.js`

## Big picture (what to know first)
- Frontend-only, local-first React app (Vite + React 19). Entry: `src/App.jsx`.
- State: many small Zustand stores under `src/state/` using `persist` (localStorage keys listed in `docs/DEVELOPMENT.md` and `CLAUDE.md`).
- Major sections in `App.jsx`: `PracticeSection`, `WisdomSection`, `ApplicationSection`, `NavigationSection`.
- 3D/avatar code lives in `src/components/*` (protected files listed below).

## Essential patterns & conventions
- Increment build version: after any code change update the patch version string in `src/App.jsx`.
- Small, focused edits only. Avoid broad refactors unless explicitly assigned.
- Use single-line anchors or minimal diffs — do NOT perform multi-line blind replacements.
- All tasks must supply: Goal, Allowlist (files to modify), Denylist, Constraints, Verification steps, Commit message. See `docs/AGENTS.md`.
- Follow "Planning Constraint — Reuse First": list existing components and explicitly state reuse decision before creating new components.

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
- If dev server fails: remove `node_modules/.vite` and restart: `rm -rf node_modules/.vite && npm run dev`.
- Ollama troubleshooting: `ollama list`, `ollama --version`, ensure `http://localhost:11434` reachable.

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
