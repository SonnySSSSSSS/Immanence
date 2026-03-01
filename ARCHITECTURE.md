# Architecture

// PROBE:DOCS:START
Doc Refresh Notes:
- This is the canonical top-level technical map for the current repo.
- Claims below were checked against repo files on 2026-03-01.
// PROBE:DOCS:END

Technical map for the current Immanence OS app shell, runtime boundaries, and the main places to change behavior.

## Top-Level Stack

- UI shell: React 18 with Vite (`rolldown-vite`) and a single `ReactDOM.createRoot()` entry in [src/main.jsx](src/main.jsx).
- Primary rendering: standard React UI plus React Three Fiber for 3D/visual scenes (`@react-three/fiber` in [package.json](package.json)).
- Animation/content: Framer Motion, React Markdown, and a large component-first UI tree.
- State: Zustand stores across `src/state/`, with a mix of persisted stores (`persist`) and transient stores.
- External services:
  - Supabase browser client for auth/session in [src/lib/supabaseClient.js](src/lib/supabaseClient.js)
  - Local Ollama proxy at `/api/ollama` in [vite.config.js](vite.config.js)

## Runtime Entry Points

### Boot Flow

1. [src/main.jsx](src/main.jsx) chooses a route by pathname.
2. `/__playground` loads the dev playground only in dev builds.
3. Paths ending in `/trace` or `/trace/` load `TracePage`.
4. All other routes render `App`.

### App Shell

[src/App.jsx](src/App.jsx) is the runtime coordinator:

- Wraps the app in `AuthGate`, then `ThemeProvider`.
- Owns top-level shell state such as:
  - active section
  - settings panel visibility
  - dev panel visibility
  - auth user handoff
  - photic overlay visibility
- Renders one hub-first shell:
  - `HomeHub` when `activeSection === null`
  - `SectionView` for `practice`, `wisdom`, `application`, or `navigation`

## Navigation And Gating

### Section Model

The app is path-based, not router-based, after boot:

- `null` = home hub
- `practice`
- `wisdom`
- `application`
- `navigation`

The switching logic lives in `handleSectionSelect()` in [src/App.jsx](src/App.jsx).

### User Mode Gate

[src/state/userModeStore.js](src/state/userModeStore.js) persists:

- `userMode`: `student` or `explorer`
- `hasChosenUserMode`

Current gating behavior in [src/App.jsx](src/App.jsx):

- Explorer mode can open any section.
- Student mode only allows:
  - `navigation` when onboarding/setup is still incomplete
  - `practice` when `practiceLaunchContext` exists in [src/state/uiStore.js](src/state/uiStore.js)
  - returning to the hub (`null`)
- Student mode does not directly open `wisdom` or `application` from the section selector path in `App`.

### Auth Gate

[src/components/auth/AuthGate.jsx](src/components/auth/AuthGate.jsx):

- Currently has `ENABLE_AUTH = true`.
- Lazy-loads the Supabase client so auth setup can be bypassed if disabled later.
- Blocks the shell until `supabase.auth.getSession()` resolves.
- Shows built-in sign-in/sign-up UI when there is no session.
- Passes the resolved user into [src/state/useAuthUser.js](src/state/useAuthUser.js).

This means the repo is no longer "no accounts"; the browser app is local-first for practice data, but account auth is active in the current client code.

## Dev Surface

There are two separate production gates, and the old docs merged them incorrectly.

### Dev Panel Visibility Gate

[src/lib/devPanelGate.js](src/lib/devPanelGate.js) controls whether the `DevPanel` can render in production:

- Dev build: always enabled
- Production build: requires `?devpanel=1` once, which latches `localStorage.immanence-devpanel-enabled`

### Devtools Unlock Gate

[src/dev/uiDevtoolsGate.js](src/dev/uiDevtoolsGate.js) controls broader devtools-only affordances:

- Dev build: always enabled
- Production build: requires both
  - `?devtools=1`
  - `localStorage.immanence.devtools.enabled = 1`

`App` also supports keyboard toggling for the visible Dev Panel when the dev panel gate is open.

## Persistence Model

### Core User State

[src/state/offlineFirstUserStateKeys.js](src/state/offlineFirstUserStateKeys.js) defines the explicit "core user state" export/import allowlist:

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

- Progress and recorded sessions: [src/state/progressStore.js](src/state/progressStore.js)
- Curriculum and onboarding: [src/state/curriculumStore.js](src/state/curriculumStore.js)
- Active path runs and schedules: [src/state/navigationStore.js](src/state/navigationStore.js)
- Path emergence/history: [src/state/pathStore.js](src/state/pathStore.js)
- Breath benchmark snapshots: [src/state/breathBenchmarkStore.js](src/state/breathBenchmarkStore.js)
- Settings: [src/state/settingsStore.js](src/state/settingsStore.js)
- Dev panel tuning (dev only): [src/state/devPanelStore.js](src/state/devPanelStore.js)

### Direct Local Storage Keys Outside `persist`

Not everything goes through Zustand `persist`:

- Color scheme: `immanenceOS.colorScheme` in [src/state/displayModeStore.js](src/state/displayModeStore.js)
- Stage asset style: `immanenceOS.stageAssetStyle` in [src/state/displayModeStore.js](src/state/displayModeStore.js)
- Dev panel production latch: `immanence-devpanel-enabled` in [src/lib/devPanelGate.js](src/lib/devPanelGate.js)
- Devtools production latch: `immanence.devtools.enabled` in [src/dev/uiDevtoolsGate.js](src/dev/uiDevtoolsGate.js)

### Breath Benchmark Storage

[src/state/breathBenchmarkStore.js](src/state/breathBenchmarkStore.js) persists under `immanence-breath-benchmark` and stores:

- current effective benchmark (`benchmark`)
- latest snapshot (`lastBenchmark`)
- append-only history (`benchmarkHistory`)
- run-scoped day 1 / day 14 snapshots (`benchmarksByRunId`)
- initiation-attempt status (`attemptBenchmarksByRunId`)
- lifetime maxima (`lifetimeMax`)

## Practice, Curriculum, And Progression

### Practice Runtime

[src/components/PracticeSection.jsx](src/components/PracticeSection.jsx) is the largest runtime surface for active sessions. It owns:

- practice selection and config panels
- breath benchmark entry points
- session start/stop flow
- circuit training entry
- post-session summary and journaling
- session instrumentation hooks

Completed sessions funnel through [src/services/sessionRecorder.js](src/services/sessionRecorder.js), which:

- writes normalized session records into `progressStore`
- computes `pathContext`
- computes `scheduleMatched` snapshots for curriculum precision tracking
- updates path signals and mandala sync hooks

### Curriculum Contract Model

Current curriculum/path contract logic is split across:

- program definitions and launchers in [src/data/programRegistry.js](src/data/programRegistry.js)
- onboarding, leg completions, and time-slot state in [src/state/curriculumStore.js](src/state/curriculumStore.js)
- path contract normalization and validation in [src/utils/pathContract.js](src/utils/pathContract.js)
- active path run state in [src/state/navigationStore.js](src/state/navigationStore.js)

Verified contract fields in [src/utils/pathContract.js](src/utils/pathContract.js):

- `totalDays`
- `practiceDaysPerWeek`
- `maxLegsPerDay`
- `requiredLegsPerDay`
- `requiredTimeSlots`

### Stage And Identity Signals

There is not one single stage system in the repo.

- Avatar-facing stage and mode weights are computed from practice history by `useAvatarV3State()` in [src/state/avatarV3Store.js](src/state/avatarV3Store.js).
- `lunarStore` and `mandalaStore` still exist as separate progression/visual systems in [src/state/lunarStore.js](src/state/lunarStore.js) and [src/state/mandalaStore.js](src/state/mandalaStore.js).

Treat avatar stage as session-derived unless a component explicitly reads a different store.

## Stable Component Map

This is a navigable map of the current top-level UI tree, kept shallow on purpose.

```text
main.jsx
└── RootComponent
    ├── TracePage                (/trace path)
    ├── Playground               (/__playground in dev only)
    └── App
        └── AuthGate
            └── ThemeProvider
                ├── Background / active-session blackout
                ├── PhoticCirclesOverlay
                ├── Header controls
                ├── HomeHub OR SectionView
                ├── SettingsPanel
                ├── InstallPrompt
                ├── TutorialOverlay
                ├── ShadowScanOverlay
                └── DevPanel (lazy, gated)
```

### SectionView

`SectionView` in [src/App.jsx](src/App.jsx) conditionally renders:

- `PracticeSection`
- `WisdomSection` (lazy)
- `ApplicationSection` (lazy)
- `NavigationSection`

### HomeHub

[src/components/HomeHub.jsx](src/components/HomeHub.jsx) currently bundles:

- `AvatarV3`
- `DailyPracticeCard`
- `QuickDashboardTiles`
- `CurriculumHub` / `CurriculumCompletionReport` modal flow
- `SessionHistoryView`
- `TrackingHub`
- `SideNavigation`

### Navigation

[src/components/NavigationSection.jsx](src/components/NavigationSection.jsx) currently bundles:

- `AvatarV3`
- `PathFinderCard`
- `PathSelectionGrid`
- `PathOverviewPanel`
- `ActivePathState`
- `NavigationPathReport`
- `NavigationSelectionModal`
- optional `CodexChamber`

### Practice

[src/components/PracticeSection.jsx](src/components/PracticeSection.jsx) currently bundles:

- `PracticeHeader`
- `CircuitTrainingSelector`
- `PracticeOptionsCard`
- runtime session surfaces such as `BreathingRing`, `SensorySession`, `VisualizationCanvas`, `TempoSyncSessionPanel`
- modals for benchmarking, summaries, and feedback

### Wisdom

[src/components/WisdomSection.jsx](src/components/WisdomSection.jsx) currently bundles:

- `WisdomSelectionModal`
- treatise reader and bookmarks
- `VideoLibrary`
- `SelfKnowledgeView`

### Application

[src/components/ApplicationSection.jsx](src/components/ApplicationSection.jsx) is currently narrow and path-dependent:

- empty-state handoff to Navigation when no active path exists
- `SigilSealingArea`
- `ApplicationTrackingCard`

## Where To Change X

- Avatar: use [src/components/avatarV3](src/components/avatarV3), [src/state/avatarV3Store.js](src/state/avatarV3Store.js), [src/config/avatarStageAssets.js](src/config/avatarStageAssets.js), and dev tuning in [src/state/devPanelStore.js](src/state/devPanelStore.js).
- Rings: use [src/components/BreathingRing.jsx](src/components/BreathingRing.jsx) for the live breath ring, [src/components/BenchmarkBreathworkUI.jsx](src/components/BenchmarkBreathworkUI.jsx) for benchmark flow, and avatar ring layer defaults in [src/state/devPanelStore.js](src/state/devPanelStore.js).
- Curriculum: use [src/state/curriculumStore.js](src/state/curriculumStore.js), [src/data/programRegistry.js](src/data/programRegistry.js), [src/utils/pathContract.js](src/utils/pathContract.js), and [src/services/infographics/curriculumRail.js](src/services/infographics/curriculumRail.js).
- Stores: start in [src/state](src/state), then check [src/state/offlineFirstUserStateKeys.js](src/state/offlineFirstUserStateKeys.js) before changing persisted user-state behavior.
- Reporting: use [src/reporting](src/reporting), especially [src/reporting/tilePolicy.js](src/reporting/tilePolicy.js), [src/reporting/dashboardProjection.js](src/reporting/dashboardProjection.js), and hub consumers in [src/components/dashboard](src/components/dashboard).
- Dev panel: use [src/components/DevPanel.jsx](src/components/DevPanel.jsx), [src/state/devPanelStore.js](src/state/devPanelStore.js), [src/lib/devPanelGate.js](src/lib/devPanelGate.js), and [src/dev/uiDevtoolsGate.js](src/dev/uiDevtoolsGate.js).

## Related Docs

- Legacy architecture doc still present at [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Gap scan for the current docs set: [docs/DOC_GAPS.md](docs/DOC_GAPS.md).
