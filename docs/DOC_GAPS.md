# Documentation Gap Map

Short, high-impact gap scan after the 2026-03-01 architecture refresh.

## Missing

- `docs/STATE_PERSISTENCE.md` - Canonical map of persisted stores, direct localStorage keys, and export/import boundaries; today that knowledge is spread across `src/state/` and `ARCHITECTURE.md`.
- `docs/AUTH_AND_DEPLOYMENT.md` - One place for Supabase auth behavior, production gating, GitHub Pages base-path rules, and deploy caveats; current facts are split across `src/components/auth/AuthGate.jsx`, `src/lib/devPanelGate.js`, and `vite.config.js`.
- `docs/PRACTICE_RUNTIME.md` - Dedicated guide for session start/stop flow, summary flow, and `sessionRecorder` responsibilities; this currently requires reading `src/components/PracticeSection.jsx` and `src/services/sessionRecorder.js`.
- `docs/REPORTING_REFERENCE.md` - Focused reference for tile policy, dashboard projections, and archive/report consumers in `src/reporting/` and `src/components/dashboard/`.

## Outdated

- `docs/ARCHITECTURE.md` - Stale on core facts: it claims React 19, "no accounts," a simpler devtools gate, and older store assumptions that no longer match the repo.
- `docs/DOC_INVENTORY.md` - Marks `docs/ARCHITECTURE.md` as "Ready" and does not account for the new root `ARCHITECTURE.md` as the canonical map.
- `docs/DOCUMENTATION_AUDIT.md` - Describes a reorganization plan that is not the current repo shape and still labels older docs as current.
- `docs/README.md` - It is a partial docs index and currently omits the new root `ARCHITECTURE.md` and this `docs/DOC_GAPS.md` file.

## Proposed

- `docs/STATE_PERSISTENCE.md` - Promote the persistence section from the new architecture map into its own maintainable reference.
- `docs/AUTH_AND_DEPLOYMENT.md` - Capture auth enablement, Supabase client boundaries, and production-only debug gates in one place.
- `docs/PRACTICE_RUNTIME.md` - Document the practice execution pipeline so changes to `PracticeSection` and `sessionRecorder` do not require code archaeology.
- `docs/REPORTING_REFERENCE.md` - Make dashboard/reporting policy changes safer by documenting selector inputs, scopes, and consumers.
