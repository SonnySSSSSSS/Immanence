# Bundle Split Audit Plan

// PROBE:BUNDLE_SPLIT_PLAN:START

Date: 2026-03-25
Task: TASK-AUDIT-BUNDLE-SPLIT-PLAN
Scope: Analyze current production build output and propose safe chunking plan

## Build Command and Output Snapshot

Command run:

- `npm run build`

Build result:

- PASS (`✓ built in 4.56s`)

Warnings captured:

- `Some chunks are larger than 500 kB after minification.`
- Recommendation emitted by bundler: use dynamic `import()` and/or `build.rollupOptions.output.manualChunks`.

## Emitted Chunk Sizes (Notable)

- `dist/assets/index-Crw7FJsB.js`: 4,671.16 kB (gzip: 1,358.04 kB)  -> exceeds warning threshold
- `dist/assets/supabaseClient-CdtU4G93.js`: 164.21 kB (gzip: 43.02 kB)
- `dist/assets/DevPanel-D23WnmxO.js`: 109.32 kB (gzip: 16.18 kB)
- `dist/assets/WisdomSection-Dh2iOBcY.js`: 61.88 kB (gzip: 3.95 kB)
- `dist/assets/index-B5Uw2vFL.css`: 124.11 kB (gzip: 24.35 kB)

## Likely Causes

- The main app shell and high-dependency runtime still collapse into the large `index-*` chunk.
- Practice runtime dependencies are heavy and currently loaded through eagerly imported `PracticeSection` in `src/App.jsx`.
- Overlay infrastructure is centralized and loaded from app startup path, while some overlays are only needed conditionally.
- Shared utility/state modules may be pulled into the main chunk due to broad top-level imports in root surfaces.

## Ranked Split Strategies

### Strategy: Lazy-load `PracticeSection` from app root (highest impact)

- Target files likely affected:
  - `src/App.jsx`
  - `src/components/PracticeSection.jsx`
- Why: `PracticeSection` is a large runtime with many direct imports; deferring it can remove substantial weight from initial chunk.
- Risk level: Medium
- Primary risk: route/transition timing and first-open loading fallback UX.

### Strategy: Split auth/settings/account surfaces behind interaction gates

- Target files likely affected:
  - `src/components/AppShellOverlays.jsx`
  - `src/components/SettingsPanel.jsx`
  - `src/components/auth/AuthGate.jsx`
- Why: account and auth management logic is not required for all initial interaction paths once session is established.
- Risk level: Medium
- Primary risk: auth state timing regressions if module boundaries are split incorrectly.

### Strategy: Manual chunk grouping for large feature domains

- Target files likely affected:
  - `vite.config.js`
  - `src/components/PracticeSection.jsx`
  - `src/components/WisdomSection.jsx`
  - `src/components/DevPanel.jsx`
- Why: `manualChunks` can enforce stable domain chunks (`practice`, `wisdom`, `devtools`) to reduce monolithic main chunk pressure.
- Risk level: Medium-High
- Primary risk: cache churn and accidental duplication across forced chunk boundaries.

### Strategy: Isolate rarely used dev/debug overlays from production-critical path

- Target files likely affected:
  - `src/components/AppShellOverlays.jsx`
  - `src/components/DevPanel.jsx`
  - `src/components/debug/*`
- Why: dev-only or infrequently opened tooling should remain outside first-load graph.
- Risk level: Low
- Primary risk: minimal; mostly import-path hygiene and guard checks.

### Strategy: Audit and defer secondary visual systems in Practice runtime

- Target files likely affected:
  - `src/components/PracticeSection.jsx`
  - `src/components/practice/*`
  - `src/components/vipassana/*`
- Why: optional modes (specialized visuals/config panels) can be on-demand within practice flow instead of eager.
- Risk level: High
- Primary risk: behavior regressions in mode switching and session continuity.

## Recommended First Execution Order

- Lazy-load `PracticeSection` in `src/App.jsx`.
- Keep current `AppShellOverlays` but defer non-critical overlays via targeted lazy boundaries.
- Introduce conservative `manualChunks` only after measuring the effect of steps 1-2.
- Rebuild and compare chunk map after each step to avoid over-fragmentation.

// PROBE:BUNDLE_SPLIT_PLAN:END
