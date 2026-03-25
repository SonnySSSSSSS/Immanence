# Refactor Stabilization Baseline

// PROBE:STABILIZATION_BASELINE:START

Date: 2026-03-25
Workspace: D:/Unity Apps/immanence-os
Task: TASK-STABILIZE-BASELINE-VERIFY

## Verification Commands and Outcomes

### Command: `npm run build`

- Outcome: PASS (exit code 0)
- Key output:
  - `rolldown-vite v7.2.5 building client environment for production...`
  - `✓ 2488 modules transformed.`
  - `✓ built in 4.13s`
- Warnings:
  - Mixed static/dynamic import warning:
    - `src/state/useAuthUser.js` is dynamically imported by `src/components/auth/AuthGate.jsx` and statically imported by `src/components/SettingsPanel.jsx`; dynamic import will not move module into another chunk.
  - Chunk size warning:
    - Some chunks are larger than 500 kB after minification.
    - Largest emitted bundle noted in output: `dist/assets/index-DeWul9MJ.js` at `4,671.48 kB` (`1,358.22 kB` gzip).
- Blockers: None for build completion.

### Command: `npm run lint`

- Outcome: FAIL (exit code 1)
- Summary: `17 problems (10 errors, 7 warnings)`
- Warnings/Errors captured:
  - Errors include:
    - `src/components/DevPanel.jsx`: unused variable.
    - `src/components/PathOverviewPanel.jsx`: conditional hook call and unused variable.
    - `src/components/PracticeSection/TraditionalBreathRatios.jsx`: react-refresh only-export-components errors.
    - `src/components/avatarV3/AvatarV3.jsx`: multiple react-hooks/refs errors.
  - Warnings include:
    - `src/components/avatarV3/AvatarComposite.jsx`: exhaustive-deps warnings.
    - `src/components/avatarV3/AvatarV3.jsx`: exhaustive-deps warning.
- Blockers:
  - Lint baseline is currently not clean due to existing lint errors.

### Command: `npm run test:smoke`

- Outcome: FAIL (exit code 1)
- Command resolved to: `npx playwright test -c tests/playwright.config.ts tests/smoke/critical-flows.spec.ts --project=chromium`
- Summary:
  - `12 tests` total
  - `1 passed`
  - `7 failed`
  - `4 skipped`
- Notable warning:
  - `[guard-dev] WARN Working tree is not clean (23 changed/untracked entries).`
- Primary failure patterns:
  - Missing expected hub/navigation UI test IDs in multiple tests:
    - `posture-toggle-guided`
    - `navigation-selector-button`
  - Timeouts waiting for `Continue` button in initiation setup flow.
- Blockers:
  - Smoke verification baseline is currently failing across critical flows.

## Baseline Status

- Build: PASS (with warnings)
- Lint: FAIL
- Smoke: FAIL
- Overall stabilization baseline: NOT STABLE

// PROBE:STABILIZATION_BASELINE:END
