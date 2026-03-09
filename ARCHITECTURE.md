# Architecture

Current technical map for the repo, checked against local files on 2026-03-09.
This is the canonical top-level system map. Use [docs/DOCS_INDEX.md](docs/DOCS_INDEX.md) for the wider doc set.

## System At A Glance

- UI runtime: React 18 with Vite (`rolldown-vite`) and a single root entry in [src/main.jsx](src/main.jsx).
- Rendering: standard React UI plus React Three Fiber scenes.
- State: Zustand stores across [src/state](src/state), with a mix of persisted and transient state.
- Auth and sync: Supabase browser auth in [src/lib/supabaseClient.js](src/lib/supabaseClient.js) and offline-first sync helpers in [src/state/offlineFirstUserStateSync.js](src/state/offlineFirstUserStateSync.js).
- Local AI integration: Vite proxies `/api/ollama` to the local Ollama service in [vite.config.js](vite.config.js).

## Boot And Shell

[src/main.jsx](src/main.jsx) uses simple path-based boot logic:

- `/__playground` loads the dev playground in development only
- paths ending in `/trace` or `/trace/` load `TracePage`
- all other paths render `App`

[src/App.jsx](src/App.jsx) is the runtime coordinator. It:

- wraps the shell in `AuthGate`, then `ThemeProvider`
- owns hub versus section navigation and top-level shell state
- controls settings, tutorial, install prompt, photic overlay, and gated dev tooling
- renders `HomeHub` when `activeSection === null`
- renders `SectionView` for `practice`, `wisdom`, `application`, and `navigation`

The current top-level tree is intentionally shallow:

```text
main.jsx
└── RootComponent
    ├── TracePage
    ├── Playground
    └── App
        └── AuthGate
            └── ThemeProvider
                ├── overlays and header chrome
                ├── HomeHub or SectionView
                ├── SettingsPanel
                ├── InstallPrompt
                ├── TutorialOverlay
                ├── ShadowScanOverlay
                └── DevPanel
```

## Navigation And Gates

### Section Model

After boot, the app uses internal section state rather than React Router:

- `null` for the hub
- `practice`
- `wisdom`
- `application`
- `navigation`

Section switching is coordinated in `handleSectionSelect()` in [src/App.jsx](src/App.jsx).

### User Mode Gate

[src/state/userModeStore.js](src/state/userModeStore.js) persists:

- `userMode` as `student` or `explorer`
- `hasChosenUserMode`

Current behavior in [src/App.jsx](src/App.jsx):

- explorer mode can open any section
- student mode can always return to the hub
- student mode can open `navigation` while setup is incomplete
- student mode can open `practice` when `practiceLaunchContext` exists in [src/state/uiStore.js](src/state/uiStore.js)
- student mode does not directly open `wisdom` or `application` from the main section selector path

### Auth Gate

[src/components/auth/AuthGate.jsx](src/components/auth/AuthGate.jsx) currently ships with `ENABLE_AUTH = true`.

- it lazy-loads Supabase so auth can still be disabled later if needed
- it blocks the shell until `supabase.auth.getSession()` resolves
- it renders built-in sign-in and sign-up UI when there is no session
- it hands the resolved user to [src/state/useAuthUser.js](src/state/useAuthUser.js)

The app is therefore local-first for practice data, but account auth is active in the current client.

### Dev Surfaces

There are two separate production gates:

- [src/lib/devPanelGate.js](src/lib/devPanelGate.js) controls whether the visible `DevPanel` can appear in production. It uses `?devpanel=1` and latches `localStorage.immanence-devpanel-enabled`.
- [src/dev/uiDevtoolsGate.js](src/dev/uiDevtoolsGate.js) controls broader devtools-only affordances. In production it requires both `?devtools=1` and `localStorage.immanence.devtools.enabled = 1`.

Do not collapse these into one gate by accident.

## Persistence Boundaries

### Core User State Contract

[src/state/offlineFirstUserStateKeys.js](src/state/offlineFirstUserStateKeys.js) defines the explicit export and import allowlist for core user state:

- `immanenceOS.progress`
- `immanence-breath-benchmark`
- `immanence_mandala_v1`
- `immanence-settings`
- `immanence-user-mode`
- `immanence_practice_prefs_v2`
- `immanence_sessions_v1`
- `immanenceOS.navigationState`
- `immanenceOS.path`
- `immanenceOS.curriculum`

### Important Persisted Stores

- progress and session history: [src/state/progressStore.js](src/state/progressStore.js)
- curriculum and onboarding: [src/state/curriculumStore.js](src/state/curriculumStore.js)
- active path runs and schedules: [src/state/navigationStore.js](src/state/navigationStore.js)
- path emergence and history: [src/state/pathStore.js](src/state/pathStore.js)
- breath benchmarks: [src/state/breathBenchmarkStore.js](src/state/breathBenchmarkStore.js)
- settings: [src/state/settingsStore.js](src/state/settingsStore.js)
- dev panel tuning in development: [src/state/devPanelStore.js](src/state/devPanelStore.js)

### Direct Local Storage Keys Outside `persist`

- `immanenceOS.colorScheme` in [src/state/displayModeStore.js](src/state/displayModeStore.js)
- `immanenceOS.stageAssetStyle` in [src/state/displayModeStore.js](src/state/displayModeStore.js)
- `immanence-devpanel-enabled` in [src/lib/devPanelGate.js](src/lib/devPanelGate.js)
- `immanence.devtools.enabled` in [src/dev/uiDevtoolsGate.js](src/dev/uiDevtoolsGate.js)

## Feature Ownership

### Practice Runtime

[src/components/PracticeSection.jsx](src/components/PracticeSection.jsx) is the largest active-session surface. It owns:

- practice selection and configuration
- benchmark entry points
- session start and stop flow
- circuit entry
- post-session summaries and journaling
- instrumentation hooks

Completed sessions funnel through [src/services/sessionRecorder.js](src/services/sessionRecorder.js), which writes normalized records to `progressStore`, computes `pathContext`, and captures schedule-match snapshots used by curriculum reporting.

### Curriculum And Navigation Contract

Current path and curriculum logic is split across:

- program definitions in [src/data/programRegistry.js](src/data/programRegistry.js)
- onboarding and leg completion state in [src/state/curriculumStore.js](src/state/curriculumStore.js)
- contract normalization and validation in [src/utils/pathContract.js](src/utils/pathContract.js)
- active run state in [src/state/navigationStore.js](src/state/navigationStore.js)

The verified contract fields in [src/utils/pathContract.js](src/utils/pathContract.js) are:

- `totalDays`
- `practiceDaysPerWeek`
- `maxLegsPerDay`
- `requiredLegsPerDay`
- `requiredTimeSlots`

### Section Surfaces

- [src/components/HomeHub.jsx](src/components/HomeHub.jsx) is the hub surface for avatar, daily practice, dashboards, curriculum access, history, and side navigation.
- [src/components/NavigationSection.jsx](src/components/NavigationSection.jsx) owns path selection, overview, and active path reporting.
- [src/components/WisdomSection.jsx](src/components/WisdomSection.jsx) owns treatise reading, bookmarks, videos, and self-knowledge flows.
- [src/components/ApplicationSection.jsx](src/components/ApplicationSection.jsx) is currently narrow and path-dependent, including `SigilSealingArea` and application tracking.

### Stage And Identity Signals

There is no single global stage system.

- avatar-facing stage and mode weights are computed from practice history through [src/state/avatarV3Store.js](src/state/avatarV3Store.js)
- [src/state/lunarStore.js](src/state/lunarStore.js) and [src/state/mandalaStore.js](src/state/mandalaStore.js) remain separate progression and visual systems

Treat avatar stage as session-derived unless a component explicitly reads another source.

## Where To Change X

- Avatar visuals: [src/components/avatarV3](src/components/avatarV3), [src/state/avatarV3Store.js](src/state/avatarV3Store.js), [src/config/avatarStageAssets.js](src/config/avatarStageAssets.js), and [src/state/devPanelStore.js](src/state/devPanelStore.js)
- Breath rings and benchmarks: [src/components/BreathingRing.jsx](src/components/BreathingRing.jsx), [src/components/BenchmarkBreathworkUI.jsx](src/components/BenchmarkBreathworkUI.jsx), and [src/state/devPanelStore.js](src/state/devPanelStore.js)
- Curriculum and path contracts: [src/state/curriculumStore.js](src/state/curriculumStore.js), [src/data/programRegistry.js](src/data/programRegistry.js), [src/utils/pathContract.js](src/utils/pathContract.js), and [src/services/infographics/curriculumRail.js](src/services/infographics/curriculumRail.js)
- Persisted user-state behavior: start in [src/state](src/state), then check [src/state/offlineFirstUserStateKeys.js](src/state/offlineFirstUserStateKeys.js)
- Reporting and dashboard projections: [src/reporting](src/reporting) and [src/components/dashboard](src/components/dashboard)
- Dev tooling: [src/components/DevPanel.jsx](src/components/DevPanel.jsx), [src/state/devPanelStore.js](src/state/devPanelStore.js), [src/lib/devPanelGate.js](src/lib/devPanelGate.js), and [src/dev/uiDevtoolsGate.js](src/dev/uiDevtoolsGate.js)

## Related Docs

- Doc map: [docs/DOCS_INDEX.md](docs/DOCS_INDEX.md)
- Development setup: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- LLM integration: [docs/LLM_INTEGRATION.md](docs/LLM_INTEGRATION.md)
- Avatar specifics: [docs/AVATAR_SYSTEM.md](docs/AVATAR_SYSTEM.md)
- Persistence audit: [docs/PERSISTENCE_AUDIT.md](docs/PERSISTENCE_AUDIT.md)
