# Architecture

Current technical map for the repo, checked against local files on 2026-03-17.
This is the canonical top-level system map. Use [docs/DOCS_INDEX.md](docs/DOCS_INDEX.md) for the wider doc set.

## System At A Glance

- UI runtime: React 18 with Vite (`rolldown-vite`) and a single root entry in [src/main.jsx](src/main.jsx).
- Shell and routing: boot is path-based in [src/main.jsx](src/main.jsx), then the app switches through internal section state in [src/App.jsx](src/App.jsx) rather than React Router.
- Rendering: standard React UI plus React Three Fiber scenes.
- State: Zustand stores across [src/state](src/state), with a mix of persisted and transient state. `userModeStore`, `curriculumStore`, and `navigationStore` now all enforce per-user ownership boundaries through `ownerUserId` and `activeUserId`.
- Auth and sync: Supabase browser auth in [src/lib/supabaseClient.js](src/lib/supabaseClient.js) and offline-first sync helpers in [src/state/offlineFirstUserStateSync.js](src/state/offlineFirstUserStateSync.js).
- Shared shell chrome: practice housing primitives in [src/components/practice/practiceHousing.jsx](src/components/practice/practiceHousing.jsx) are now reused by practice cards directly and by wisdom through [src/components/wisdom/WisdomCardHousing.jsx](src/components/wisdom/WisdomCardHousing.jsx). Navigation and application now mirror the same Arwes-style shell pattern in-place.
- Tutorials: app-owned tutorial IDs, schema, and progress state now feed a Driver.js presentation runtime through [src/components/tutorial/TutorialOverlay.jsx](src/components/tutorial/TutorialOverlay.jsx) and [src/tutorials/driverAdapter.js](src/tutorials/driverAdapter.js).
- LLM integration: Four Modes validation requests are sent through the configured proxy URL in [src/services/llmService.js](src/services/llmService.js).

## Boot And Shell

[src/main.jsx](src/main.jsx) uses simple path-based boot logic:

- `/__playground` loads the dev playground in development only
- paths ending in `/trace` or `/trace/` load `TracePage`
- all other paths render `App`

[src/App.jsx](src/App.jsx) is the runtime coordinator. It:

- wraps the shell in `AuthGate`, then `ThemeProvider`
- binds the authenticated user ID into `userModeStore`, `navigationStore`, and `curriculumStore`
- owns the authenticated user-mode chooser, hub versus section navigation, and top-level shell state
- controls settings, tutorial, install prompt, photic overlay, and gated dev tooling
- renders the chooser when auth is resolved but `hasChosenUserMode === false`
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
                ├── user-mode chooser, HomeHub, or SectionView
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

- authenticated users hit a built-in chooser before hub or section rendering if `hasChosenUserMode === false`
- explorer mode can open any section after explicit chooser selection
- student mode can always return to the hub
- student mode enters `navigation` immediately after chooser selection
- student mode is setup-first: while there is no owned active path, `App.jsx` keeps the student pinned to `navigation`
- once a student-owned active path exists, `HomeHub` becomes the default surface again unless navigation was explicitly forced
- student mode can open `practice` when `practiceLaunchContext` exists in [src/state/uiStore.js](src/state/uiStore.js)
- student mode does not directly open `wisdom` or `application` from the main section selector path
- the chooser currently exposes explorer entry behind `Shift+Click`

### Auth Gate

[src/components/auth/AuthGate.jsx](src/components/auth/AuthGate.jsx) currently ships with `ENABLE_AUTH = true`.

- it lazy-loads Supabase so auth can still be disabled later if needed
- it blocks the shell until `supabase.auth.getSession()` resolves
- it renders built-in sign-in and sign-up UI when there is no session
- it hands the resolved user to [src/state/useAuthUser.js](src/state/useAuthUser.js)

The app is therefore local-first for practice data, but account auth is active in the current client.

### Navigation Surface Model

[src/components/NavigationSection.jsx](src/components/NavigationSection.jsx) is no longer a simple grid plus helper card. It now owns:

- the avatar header for the section
- an optional compact active-path action tray
- the main program selection surface through [src/components/PathSelectionGrid.jsx](src/components/PathSelectionGrid.jsx)
- inline active-path reporting through `ActivePathState` and `NavigationPathReport`
- local modal state for `PathOverviewPanel`
- local `CurriculumOnboarding` fallback when initiation is opened outside the hub flow

[src/components/PathSelectionGrid.jsx](src/components/PathSelectionGrid.jsx) is now the primary entry surface for navigation:

- it groups entries into five stage lanes: `seedling`, `ember`, `flame`, `beacon`, and `stellar`
- it uses a swipeable and pointer-draggable carousel with dot selectors rather than a static multi-card grid
- it currently mixes both path entries and program entries on the same stage rail
- it keeps empty stages visible through placeholders instead of hiding them

[src/components/PathFinderCard.jsx](src/components/PathFinderCard.jsx) still exists in the repo, but it is not part of the live `NavigationSection` tree anymore.

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
- active path runs, frozen schedule selections, adherence facts, and run-scoped progress snapshots: [src/state/navigationStore.js](src/state/navigationStore.js)
- path emergence and history: [src/state/pathStore.js](src/state/pathStore.js)
- breath benchmarks: [src/state/breathBenchmarkStore.js](src/state/breathBenchmarkStore.js)
- settings: [src/state/settingsStore.js](src/state/settingsStore.js)
- wisdom bookmarks and reading progress: [src/state/wisdomStore.js](src/state/wisdomStore.js)
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

### Tutorial Runtime

The tutorial system is now split across:

- registry definitions in [src/tutorials/tutorialRegistry.js](src/tutorials/tutorialRegistry.js)
- schema normalization in [src/tutorials/tutorialSchema.js](src/tutorials/tutorialSchema.js)
- override and target resolution in [src/tutorials/tutorialRuntime.js](src/tutorials/tutorialRuntime.js)
- persisted launch and completion state in [src/state/tutorialStore.js](src/state/tutorialStore.js)
- the Driver bridge in [src/tutorials/driverAdapter.js](src/tutorials/driverAdapter.js)
- the mounted runtime surface in [src/components/tutorial/TutorialOverlay.jsx](src/components/tutorial/TutorialOverlay.jsx)

Driver is presentation only. Tutorial IDs, step order, completion state, and authoring data remain app-owned.

Completed sessions funnel through [src/services/sessionRecorder.js](src/services/sessionRecorder.js), which writes normalized records to `progressStore`, computes `pathContext`, captures schedule-match snapshots used by curriculum reporting, and then asks [src/state/navigationStore.js](src/state/navigationStore.js) to recompute the persisted `activePath.progress` snapshot from canonical completed sessions.

Practice shell chrome is now centralized in [src/components/practice/practiceHousing.jsx](src/components/practice/practiceHousing.jsx) and consumed directly by at least:

- [src/components/practice/PracticeOptionsCard.jsx](src/components/practice/PracticeOptionsCard.jsx)
- [src/components/practice/SessionSummaryModal.jsx](src/components/practice/SessionSummaryModal.jsx)

### Curriculum And Navigation Contract

Current path and curriculum logic is split across:

- program definitions in [src/data/programRegistry.js](src/data/programRegistry.js)
- onboarding and leg completion state in [src/state/curriculumStore.js](src/state/curriculumStore.js)
- active run state, frozen schedule selections, and progress snapshot sync in [src/state/navigationStore.js](src/state/navigationStore.js)
- schedule anchor and slot normalization rules in [src/utils/scheduleUtils.js](src/utils/scheduleUtils.js)
- contract normalization and validation in [src/utils/pathContract.js](src/utils/pathContract.js)

The verified contract fields in [src/utils/pathContract.js](src/utils/pathContract.js) are:

- `totalDays`
- `practiceDaysPerWeek`
- `maxLegsPerDay`
- `requiredLegsPerDay`
- `requiredTimeSlots`

Important current schedule semantics:

- Day 1 is anchored by `computeScheduleAnchorStartAt()` in [src/utils/scheduleUtils.js](src/utils/scheduleUtils.js), not by the activation click time
- pre-start and off-day dates do not count as Day 1
- if the first scheduled slot for today has already expired, the run anchors to the next eligible scheduled day
- `navigationStore` freezes `selectedDaysOfWeek` and `selectedTimes` into `activePath.schedule` so persisted runs do not drift when legacy fields hydrate

### Section Surfaces

- [src/components/HomeHub.jsx](src/components/HomeHub.jsx) is the hub surface for avatar, daily practice, dashboards, curriculum access, history, archive/report launching, and student-active-path actions. It now routes setup back through `navigation` rather than beginning setup inline.
- [src/components/NavigationSection.jsx](src/components/NavigationSection.jsx) owns staged program selection, overview overlays, inline active-path reporting, and initiation onboarding fallback.
- [src/components/WisdomSection.jsx](src/components/WisdomSection.jsx) now composes four direct surfaces: Treatise, Bookmarks, Videos, and Self-Knowledge. It uses [src/components/wisdom/WisdomCardHousing.jsx](src/components/wisdom/WisdomCardHousing.jsx) and no longer depends on a separate recommendations data layer.
- [src/components/ApplicationSection.jsx](src/components/ApplicationSection.jsx) is still path-dependent, but now uses the same Arwes-style empty-state housing when no active path exists, then switches to `SigilSealingArea` plus `ApplicationTrackingCard` when a path is active.

### Stage And Identity Signals

There is no single global stage system.

- avatar-facing stage and mode weights are computed from practice history through [src/state/avatarV3Store.js](src/state/avatarV3Store.js)
- [src/state/lunarStore.js](src/state/lunarStore.js) and [src/state/mandalaStore.js](src/state/mandalaStore.js) remain separate progression and visual systems

Treat avatar stage as session-derived unless a component explicitly reads another source.

## Where To Change X

- Avatar visuals: [src/components/avatarV3](src/components/avatarV3), [src/state/avatarV3Store.js](src/state/avatarV3Store.js), [src/config/avatarStageAssets.js](src/config/avatarStageAssets.js), and [src/state/devPanelStore.js](src/state/devPanelStore.js)
- Breath rings and benchmarks: [src/components/PracticeSection.jsx](src/components/PracticeSection.jsx), [src/components/practice/useBreathSessionState.js](src/components/practice/useBreathSessionState.js), [src/components/BreathingRing.jsx](src/components/BreathingRing.jsx), and [src/components/BenchmarkBreathworkUI.jsx](src/components/BenchmarkBreathworkUI.jsx)
- Student shell and section gating: [src/App.jsx](src/App.jsx), [src/components/HomeHub.jsx](src/components/HomeHub.jsx), [src/state/userModeStore.js](src/state/userModeStore.js), [src/state/navigationStore.js](src/state/navigationStore.js), and [src/state/curriculumStore.js](src/state/curriculumStore.js)
- Navigation program entry and overlays: [src/components/NavigationSection.jsx](src/components/NavigationSection.jsx), [src/components/PathSelectionGrid.jsx](src/components/PathSelectionGrid.jsx), [src/components/PathOverviewPanel.jsx](src/components/PathOverviewPanel.jsx), [src/components/ActivePathState.jsx](src/components/ActivePathState.jsx), and [src/components/CurriculumOnboarding.jsx](src/components/CurriculumOnboarding.jsx)
- Curriculum and path contracts: [src/state/curriculumStore.js](src/state/curriculumStore.js), [src/state/navigationStore.js](src/state/navigationStore.js), [src/data/programRegistry.js](src/data/programRegistry.js), [src/utils/pathContract.js](src/utils/pathContract.js), [src/utils/scheduleUtils.js](src/utils/scheduleUtils.js), and [src/services/infographics/curriculumRail.js](src/services/infographics/curriculumRail.js)
- Persisted user-state behavior: start in [src/state](src/state), then check [src/state/offlineFirstUserStateKeys.js](src/state/offlineFirstUserStateKeys.js)
- Reporting and dashboard projections: [src/reporting](src/reporting) and [src/components/dashboard](src/components/dashboard)
- Shared shell chrome for practice and wisdom: [src/components/practice/practiceHousing.jsx](src/components/practice/practiceHousing.jsx) and [src/components/wisdom/WisdomCardHousing.jsx](src/components/wisdom/WisdomCardHousing.jsx)
- Dev tooling: [src/components/DevPanel.jsx](src/components/DevPanel.jsx), [src/state/devPanelStore.js](src/state/devPanelStore.js), [src/lib/devPanelGate.js](src/lib/devPanelGate.js), and [src/dev/uiDevtoolsGate.js](src/dev/uiDevtoolsGate.js)

## Related Docs

- Doc map: [docs/DOCS_INDEX.md](docs/DOCS_INDEX.md)
- Development setup: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- LLM integration: [docs/LLM_INTEGRATION.md](docs/LLM_INTEGRATION.md)
- Avatar specifics: [docs/AVATAR_SYSTEM.md](docs/AVATAR_SYSTEM.md)
- Persistence audit: [docs/PERSISTENCE_AUDIT.md](docs/PERSISTENCE_AUDIT.md)
- Tutorial architecture: [docs/TUTORIAL_SYSTEM.md](docs/TUTORIAL_SYSTEM.md)
- Tutorial authoring: [docs/TUTORIAL_AUTHORING.md](docs/TUTORIAL_AUTHORING.md)
