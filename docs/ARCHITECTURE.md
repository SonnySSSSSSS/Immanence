# Immanence OS — Architecture (Wiring + Ownership Map)

## Overview

- React single-page app with local state persisted in `localStorage`. Root entry is `src/App.jsx`, wrapped in `ThemeProvider` and guarded by `ErrorBoundary`.
- Primary surfaces: **HomeHub** (dashboard), **NavigationSection** (path/program selection), **PracticeSection** (practice runner + configuration), **WisdomSection** (library), plus modal overlays for onboarding and dev tools.
- Display framing uses `displayModeStore` for **sanctuary** vs **hearth** widths and **dark** vs **light** color schemes. App container targets `maxWidth: 820px` (sanctuary) or `430px` (hearth).

## Routing

- **Section switcher**: `App.jsx` owns `activeSection` (`null` = HomeHub, `practice`, `navigation`, `wisdom`, `application`). Default view comes from `localStorage` (`immanenceOS.defaultView`), with a first-run `WelcomeScreen` gate and curriculum onboarding/completion gates from `curriculumStore`.
- **Section consumers**: `SectionView` renders the requested section; avatar and stage title are suppressed for `navigation`/`application` (those sections render their own avatars) and for ritual library overlays.
- **Navigators**:
  - `HomeHub` calls `onSelectSection` to set `activeSection`.
  - `ApplicationSection` empty state button calls `onNavigate('navigation')` to send users back to path selection.
  - Practice summary flows stay inside `PracticeSection`; returning to HomeHub uses the `Home` button in the header.
- **Tracking Archive deep links**: `SessionHistoryView` accepts `initialTab` and `initialReportDomain`; use `src/components/tracking/archiveLinkConstants.js` for stable tab/domain keys.
- **Stage/path preview state**: `App` holds `previewStage`, `previewPath`, `previewAttention`, and `previewShowCore`, updating them via `onStageChange` callbacks from avatars and propagating to `ThemeProvider` + `StageTitle`.

## Stores (ownership, key actions, wiring)

- **progressStore** (`src/state/progressStore.js`)
  - Owns: `sessions`, `honorLogs`, `streak`, `vacation`, `practiceHistory`, `benchmarks`, `consistencyMetrics`, `goals`, display preference.
  - Actions: `recordSession`, `logHonorPractice`, display preference setters. Selectors: `getStreakInfo`, `getDomainStats`, `getWeeklyPattern`, `getHonorStatus`, `getSessionsWithJournal`, `getPrimaryDomain`.
  - Writers: `PracticeSection` (via `recordPracticeSession`), `circuitIntegration` (via `recordPracticeSession`), DevPanel mock loaders.
  - Readers: `HomeHub` (streak/domain stats/weekly pattern), `TrackingHub`, `DishonorBadge`, `CompactStatsCard`, `TrajectoryCard`, `DevPanel`, `SessionHistoryView`.
- **Centralized Session Recording: recordPracticeSession**
  - Purpose: single authoritative entry point for session completion writes.
  - Why: eliminates duplicate write paths and keeps instrumentation, mandala sync, and cycle gating consistent.
  - Location: `src/services/sessionRecorder.js`
  - Function: `recordPracticeSession(payload, options)`
  - What it does (order):
    - Normalize instrumentation (`exit_type`).
    - Persist session to `progressStore` (unless `persistSession=false`).
    - Optionally log cycle/practiceHistory (`cycleEnabled` + `cycleMinDuration`, or `cyclePracticeData`).
    - Trigger downstream syncs (mandala) exactly once.
  - Options:
    - `persistSession`
    - `cycleEnabled`
    - `cycleMinDuration`
    - `cyclePracticeData`
  - Examples:
    - Normal practice completion: `recordPracticeSession({ domain, duration, metadata, instrumentation, exitType }, { cycleEnabled: true, cycleMinDuration: 10 })`
    - Circuit/ritual completion (cycle only): `recordPracticeSession({ /* payload describing the event */ }, { persistSession: false, cycleEnabled: true, cycleMinDuration: 0, cyclePracticeData: { type, duration, ... } })`
- **Stored vs Derived Tracking Data**
  - Stored (authoritative): `progressStore` session history, `curriculumStore` progress, `journalStore` entries, and domain stores (`wisdomStore`, `videoStore`, etc.) for their respective domains.
  - Derived (computed): trajectory, weekly timing offsets, mandala aggregates, lunar stage metrics, attention weekly features.
  - Rule: derived values must be computed from the spine (`progressStore`) or domain stores; do not introduce new persisted rollup stores unless justified.
- **Tracking UX Layers (Signal → Archive → Reports)**
  - Signal: Home/Tracking cards show short-window indicators and quick entry points (no long-term interpretation).
  - Archive: `SessionHistoryView` is the truth source for raw history and totals across domains.
  - Reports: interpretation layers over the archive (summaries/trends), computed on demand from the spine.
- **Definitions (Labeling Required)**
  - Practice Sessions: count of `progressStore.sessions` (spine-only).
  - All Activity Minutes: practice session minutes + honor/circuit contributions; must be labeled explicitly.
- **trackingStore** (`src/state/trackingStore.js`)
  - Owns: authoritative `sessions`, `dailyLogs`, `streak`, `vacation`, `schedule`, `honorLogs`, `activePath`, treatise/video progress caches, rollup caches.
  - Actions: `recordSession`, `recordHonorPractice`, `logDaily`, `incrementKarma/Dharma`, `startVacation/endVacation`, `beginPath/completeWeek/abandonPath`, `setSchedule`, `recordTreatiseSession`, `recordVideoProgress`; selectors `getToday/getWeek/getMonth/getLifetime/getTrajectory/getWeeklyTimingOffsets`.
  - Readers: `CompactStatsCard`, `TrajectoryCard`, `DevPanel` data tools. **Note**: Practice runs currently log to `progressStore`, not to `trackingStore`.
- **curriculumStore** (`src/state/curriculumStore.js`)
  - Owns: onboarding flags/time slots/thought catalog, active curriculum id/start date, day+leg completions, active practice session pointers.
  - Actions: `completeOnboarding/dismissOnboarding/shouldShowOnboarding`, `getActiveCurriculum/getCurrentDayNumber/getTodaysPractice/getDayLegsWithStatus`, `setActivePracticeSession/clearActivePracticeSession`, `logDayCompletion`, `logLegCompletion`, `getProgress/getStreak/isCurriculumComplete`.
  - Writers: `ThoughtDetachmentOnboarding` (collects thoughts/time slots, logs ritual legs), `CurriculumOnboarding`, `PracticeSection` (auto-starts legs, logs completions), `CurriculumHub` and `CurriculumCompletionReport` dev helpers.
  - Readers: `App` (onboarding/report gating), `HomeHub` curriculum widgets, `DailyPracticeCard`, `PracticeSection` (loads active leg config).
- **navigationStore** (`src/state/navigationStore.js`)
  - Owns: `selectedPathId`, `activePath`, quiz unlocks, foundation video flag, assessment prompt, unlocked sections, last activity.
  - Actions: `setSelectedPath`, `beginPath/completeWeek/abandonPath`, `setWatchedFoundation`, `setPathAssessment`, `updateActivity`, `unlockSection/isSectionUnlocked/getUnlockedSections`.
  - Readers/Writers: `NavigationSection` (PathSelectionGrid, ActivePathState, PathOverviewPanel), `ApplicationSection` (needs `activePath`), `PathFinderCard` recommendations.
- **cycleStore** (`src/state/cycleStore.js`)
  - Owns: `currentCycle`, `completedCycles`, checkpoints, consistency metrics, `canSwitchMode`, `totalCyclesCompleted`.
  - Actions: `startCycle`, `logPracticeDay`, `pauseCycle/resumeCycle/stopCycle`, `switchMode`, `checkCompletion`.
  - Writers: `CycleChoiceModal`/`ConsistencyFoundation`, `cycleManager.logPractice` (called from `PracticeSection`).
  - Readers: `ConsistencyFoundation`, `HomeHub` cycle indicators, `PathSelectionGrid` program badges.
- **displayModeStore** (`src/state/displayModeStore.js`)
  - Owns: `mode` (hearth/sanctuary), `viewportMode`, `colorScheme`, `stageAssetStyle`.
  - Actions: toggles/setters plus `initViewportListener` applied on app mount. Read across all surfaces for layout and color.
- **settingsStore** (`src/state/settingsStore.js`)
  - Owns: app preferences including `displayMode`, `llmModel`, `themeStageOverride`, volume settings, avatar naming convention, button themes, and **photic circles settings**.
  - Actions: setters for each preference category, `resetSettings`, `setPhoticSetting`, `resetPhoticSettings`.
  - Readers: All components needing theme/display/audio preferences; `PhoticCirclesOverlay` for photic settings.
  - **Photic Settings**: Persisted configuration for Photic Circles overlay (rate, brightness, spacing, radius, colors, blur). UI state (`isOpen`, `isRunning`) kept in component state, not persisted.
- **wisdomStore** (`src/state/wisdomStore.js`)
  - Owns: reading sessions, bookmarks, quiz unlocks, flashcard state, recommendation history.
  - Actions: `recordReadingSession`, `addBookmark/removeBookmark`, quiz + flashcard helpers.
  - Readers/Writers: `WisdomSection` (Treatise reading/bookmarks, recommendations), `VideoLibrary` uses treatise/video data but not the store.
- **ritualStore** (`src/state/ritualStore.js`)
  - Owns: ritual run state (`id`, `startTime`, `currentStep`, `status`, `stepData`, `photoUrl`, `selectedMemory`).
  - Actions: `startRitual/advanceStep/goToStep/recordStepData/setPhotoUrl/setSelectedMemory/resetRitual/completeRitual`.
  - Used by legacy `RitualPortal` flow (not wired into current practice selection) to coordinate guided multi-step ritual + `logRitualResult` service call.
- **practiceStore helpers** (`src/state/practiceStore.js`)
  - Owns: persisted practice preferences and historical sessions via localStorage utilities (`loadPreferences/savePreferences/addSession`).
  - Used by `PracticeSection` (loading/saving defaults) and `RitualPortal` (breath pattern seed).
- **Other supporting stores**: `lunarStore` (stage progression used by HomeHub), `pathStore` (attention instrumentation fed by progressStore + wisdomStore), `videoStore` (video playback state), `sigilStore`, `mandalaStore`, `applicationStore/attentionStore/historyStore` (used inside Application/Tracking surfaces). These are read-only for this document unless wiring above references them.

## Static Data vs. Dynamic State

- **Program & path definitions**: `src/data/navigationData.js` exposes path catalog and `getAllPaths()`; combines with program cards declared in `PathSelectionGrid`.
- **Ritual definitions**: `src/data/rituals/index.js` (registry + `RITUAL_CATEGORIES`), with category files under `src/data/rituals/*`. Thought Detachment ritual is assembled ad-hoc inside `ThoughtDetachmentOnboarding`.
- **Curriculum**: `src/data/ritualFoundation14.js` drives the 14-day ritual foundation program consumed by `curriculumStore`.
- **Practice catalogs**: `ringFXPresets`, `vipassanaThemes`, `practiceFamily`, `practice presets` files under `src/data` and `src/utils/frequencyLibrary.js` feed selectors in `PracticeSection`.
- **Wisdom content**: `treatise.generated.js` + `treatiseParts.js` (chapters/parts), `wisdomRecommendations.js`, `videoData.js` power `WisdomSection` tabs.

## Component boundaries (runners vs. selectors vs. legacy)

- **Runners**: `RitualSession` (full-screen ritual playback/timer), `PracticeSection` session renderer, `CircuitTrainer` (via CircuitConfig/execution), `VipassanaVariantSelector` start gate for cognitive vipassana, `PhoticCirclesOverlay` (photic entrainment).
- **Selectors/Decks**: `RitualSelectionDeck` (ritual grid), `PracticeSelectionModal`, `PathSelectionGrid`, `NavigationSelectionModal`, `WisdomSelectionModal`.
- **Portals/Legacy**: `RitualPortal` uses `ritualStore` + static assets; only referenced by legacy practice components (`PracticeSection_REPAIR/GRAVEYARD`) and not invoked by current `PracticeSection` UI.

## Critical Flows

### Navigation → Program card → onboarding/session → completion write → stats surface update

1. **Enter Navigation**: `HomeHub` `onSelectSection` → `App` sets `activeSection` to `navigation` → `NavigationSection` renders with avatar + `ConsistencyFoundation`.
2. **Program cards**: `PathSelectionGrid` prepends program entries (Foundation Cycle and Thought Detachment Ritual) to static paths. Program cards fire handlers only; they do not change `selectedPathId`.
   - Foundation Cycle → `CycleChoiceModal` → `useCycleStore.startCycle`. Subsequent practice sessions (logged from `PracticeSection` via `recordPracticeSession`) mark practice days when duration ≥ 10 minutes. `ConsistencyFoundation` reflects `currentCycle`/checkpoints; `HomeHub` still pulls streaks/time from `progressStore`.
   - Thought Detachment → `ThoughtDetachmentOnboarding` collects two daily times + 5–8 thoughts (`curriculumStore.completeOnboarding`). Optional 3-step ritual session runs via `RitualSession`; on completion it logs leg data to `curriculumStore.logLegCompletion` (day/leg metadata) but does **not** create a `progressStore` session.
3. **Starting practice from curriculum**: `curriculumStore.setActivePracticeSession` is triggered by curriculum UI (e.g., `CurriculumHub`/`DailyPracticeCard`). `PracticeSection` detects the active leg, auto-loads its config, and immediately starts the session.
4. **Completion write path**: `PracticeSection.handleStop` logs the session via `recordPracticeSession` (domain based on practice type) and, when launched from curriculum, calls `curriculumStore.logLegCompletion` and derives next-leg guidance. Cycle gating happens inside the recorder when duration ≥ 10 minutes.
5. **Stats surfaces**: `HomeHub` (`getStreakInfo`, `getDomainStats`, `getWeeklyPattern`), `CompactStatsCard`, and `TrajectoryCard` react to `progressStore` updates; curriculum progress widgets read `curriculumStore` leg/day completions; `ConsistencyFoundation`/`Cycle` components read `cycleStore`.

### Navigation → Ritual Library → selection → session → completion

1. **Pick ritual mode**: In `PracticeSection`, selecting the "Ritual" practice type sets `isRunning` and renders `NavigationRitualLibrary` instead of timers.
2. **Select ritual**: `RitualSelectionDeck` lists registry entries (`getAllRituals`). Choosing one opens `RitualSession` (runner) in a full-screen overlay.
3. **Session behavior**: `RitualSession` handles intro → timed steps → completion screen locally. It does **not** touch any store.
4. **Return path**: `RitualSession.onComplete` currently only returns to the selection deck (`NavigationRitualLibrary` lines 16–24). Progress/streak updates only occur if the user clicks "Return to Hub" in the deck, which calls `PracticeSection.handleStop` and records a `progressStore` session with `domain: 'ritual'`. No post-session journal is shown for ritual runs (summary gating excludes `practice === 'Ritual'`).

### Photic Circles → Open overlay → Configure → Start/Stop → Close

1. **Entry point**: User clicks "Photic" button in `PracticeSection` practice type switcher.
2. **Open overlay**: `PhoticCirclesOverlay` renders as full-viewport (`position: fixed`, `z-index: 1000`) layer with two circles and control panel.
3. **Configure**: User adjusts rate (0.1–20 Hz), brightness (0–1.0), spacing (40–320px), radius (40–240px), blur (0–80px), and colors via `PhoticControlPanel`. Settings persist to `settingsStore.photic`.
4. **Start pulse**: Click "Start" → `isRunning = true` → `requestAnimationFrame` loop begins, updating circle opacity via refs (no React re-renders).
5. **Stop pulse**: Click "Stop" → `isRunning = false` → RAF loop exits, circles freeze at current opacity.
6. **Close overlay**: Click "Close" → `isOpen = false` → overlay unmounts, settings persist.

## Wiring Index

- **HomeHub** (`src/components/HomeHub.jsx`)
  - Primary components: `Avatar`, `HubStagePanel`, `HubCardSwiper`, `CompactStatsCard`, `ApplicationTrackingCard`, `TrajectoryCard`, `CurriculumHub`, `SessionHistoryView` modal, `HonorLogModal`.
  - Inputs: props (`currentStage`, `previewPath`, `previewShowCore`, `previewAttention`, `isPracticing`), `progressStore.getStreakInfo/getDomainStats/getWeeklyPattern`, `lunarStore.getCurrentStage/progress`, `curriculumStore` onboarding/completion flags, `displayModeStore` color + viewport.
  - Outputs: `onSelectSection` (sets `activeSection`), `onStageChange`, open hardware guide/honor log/history/curriculum hub modals.
  - Navigation next: sets `activeSection` to `practice`/`navigation`/`wisdom`/`application` based on card taps.
- **NavigationSection** (`src/components/NavigationSection.jsx`)
  - Primary components: scaled `Avatar`, `ConsistencyFoundation`, `FoundationCard`, `PathFinderCard`, `PathSelectionGrid`, `PathOverviewPanel`, `ActivePathState`, `NavigationSelectionModal`.
  - Inputs: `navigationStore` (`selectedPathId`, `activePath`), `cycleStore.currentCycle`, `curriculumStore.onboardingComplete`, `displayModeStore.colorScheme`.
  - Outputs: `setSelectedPath`, `beginPath/completeWeek` via subcomponents, modal toggles; program cards open `CycleChoiceModal` or `ThoughtDetachmentOnboarding`.
  - Navigation next: optional scroll to path grid on recommendation; no direct section switch (except Application prompt in `ApplicationSection`).
- **PracticeSection** (`src/components/PracticeSection/PracticeSection.jsx`)
  - Role: orchestration layer for the practice lifecycle and session state; coordinates UI components while retaining ownership of state, effects, and side effects.
  - Primary components: practice pickers (`PracticeSelector`, `SacredTimeSlider`, `PracticeOptionsCard`), configs (`BreathConfig`, `SensoryConfig`, `VipassanaVariantSelector`, `SoundConfig`, `VisualizationConfig`, `CymaticsConfig`, `CircuitConfig`), runners (`BreathingRing`, `VipassanaVisual`, `SensorySession`, `VisualizationCanvas`, `CymaticsVisualization`, `NavigationRitualLibrary`, `PhoticCirclesOverlay`), `SessionSummaryModal`, `PostSessionJournal`, `TempoSyncPanel` (Breath & Stillness only).
  - Inputs: props (`onPracticingChange`, `onBreathStateChange`), `practiceStore` preferences, `curriculumStore` active sessions/legs, `displayModeStore.colorScheme`, `useSessionInstrumentation` hook state; `tempoSyncStore` selectors (`enabled`, `getPhaseDuration()`, `beatsPerPhase`) passed to `PracticeOptionsCard`.
  - Outputs: `recordPracticeSession`, `curriculumStore.logLegCompletion`, `logCircuitCompletion`, `onPracticingChange` callbacks, `onBreathStateChange` updates for avatar; `tempoSyncStore` updates via `useTempoDetection` hook (BPM detection, lock/unlock, multiplier changes).
  - Navigation next: none directly; ritual deck "Return to Hub" triggers `handleStop`, home navigation handled by global header button.
  - **Photic entry**: "Photic" button opens `PhoticCirclesOverlay` (component state `isOpen`).
  - **Tempo Sync integration:** "🎵 Tempo Sync" collapsible section in `PracticeOptionsCard` for Breath & Stillness practice; renders `TempoSyncPanel` with file upload (FileUploadDrawer), BPM display, lock button, multiplier selector, and collapsed playback/beats/manual entry accordions. Breathing ring respects `tempoPhaseDuration` when `tempoSyncEnabled` is true.

### PracticeSection Module Structure

- `PracticeSection/PracticeSection.jsx` — session orchestration, lifecycle, effects, render priority control; tempo sync store selector integration
- `PracticeSection/PracticeSelector.jsx` — practice selection grid (pure UI)
- `PracticeSection/PracticeIcons.jsx` — SVG icon set for practices
- `PracticeSection/PracticeConfigView.jsx` — config/selection render branch
- `PracticeSection/PracticeOptionsCard.jsx` — per-practice configuration panel; includes collapsible Tempo Sync section for Breath & Stillness
- `PracticeSection/ScrollingWheel.jsx` — standalone scroll selector widget
- `PracticeSection/SessionSummaryModal.jsx` — end-of-session summary modal
- `PracticeSection/constants.js` — shared registry, IDs, durations, UI width, label mapping
- `TempoSyncPanel.jsx` — music-synced breathing UI (collapsible main card + accordions for playback, beats, manual entry)
- `FileUploadDrawer.jsx` — lightweight drawer for MP3 file selection (drag-and-drop + browser)

### PracticeSection Render Priorities

1. Active session view (inline, intentionally coupled)
   - Includes audio element for music playback when tempo sync active
   - Warning: This block is intentionally not decomposed due to tight coupling between timers, effects, refs, and handlers. Refactoring requires a session view-model plan.
2. Tempo Sync collapsible section (in config card, visible for Breath & Stillness only)
3. Session summary modal (external component)
4. Config/selection view (external component)

- **WisdomSection** (`src/components/WisdomSection.jsx`)
  - Primary components: tabbed Recommendations/Treatise/Bookmarks/Videos/Self-Knowledge, `WisdomSelectionModal`, `VideoLibrary`, `SelfKnowledgeView`.
  - Inputs: static treatise/wisdom/video data, `wisdomStore` bookmarks/reading sessions, `localStorage` scroll positions.
  - Outputs: `wisdomStore.recordReadingSession`, `addBookmark/removeBookmark`; records treatise progress to `localStorage`.
  - Navigation next: none; section-local tab switches only.
- **Modals**
  - Global: `WelcomeScreen`, `CurriculumOnboarding`, `CurriculumCompletionReport`, `DevPanel` (tweaks display mode/stage previews), `AvatarPreview`, `SigilTracker`, `HardwareGuide`, `InstallPrompt`.
  - Practice-specific: `PracticeSelectionModal`, `VipassanaVariantSelector`, `SessionSummaryModal`, `PostSessionJournal`, `NavigationSelectionModal`, `ThoughtDetachmentOnboarding`, `CycleChoiceModal`, `PhoticCirclesOverlay`.

## Tempo Sync System (Music-Synced Breathing)

### Overview

Real-time BPM detection and music-synced breathing for "Breath & Stillness" practice. Users can load an MP3 file, detect or manually set the BPM, lock the detected tempo, and apply a breath pace multiplier (x1–x4) to slow down the breathing rate for fast songs. The system includes Web Audio API beat detection with stability checks, a lightweight file upload drawer, and a collapsible UI panel integrated into the practice card.

### Architecture

- **Zustand Store: tempoSyncStore** (`src/state/tempoSyncStore.js`)
  - State: `enabled` (boolean), `bpm` (30–300), `beatsPerPhase` (2/4/8/16), `confidence` (0–1), `isListening` (boolean), `manualOverride` (boolean), `isLocked` (boolean), `breathMultiplier` (1–4)
  - Actions: `setEnabled`, `setBpm`, `setBeatsPerPhase`, `setListening`, `setConfidence`, `setManualOverride`, `setLocked`, `setBreathMultiplier`
  - Computed: `getPhaseDuration()` = `(60 / bpm) * beatsPerPhase * breathMultiplier` capped at 60s; `getCycleDuration()` = `phaseDuration * 4`
  - Persistence: via Zustand `persist` middleware to localStorage key `tempo-sync-store` (stores `enabled`, `bpm`, `beatsPerPhase`, `manualOverride`, `isLocked`, `breathMultiplier`)
  - Reset: `reset()` unlocks BPM and resets multiplier to x1 on new file load

- **Web Audio API Hook: useTempoDetection** (`src/hooks/useTempoDetection.js`)
  - Purpose: Real-time beat detection and BPM calculation from audio file
  - Key constants:
    - `LOWPASS_FREQUENCY`: 1000 Hz (captures kick drum + bass)
    - `MIN_BEAT_GAP_MS`: 200 ms; `MAX_BEAT_GAP_MS`: 2000 ms (30–300 BPM range)
    - `PEAK_THRESHOLD_MULTIPLIER`: 1.1 (frequency bin peak detection threshold)
    - `MIN_AMPLITUDE`: 10 (minimum signal strength)
    - `STABLE_CONFIDENCE_THRESHOLD`: 0.8 (80% FFT consistency required)
    - `STABLE_BPM_TOLERANCE`: ±3 BPM (beat interval variance tolerance)
    - `STABLE_BEATS_REQUIRED`: 8 consecutive beats required before updating BPM
  - Methods:
    - `initializeAudioContext()` – creates Web Audio API context with lowpass filter
    - `loadAudioFile(file)` – decodes MP3 and connects to analysis chain; resets stability tracking
    - `detectBeat()` – analyzes frequency bins, detects peaks, calculates BPM from beat intervals
    - `startDetection()` – begins RAF-based beat detection loop
    - `playAudio/pauseAudio/stopAudio` – audio element control
  - Stability System: Requires 8 consecutive beats within ±3 BPM of rolling average AND >80% confidence before updating stored BPM; prevents false positives during instrumental intros
  - Lock Check: `isLockedRef` prevents BPM updates when user locks; rolling average continues for consistency feedback

- **UI Components**
  - **FileUploadDrawer** (`src/components/FileUploadDrawer.jsx`)
    - Lightweight slide-up drawer triggered by "📁 LOAD AUDIO FILE" button
    - Features: drag-and-drop zone, file browser, animations (fadeIn overlay, slideUp drawer)
    - Closes via click on overlay, ESC key, or file selection
    - Passes selected file to parent via `onFileSelect` callback
  
  - **TempoSyncPanel** (`src/components/TempoSyncPanel.jsx`)
    - Redesigned with three-tier collapsible structure:
      - **Main Card (always visible):** 
        - Prominent BPM display (28px, green accent)
        - Subordinate confidence bar (3px height, muted color, shows percentage + status)
        - Lock button (icon-only, green when locked, disabled during practice)
        - Breath pace display (current multiplier + duration)
        - 2×2 multiplier grid (x1, x2, x3, x4 buttons)
      - **"⚙ PLAYBACK & BEATS" accordion:**
        - Play/Pause/Stop buttons
        - Beats per phase selector (2/4/8/16)
        - Hidden by default, expands on demand
      - **"✎ MANUAL BPM" accordion:**
        - Direct numeric input (30–300)
        - Hidden by default
    - **File upload trigger:** "📁 LOAD AUDIO FILE" button opens FileUploadDrawer
    - **Duration warning:** Shows "⚠ Max duration reached" when phase duration ≥ 60s
    - Disabled state (50% opacity): All controls except display disabled during active practice

### Integration into PracticeSection

- **Location:** Collapsible section integrated into `PracticeOptionsCard` (Breath & Stillness practice only)
  - Positioned after Sacred Duration slider
  - Before "Begin Practice" button
  - Controlled by `showTempoSync` state in `PracticeOptionsCard`
  
- **Toggle Button:**
  - Label: "🎵 Tempo Sync"
  - Styling: Accent green when expanded, muted when collapsed
  - Toggle animates accordion content (slideDown 0.3s)

- **Variables passed through component chain:**
  - `tempoSyncEnabled` (from store selector)
  - `tempoPhaseDuration` (computed, includes multiplier + cap)
  - `tempoBeatsPerPhase` (current beats selection)
  - `isRunning` (practice session active, disables controls)

### Breathing Pattern Integration

- **Priority in breathingPatternForRing memo** (PracticeSection.jsx, ~line 1846):
  1. If `tempoSyncEnabled && practice === "Breath & Stillness"` → use `tempoPhaseDuration` for all 4 phases
  2. Else if benchmark available → use progressive pattern
  3. Else → use static pattern
- **Audio Lifecycle:**
  - Audio element persists during practice (cleanup on unmount only)
  - Music continues playing from where user left off if paused before practice start
  - Breathing ring animates to detected BPM with applied multiplier

### Data Flow

```
User loads MP3
  ↓
loadAudioFile() → decode audio, connect to Web Audio API chain
  ↓
startDetection() → RAF loop analyzes frequency bins
  ↓
detectBeat() → peaks trigger beat interval calculation
  ↓
Stability check: 8 consecutive beats within ±3 BPM + >80% confidence?
  ↓ YES
setBpm() (unless isLocked) → store updates
  ↓
breathingPatternForRing memo recomputes
  ↓
BreathingRing component uses tempoPhaseDuration (BPM-based)
  ↓
Breathing ring animates to music tempo (with x1–x4 multiplier applied)
```

### UX Principles

- **State Visibility:** BPM, lock status, confidence, multiplier always visible (mental model: "what is happening now")
- **Operational Concealment:** File mechanics, playback controls, beats selector hidden in collapsed accordions (operational details, not perceptual state)
- **Lock Unmistakability:** Green accent, icon change (🔓/🔒), large touch target; readable at a glance even peripherally
- **Confidence Subordination:** Confidence bar visually smaller and more muted than BPM; displayed as status line rather than prominent stat
- **Space Efficiency:** ~60% vertical footprint reduction vs. flat layout; collapsible accordions preserve discoverability while reducing cognitive load
- **Inline Integration:** Stays in practice card flow (Option A); avoids floating panels that might intrude on meditative context

### Known Limitations & Future Work

- BPM detection may be slower on weak-bass files (instrumental intros without kick drums)
- Stability requirement (8 beats) takes ~4 seconds at 120 BPM; users see "🔍 DETECTING..." status during this phase
- Phase duration cap (60s) prevents x4 multiplier from extending beyond 60 seconds per phase; warning shown when approaching cap
- Single-file per session (no queuing); loading new file auto-unlocks and resets multiplier to x1

## Photic Circles System

### Overview

Experimental photic entrainment overlay for light-based meditation. Renders two pulsing circles at adjustable frequencies (0.1–20 Hz) with configurable visual parameters.

### Components

- **PhoticCirclesOverlay** (`src/components/PhoticCirclesOverlay.jsx`)
  - Full-viewport overlay (`position: fixed`, `inset: 0`, `z-index: 1000`)
  - Two circle divs positioned via CSS (left/right of viewport center)
  - RAF-based pulse loop using refs for direct DOM updates (no React re-renders)
  - Responsive control panel (bottom sheet in Hearth, right panel in Sanctuary)
- **PhoticControlPanel** (`src/components/PhoticControlPanel.jsx`)
  - Rate slider (0.1–12 Hz) + advanced input (12–20 Hz)
  - Brightness, spacing, radius, blur sliders
  - Color palette presets (white, amber, red, green, blue, violet)
  - Link colors toggle, Start/Stop, Close buttons

### State Management

- **Component state** (not persisted):
  - `isOpen`: Overlay visibility
  - `isRunning`: Pulse engine active
- **settingsStore.photic** (persisted):
  - `rateHz`, `dutyCycle`, `brightness`, `spacingPx`, `radiusPx`, `blurPx`
  - `colorLeft`, `colorRight`, `linkColors`, `bgOpacity`

### Pulse Engine

- **Square wave** (default): `intensity = isOn ? brightness : 0`
- **RAF loop**: Updates circle opacity via refs when intensity changes (2x per cycle)
- **Phase reset**: On `rateHz` or `dutyCycle` change to prevent jumps
- **Performance**: No React re-renders during pulse (verified via DevTools)

### Safety Constraints

- Default rate: 2 Hz (gentle)
- Slider soft max: 12 Hz
- Hard max: 20 Hz (advanced input only)
- Blur clamped to `min(blurPx, radiusPx)`
- Circles centered in full viewport (not app frame) for proper eye alignment

### Entry Point

- "Photic" button in `PracticeSection` practice type switcher
- Opens overlay with last-used settings from `settingsStore.photic`

## Tutorial System

The app's tutorials are implemented as an overlay-based tooltip system anchored to UI elements via `data-tutorial` attributes. Tutorials are opened from the top-menu `?` button, which resolves a `tutorialId` from the active section/practice and calls the tutorial store to open the corresponding tutorial.

### Core Components

- **TutorialOverlay**: Renders the tutorial tooltip + scrim using a portal to `document.body`. Tooltip positioning is calculated relative to the app frame (when present) or the viewport. If an anchor target is not found after retries, the tooltip centers as a fallback.
- **Anchor Targets**: UI elements expose stable anchors through `data-tutorial` attributes; anchor IDs are centralized (e.g., `anchorIds.js`).

### Content Model

- Tutorial content is defined in a **registry** as inline JS objects keyed by `tutorialId` (e.g., `page:home`, `practice:breath`).
- Each tutorial contains ordered **steps**, each with:
  - `title` (string)
  - `body` (string; restricted markdown)
  - `target` (anchor ID)
  - `placement` (tooltip placement hint)
  - Optional `media` array (whitelisted local images): `{ key, alt, caption? }`

### State + Persistence

- State is managed by a Zustand store (open/close, current `tutorialId`, `stepIndex`).
- Completion state is persisted in localStorage under `immanence.tutorial`.
- Content overrides (admin/dev) persist in localStorage under `immanence.tutorial.overrides`.

### Admin/Dev Editing Mode

Tutorial editing is **admin/dev-only** and is gated at runtime by:

- `localStorage.getItem("immanence.tutorial.admin") === "1"`

When enabled, the tutorial overlay exposes an in-place editor for the current tutorial step and an extended dev JSON editor. Normal users never see edit controls.

### Rendering Safety + Hardening

Tutorial rendering is hardened to prevent XSS, path tricks, and layout breakage:

- **Restricted markdown rendering**:
  - Only allows: `p`, `br`, `strong`, `em`, `code` (inline), `ul`, `ol`, `li`, `a`
  - Links enforce safe protocols (http/https only); unsafe protocols resolve to `#`
- **Whitelisted images**:
  - Images are loaded from `/public/tutorial/` only
  - Render-time validation rejects invalid keys (no slashes, limited extensions)
- **Layout safety**:
  - Tooltip has a viewport-bounded max height and a scrollable body region
  - CSS forces long strings (URLs/inline code) to wrap to prevent horizontal overflow
- **DoS prevention**:
  - Step `body` is clamped at render time (e.g., 2000 chars) to prevent freezes from tampered localStorage; a "[content truncated]" note appears only in admin mode

These render-time guards intentionally mirror editor-time validation to ensure localStorage tampering cannot bypass constraints.

## Guardrails

- Prefer **selectors over prop drilling**: lift data into Zustand selectors (e.g., `getStreakInfo`, `getDayLegsWithStatus`) instead of passing nested props between cards.
- Program and path cards should reference **program/path ids only**; consume details from registries (`navigationData`, curriculum metadata) inside the target component to avoid stale copies.
- **No hidden cards**: placeholder entries in `PathSelectionGrid` remain visibly disabled (opacity/reduced pointer events) rather than conditionally unmounting.
- **320px+ hearth safety**: keep interactive elements fluid within `min(<design width>, 94vw)` bounds, honor `min-w-0` on flex children, and match existing modal sizing (`RitualSession` caps at `min(640px, 94vw)`; App hearth container caps at `430px`).
- **Full-viewport overlays**: Use `position: fixed` with `inset: 0` to escape app container constraints (e.g., `PhoticCirclesOverlay` for proper eye alignment).

## Doc/Code mismatches (follow-up tasks, no code changed)

- Ritual runs do not create practice records when the user completes a ritual inside `NavigationRitualLibrary`; `RitualSession.onComplete` returns to the deck without calling `PracticeSection.handleStop`, so streaks/stats stay unchanged unless the user clicks "Return to Hub" manually (`NavigationRitualLibrary.jsx` lines 16–24, 61–76). Consider emitting a completion event that records to `progressStore` and ends instrumentation.

## How to update this doc

- When adding a feature, update these sections in one pass:
  1. **Routing** – note new entry points, section switches, or gatekeeping modals.
  2. **Stores** – record new/changed store state, actions, and which components read/write them.
  3. **Critical Flows** – append the new end-to-end path (inputs → actions → outputs → surfaces updated).
  4. **Wiring Index** – add or adjust the surface where the feature appears (inputs/outputs/navigation).
- Keep bullets/diagrams concise; avoid describing modules that do not exist in the repo.

## Avatar System

### Overview

Dual-mode avatar rendering system with distinct visual languages for light and dark modes. Light mode uses orb-based assets with crossfade animation; dark mode preserves sigil-based rendering.

### Components

- **AvatarContainer** (`src/components/avatar/AvatarContainer.jsx`)
  - Main orchestrator combining all avatar layers
  - Renders frame, rings, core, halos, and moon orbit
  - Handles breathing aura, stage glow, and practice state
- **StaticSigilCore** (`src/components/avatar/StaticSigilCore.jsx`)
  - Conditionally renders `OrbCore` for light mode or sigil-based core for dark mode
  - Manages stage-specific colors and glow effects

### Master Optical System [LOCKED]

The light mode avatar uses a museum-grade optical system built in four phases to ensure architectural stability and realistic depth.

#### Layer Stack (Bottom to Top)

1. **Ambient Glow**: `z-index: 0`, opacity 0.35, blur 16px, blend `screen`. Ambient aura.
2. **Vessel - Frame**: `z-index: 1`, locking the physical rim.
3. **Vessel - Instrument**: `z-index: 2`, 120s slow rotation, 25% opacity.
4. **Seated Core (Circular Clip Wrapper, depth: 3)**:
   - **Gem Core**: `z-index: 1`, contains parameterized core (Scale 1.12x, `object-fit: cover`).
   - **Optical Shadow**: `z-index: 2`, internal radial shadow mask.
   - **Optical Lens**: `z-index: 3`, circular convex glass refraction.
   - **Optical Highlight**: `z-index: 4`, specular reflections.
   - **Energy Particles**: `z-index: 5`, opacity 0.22.

#### Parameterized Meaning (90+ Variants)

The internal core is parameterized via CSS filters on the `z-index: 1` core layer only.

- **Stage Presets**: Seedling (neutral), Ember (+8° hue), Flame (+18° hue), Beacon (-6° hue), Stellar (-12° hue).
- **Safety Clamps**:
  - Scale: 1.06–1.18
  - Brightness: 0.82–1.08
  - Contrast: 0.85–1.15
  - Saturation: 0.75–1.25

#### Architectural Contract

- Layers above the Seat (Lens, Highlights, Frame) are **immutable**.
- Filters must **never propagation upward** to optical layers.
- Core fitting is strictly `object-fit: cover` with a 2px radial feather mask on the seat.

### Proportions (320320 container)

- **Frame outer**: 302px (94.375%)
- **Instrument ring**: 270px (84.375%)
- **Orb diameter**: 228px (71.25%)
- **Gap (orb frame)**: ~12px

### Performance

- Opacity and transform only (no layout-affecting properties)
- CSS-based animations (React state only for frame swapping)
- No blur animations
- Pauses during practice (`isPracticing === true`)
- Circular clipping wrapper eliminates transparency artifacts

### Style Constraints

- **Aesthetic**: Parchment-compatible, contemplative, refined, instrument-like
- **Mood**: Calm, ancient, intentional
- **Surface language**: Ceramic, stone, glass, ink, patina
- **Lighting**: Soft ambient, no hard rim glow
- **Color saturation**: Restrained, earthy, mineral-based (muted teal/jade)

### Dark Mode Avatar

Preserves existing sigil-based rendering:

- Animated PNG orb with stage-specific colors
- Whirlpool conic gradient background
- Cyan/teal outer halo
- Separation ring and inner shadow
- Moon orbit overlay
