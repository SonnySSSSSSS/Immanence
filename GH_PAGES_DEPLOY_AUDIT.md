AUDIT_PROBE_GH_PAGES_DEPLOY_V1
// PROBE:GH_PAGES_DEPLOY_AUDIT:START

# GH Pages Deploy Audit (repo-only)

Goal: determine why GitHub Pages serves a different app than local by auditing this repo’s Pages publishing source, build base path, router behavior, and build-time env/flags (no code/deploy changes).

---

## Deployed URL and expected subpath

- Repo declares the intended Pages URL as `https://SonnySSSSSSS.github.io/Immanence` via `package.json:5`.
- Vite production base is configured as `/Immanence/` via `vite.config.js:29`.
- Therefore the expected deployed app root is `https://SonnySSSSSSS.github.io/Immanence/` (note trailing slash) and asset URLs are expected to be rooted under `/Immanence/…` (example from a local build: `dist/index.html:37-38`).

---

## How Pages is deployed in this repo

This repo contains **two distinct deployment mechanisms** that can both plausibly control what GitHub Pages serves:

### Mechanism 1 — GitHub Actions → Pages artifact deploy (builds on `main`)

- Two workflows exist and both trigger on push to `main`:
  - `.github/workflows/deploy.yml:3-6` and `.github/workflows/pages.yml:3-6`.
- Both run `npm ci` then `npm run build`, then deploy **the `dist/` directory** using `actions/upload-pages-artifact` + `actions/deploy-pages`:
  - `.github/workflows/deploy.yml:30-46` + `.github/workflows/deploy.yml:42-46` + `.github/workflows/deploy.yml:54-56`.
  - `.github/workflows/pages.yml:42-52` + `.github/workflows/pages.yml:60-62`.

Implication:
- If the repo’s GitHub Pages setting is “Source: GitHub Actions”, then the live site should track `main` on each push (subject to workflow success).

### Mechanism 2 — Branch publish via `gh-pages` branch (manual/CLI deploy)

- `npm run deploy` is defined as `node scripts/deploy-gh-pages.mjs --no-build` in `package.json:16-18`.
- `scripts/deploy-gh-pages.mjs` defaults to publishing `dist/` to the `gh-pages` branch (`distDir: 'dist'`, `branch: 'gh-pages'`) in `scripts/deploy-gh-pages.mjs:60-66`, and force-pushes that orphan branch in `scripts/deploy-gh-pages.mjs:109-126`.
- `DEPLOY_FIX.md` explicitly references the repository Pages settings being set to `gh-pages` branch (`DEPLOY_FIX.md:223-228`).

Implication:
- If GitHub Pages is configured as “Deploy from a branch” and points at `gh-pages`, the live site will **not** update when `main` changes unless a deploy is performed that updates `gh-pages`.

---

## Build output location (what folder is published)

### Vite output folder

- No custom `build.outDir` is set in `vite.config.js:15-45`, so Vite’s default build output directory is `dist/`.
- `dist/` is also listed in `.gitignore` (`.gitignore:11-13`), meaning the build output is typically not committed on `main`.

### What each deploy mechanism publishes

- GitHub Actions workflows publish `./dist` (`.github/workflows/deploy.yml:42-46`, `.github/workflows/pages.yml:48-52`).
- The manual deploy script copies `dist/*` into a temporary repo root and pushes it to the `gh-pages` branch root (`scripts/deploy-gh-pages.mjs:103-126`).

---

## Vite base path check (production `base`)

- `vite.config.js` sets `base` based on `mode`:
  - Dev: `/`
  - Non-dev (build/preview): `/Immanence/`
  - Evidence: `vite.config.js:22-30`.

What this means:
- Local `npm run dev` serves as if at `/` (dev server), while production build emits asset URLs under `/Immanence/…`.
- A “wrong app” symptom can happen if the deployed site is **not** actually serving the production build output (for example: serving source `index.html` or an older/stale build).

---

## Router subpath/deep link check (Pages + SPA behavior)

- The app does **not** use React Router; it does simple pathname inspection in `src/main.jsx:25-36`.
- It has a special-case route for `/trace` and `/Immanence/trace` by checking `path.endsWith('/trace')` (`src/main.jsx:31-34`).

Key GH Pages difference vs local dev:
- Vite dev server provides SPA fallback for deep links; GitHub Pages is a static host and will 404 on unknown paths unless you provide a fallback (commonly a `404.html` that boots the SPA).
- There is no `dist/404.html` or `public/404.html` in the current tree (verified by folder contents; `dist/` contains `index.html` but no `404.html`).

If the “wrong app” report is actually “I navigate directly to a deep link and I don’t see the app”, this is a strong candidate: local dev deep links work; GH Pages deep links can 404 without a fallback.

---

## Env/flags divergence check (local vs production build)

### Auth / Supabase enablement is not environment-driven

- `ENABLE_AUTH` is a hardcoded constant in multiple client files:
  - `src/lib/supabaseClient.js:4-7`
  - `src/components/auth/AuthGate.jsx:2-5`
  - `src/components/SettingsPanel.jsx:6-9`
- `.env.local` defines `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (`.env.local:1-2`), but current client code uses hardcoded values instead of `import.meta.env` (`src/lib/supabaseClient.js:5-7`).

Implication:
- A local-vs-prod mismatch is **unlikely** to be caused by different `ENABLE_AUTH` / Supabase env at build time, because the relevant values are constants in source.

### Other build-time differences that *can* diverge

- `import.meta.env.BASE_URL` is used throughout the app to build asset URLs, and it will differ between dev (`/`) and production (`/Immanence/`) because of `vite.config.js:29`.
- `import.meta.env.DEV` gates dev-only behavior (for example dev panel gating in `src/lib/devPanelGate.js:35-42` and dev-only routing in `src/main.jsx:28-35`).
- LLM proxy URL can diverge: `src/services/llmService.js:5-7` reads `import.meta.env.VITE_LLM_PROXY_URL` (when not using Ollama).

### On-screen build stamp to confirm what build is running

- The production build injects `__DEPLOY_GIT_SHA__` and `__DEPLOY_BUILD_TIME__` in `vite.config.js:6-12` and `vite.config.js:30-35`.
- The UI renders this build stamp overlay in `src/App.jsx:622-636`.

This is the fastest way to prove which commit is actually being served on GitHub Pages.

---

## Conclusion: A (wrong artifact) vs B (prod build differs)

**Root Cause: (A) wrong artifact is being published (stale `gh-pages` output / non-Actions Pages source).**

Evidence chain:

1) This repo includes a fully documented branch-based Pages deployment flow that expects Pages to be set to the `gh-pages` branch (`DEPLOY_FIX.md:223-228`) and a deploy script that force-pushes the `gh-pages` branch (`scripts/deploy-gh-pages.mjs:109-126`, `package.json:16-18`).

2) The `gh-pages` branch is materially behind `main` in this local clone:
- `main` latest commit date (local): `git log -1 refs/heads/main` shows **Feb 27, 2026**.
- `gh-pages` latest commit date (local): `git log -1 refs/heads/gh-pages` shows **Feb 9, 2026**.

If GitHub Pages is currently configured to “Deploy from branch: `gh-pages`”, the live site will reflect the Feb 9 build even though local `main` reflects Feb 27 changes — matching the reported “GH Pages app differs from local”.

Why not (B):
- Auth flags and Supabase values are hardcoded in source (`src/lib/supabaseClient.js:4-7`, `src/components/auth/AuthGate.jsx:2-5`), so a build-time env divergence is not the primary suspect for “different app”.
- The major dev/prod differences that do exist (`BASE_URL`, `DEV` gating) are expected and intentional (`vite.config.js:22-30`), and they don’t explain “a different app” as strongly as a stale publish source does.

---

## Minimal fix plan (do not implement here)

Pick exactly one Pages publishing mechanism and make it the single source of truth:

1) **If you want GitHub Actions to control Pages**
- In GitHub repo settings → Pages, set Source to “GitHub Actions”.
- Keep only one Pages workflow (delete/disable the duplicate between `.github/workflows/pages.yml` and `.github/workflows/deploy.yml`).
- Stop using branch-based deploy (`npm run deploy`) or clearly label it as legacy.

2) **If you want `gh-pages` branch to control Pages**
- In GitHub repo settings → Pages, set Source to “Deploy from a branch”, Branch = `gh-pages` (root).
- Ensure every desired release runs the deploy flow that updates `gh-pages` (per `package.json:16-18` + `scripts/deploy-gh-pages.mjs:109-126`).
- Remove/disable GitHub Actions Pages deploy workflows to prevent confusion.

Separately (deep links):
- If you need direct navigation to deep links like `/Immanence/trace`, add a GH Pages SPA fallback (typically a `404.html` that loads the app) so GH Pages serves the SPA for non-file routes.

// PROBE:GH_PAGES_DEPLOY_AUDIT:END
