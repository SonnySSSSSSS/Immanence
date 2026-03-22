# CLAUDE.md

This file is the Claude-specific overlay for this repo.
`AGENTS.md` is the authoritative policy file for task format, authority, and implementation gates.
Use `docs/DOCS_INDEX.md` for the doc map and `ARCHITECTURE.md` for the current system map.

## Workspace

- Work only in `D:\Unity Apps\immanence-os`.
- Do not use `.claude-worktrees` or any git worktree path for active development.
- Run dev servers, verification, and backups from the main repo folder.

## Current Repo Snapshot

Checked against local files on 2026-03-21:

- frontend runtime: React 18 with Vite (`rolldown-vite`)
- major client state: Zustand stores under `src/state/` with offline-first persistence
- visual runtime: React Three Fiber 8.17.0 plus standard React surfaces
- auth: Supabase session auth in `src/components/auth/AuthGate.jsx` and `src/lib/supabaseClient.js` (required for app access)
- local AI integration: `/api/ollama` proxy in `vite.config.js` for local model inference
- deployment base: `/` in dev; `/Immanence/` as production base path for GitHub Pages hosting

## Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run lint      # Run linter, must pass before commit
npm run build     # Production build to dist/
npm run preview   # Test production build locally
npm run deploy    # Deploy to GitHub Pages at /Immanence/
```

## Local Setup

**Prerequisites:**

- Node 18+ and npm 9+
- Supabase project (free tier OK) with auth enabled
- Optional: local Ollama instance for AI features (defaults gracefully if unavailable)

**Environment variables** — create `.env.local`:

```sh
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**First run:**

```bash
npm install
npm run dev
```

App launches at `http://localhost:5173`. Auth gate will prompt login (sign up works with any email).

## Claude Workflow Notes

- Follow the active task spec from `AGENTS.md` before editing anything.
- Prefer the canonical entry docs first: `AGENTS.md`, `ARCHITECTURE.md`, and `docs/DOCS_INDEX.md`.
- Keep changes atomic. Do not expand the file scope beyond the allowlist.
- For multi-file behavior work, identify the actual source-of-truth store, helper, or service before editing the UI layer.
- For documentation work, update touched cross-references so they point to canonical files rather than duplicate summaries.

## Security Checklist

Before any production deployment, run `docs/PRODUCTION_SECURITY_CHECKLIST.md`.
It is the standing release gate for this project — covering secrets, auth, CORS, rate limiting, LLM prompt safety, observability, and scalability.
All Critical and High failures block release unless explicitly waived with reason, owner, and fix date.
A project-specific audit using this checklist already exists at `SECURITY_CHECKLIST.md` (root).

## High-Risk Surfaces

- `src/App.jsx` coordinates shell state, auth handoff, section navigation, overlays, and dev gates.
- `src/components/PracticeSection.jsx` owns the largest active-session flow.
- `src/state/offlineFirstUserStateKeys.js` defines the export and import boundary for core user state.
- `src/lib/devPanelGate.js` and `src/dev/uiDevtoolsGate.js` are separate production gates and should stay conceptually separate.
- `src/components/IndrasNet.jsx` has a dedicated protection doc at `docs/PARTICLE_SYSTEM_PROTECTION.md`; read that before changing display-mode behavior there.

## Common Pitfalls

- **Zustand state sync** — changes to `src/state/offlineFirstUserStateKeys.js` require localStorage key updates and migration logic. Test offline→online sync before merging.
- **WebGL context loss** — Three Fiber/WebGL can leak memory or lose context on repeated preset switches. Disable shadow maps and environment PMREM if WebGL errors appear (see v3.27.209 fix).
- **Auth gate timing** — Supabase session restore is async. Don't assume `user` is populated immediately after mount; use `useAuthUser()` hook and wait for auth ready.
- **Mobile viewport breakage** — test on 320px, 375px, 412px widths. Button touch targets must be 44px minimum. Use `npm run build && npm run preview` to test production sizes.
- **Stale component re-renders** — if a store change doesn't trigger a component update, check that the hook is reading the exact key being modified (not a parent object).

## Testing Strategy

- **Linting:** `npm run lint` must pass (enforced pre-commit). Catches unused vars, exhaustive deps, type errors.
- **Build:** `npm run build` must succeed. Catches bundle errors, missing imports, config issues.
- **Smoke tests:** Playwright suite in `tests/` covers Supabase auth (sign-up, sign-in, session restore), page navigation, and cross-user isolation.
- **Manual verification:** UI/behavior changes require runtime proof — dev server startup + visual inspection at target viewports (dev + 375px mobile).

## Verification Expectations

**Code changes:**
- Lint passes: `npm run lint` (0 errors, 0 warnings)
- Build succeeds: `npm run build` with no errors
- Dev server starts: `npm run dev` launches without errors
- Runtime proof: dev server startup + visual inspection on desktop + mobile viewport (375px minimum)
- High-risk surface changes: full manual test of affected flow (e.g., full auth cycle for AuthGate changes)

**Documentation-only work:**
- Verify all internal paths exist and are current (e.g., `docs/PARTICLE_SYSTEM_PROTECTION.md` for IndrasNet changes)
- Verify cross-references point to canonical files, not duplicates
- Check that doc dates are updated if content changes

**When in doubt:** lint + build + dev server launch + visual check. Build success alone is not sufficient.
