# Practice Surface Audit

// PROBE:PRACTICE_SURFACE_AUDIT:START

Date: 2026-03-25
Task: TASK-AUDIT-LEGACY-PRACTICE-SURFACES
Scope: Duplicate practice surfaces, wrappers, and quarantine/legacy files
Method: workspace import/reference tracing only (no source edits)

## Classification Matrix

### `src/components/PracticeSection.jsx`

- Classification: canonical owner
- Reference evidence:
  - Imported by `src/App.jsx` (`import { PracticeSection } from "./components/PracticeSection.jsx"`)
  - Owns runtime composition for practice support surfaces (`./practice/PracticeOptionsCard.jsx`, `./practice/SessionSummaryModal.jsx`)
- Status: actively referenced and mounted in app runtime
- Safe next action: keep-for-now (primary owner)

### `src/components/PracticeSection/PracticeSection.jsx`

- Classification: compatibility wrapper
- Reference evidence:
  - File re-exports from top-level owner (`export { PracticeSection, default } from "../PracticeSection.jsx"`)
  - Barrel exists at `src/components/PracticeSection/index.js`
- Status: wrapper path retained for compatibility/import stability
- Safe next action: keep-for-now until all imports are proven migrated away from folder-style entrypoints

### `src/components/PracticeSection/PracticeOptionsCard.jsx`

- Classification: duplicate implementation
- Reference evidence:
  - Contains a full local implementation, separate from canonical `src/components/practice/PracticeOptionsCard.jsx`
  - No active runtime import found from `src/App.jsx` or top-level `src/components/PracticeSection.jsx`
- Status: appears not directly referenced by the current runtime owner path
- Safe next action: quarantine candidate (move after one more repo-wide import trace pass)

### `src/components/PracticeSection/SessionSummaryModal.jsx`

- Classification: compatibility wrapper
- Reference evidence:
  - Wraps and forwards to `../practice/SessionSummaryModal.jsx`
  - No direct runtime mount found from app root; wrapper exists as compatibility layer
- Status: currently acts as thin adapter path
- Safe next action: keep-for-now until all historical import callsites are removed or confirmed dead

### `src/components/practice/PracticeOptionsCard.jsx`

- Classification: canonical owner
- Reference evidence:
  - Imported and used by `src/components/PracticeSection.jsx`
  - Contains current housing/runtime integrations used by active practice flow
- Status: active production path
- Safe next action: keep-for-now (canonical)

### `src/components/practice/SessionSummaryModal.jsx`

- Classification: canonical owner
- Reference evidence:
  - Imported and used by `src/components/PracticeSection.jsx`
  - Reused by wrapper `src/components/PracticeSection/SessionSummaryModal.jsx`
- Status: active production path
- Safe next action: keep-for-now (canonical)

### `src/__quarantine__legacy/PracticeSection_REPAIR.jsx`

- Classification: quarantine candidate
- Reference evidence:
  - Located under explicit quarantine namespace
  - No active import/reference from current runtime ownership chain found in source search
- Status: not part of active app import tree
- Safe next action: safe-delete candidate after one final targeted runtime check in dev build

### `src/__quarantine__legacy/PracticeSection_GRAVEYARD.jsx`

- Classification: quarantine candidate
- Reference evidence:
  - Located under explicit quarantine namespace
  - No active import/reference from current runtime ownership chain found in source search
  - Contains legacy practice wiring and legacy import paths
- Status: not part of active app import tree
- Safe next action: safe-delete candidate after one final targeted runtime check in dev build

## Consolidation Summary

- Canonical owners: `src/components/PracticeSection.jsx`, `src/components/practice/PracticeOptionsCard.jsx`, `src/components/practice/SessionSummaryModal.jsx`
- Compatibility wrappers: `src/components/PracticeSection/PracticeSection.jsx`, `src/components/PracticeSection/SessionSummaryModal.jsx`
- Duplicate implementation: `src/components/PracticeSection/PracticeOptionsCard.jsx`
- Quarantine candidates: `src/__quarantine__legacy/PracticeSection_REPAIR.jsx`, `src/__quarantine__legacy/PracticeSection_GRAVEYARD.jsx`

## Recommended Safe Order (Future Cleanup)

1. Remove or migrate any remaining imports to `src/components/PracticeSection/SessionSummaryModal.jsx` and `src/components/PracticeSection/PracticeSection.jsx`.
2. Move `src/components/PracticeSection/PracticeOptionsCard.jsx` into quarantine once no imports remain.
3. Delete `src/__quarantine__legacy/PracticeSection_REPAIR.jsx` and `src/__quarantine__legacy/PracticeSection_GRAVEYARD.jsx` only after a final smoke check confirms zero runtime dependency.

// PROBE:PRACTICE_SURFACE_AUDIT:END
