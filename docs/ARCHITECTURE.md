# Immanence OS — Architecture (Wiring + Ownership Map)

## Overview

- React single-page app with local state persisted in `localStorage`. Root entry is `src/App.jsx`, wrapped in `ThemeProvider` and guarded by `ErrorBoundary`.
- Primary surfaces: **HomeHub** (dashboard), **NavigationSection** (path/program selection), **PracticeSection** (practice runner + configuration), **WisdomSection** (library), plus modal overlays for onboarding and dev tools.
- Display framing uses `displayModeStore` for **sanctuary** vs **hearth** widths and **dark** vs **light** color schemes. App container targets `maxWidth: 820px` (sanctuary) or `430px` (hearth).

## App-Wide State Domains (Zustand Slices)

The app is organized into four primary state domains, plus a small transient UI orchestration store (`uiStore`) used for cross-section deep links and one-shot launch overrides.
Each domain is owned by dedicated Zustand stores with explicit source-of-truth and derived relationships:

### **0. UI Orchestration Domain** (`launch contexts`, `deep links`, `transient overrides`)
- **Store**: `uiStore` (`src/state/uiStore.js`) — in-memory only (not persisted)
- **Owns**:
  - `practiceLaunchContext`: one-shot overrides when launching a practice from paths/schedule/recommendations (practice ID, duration, param patch, path metadata)
  - `contentLaunchContext`: one-shot deep links into Wisdom content (treatise chapter/video + optional time budget)
- **Consumption pattern**: reader components consume and immediately clear the context (`PracticeSection`, `WisdomSection`).
- **Invariant**: contexts must not silently overwrite persisted preferences unless explicitly allowed (see `persistPreferences` on `practiceLaunchContext`).
- **Important**: `uiStore` is *intent only*. It is not the storage for lock state. Locking/overrides are applied by `sessionOverrideStore` (below) when `PracticeSection` consumes a launch context.

### **1. Practice Domain** (`practice`, `configuration`, `session runtime`)
- **Stores owning practice state**:
  - `practiceStore` (local storage key `immanence_practice_prefs_v2`): Persisted user preferences per practice (preset, pattern, frequency, mode settings)
  - `sessionOverrideStore` (ephemeral): Session-scoped overrides + lock paths for curriculum/path-launched sessions (prevents global defaults from being polluted)
  - `tempoSyncStore`: Real-time music-synced breathing state (BPM, lock status, multiplier, confidence)
  - `useBreathSessionState` (hook): In-memory session runtime (phase progress, timings, loop state)
  - `usePracticeSessionInstrumentation` (hook): Real-time practice instrumentation (exit type, duration tracking, user actions)
- **Source of truth**: `practiceStore` for preferences (persisted); in-memory hooks for active session state (ephemeral)
- **Derived**: Session summaries, cycle registration, mandala syncs computed from `progressStore.sessionsV2` after recording

#### **Session Overrides & Locks (Curriculum Launch Discipline)**

Path/curriculum launches must be able to:
1. Start a practice with specific parameters (ex: Breath preset, Photic colors, Vipassana theme)
2. Optionally **lock** those parameters so the curriculum card session cannot be “user-modified”
3. Avoid writing overrides into persisted user defaults (`practiceStore` / `settingsStore`)

Implementation:
- **Launch intent**: set `uiStore.practiceLaunchContext` from HomeHub / DailyPracticeCard.
- **Constraint application**: `PracticeSection` consumes the context, applies overrides + locks into `sessionOverrideStore`, then clears the launch context.
- **Lock enforcement**:
  - `PracticeSection.updateParams()` filters out changes to locked `practiceParams.*` keys.
  - Global-risk settings (ex: photic) are routed through session overrides rather than `settingsStore` writes.
- **Default policy**: for `source: "dailySchedule"` launches, if no explicit locks are provided, the session is locked by default (`practiceParams`, `settings`, `tempoSync`, `awarenessScene`). Manual practice selection clears locks.
- **Effective settings**: components that use global defaults (notably photic and breath sound) must read `base + sessionOverride` via `src/hooks/useEffectiveSettings.js`.

#### **Practice Settings Registry** (Override/Lock Targets)

This table enumerates all *current* practice-tunable variables in the repo and where they live today.
It exists to support **path-driven practice launches** (curriculum card) that may apply **session-scoped overrides** and **locks** without polluting free-practice settings.

**Key**:
- **Key Path** uses a dotted path relative to its store root (example: `practiceParams.breath.pattern.inhale`).
- **Persisted?** indicates whether the value survives reloads by default.
- **Lockable?** indicates whether it is a reasonable candidate for “locked by path” behavior (only for curriculum-launched sessions).
- Some rows are marked **global-risk**: path overrides should not mutate them directly because they are global defaults shared with free practice.

| Practice Surface | Key Path | Store / Source Of Truth | Persisted? | Lockable? | Notes |
|---|---|---|---|---|---|
| **All Practices (menu defaults)** | `practiceId` | `practiceStore` (`src/state/practiceStore.js`) | Yes | Yes | Last-selected practice menu category (umbrella ID like `breath`, `awareness`, `perception`). |
| **All Practices (menu defaults)** | `duration` | `practiceStore` | Yes | Yes | Default duration used when user launches a practice manually. Curriculum launch can override via `uiStore.practiceLaunchContext.durationMin`. |
| **All Practices (launch overrides)** | `practiceLaunchContext.*` | `uiStore` (`src/state/uiStore.js`) | No | N/A | One-shot launch context: `{ practiceId, durationMin, practiceParamsPatch, practiceConfig, pathContext, persistPreferences }`. Consumed + cleared by `PracticeSection`. |
| **All Practices (session constraints)** | `overrides.*`, `locks[]` | `sessionOverrideStore` (`src/state/sessionOverrideStore.js`) | No | N/A | Ephemeral session overrides + lock paths applied when `PracticeSection` consumes `practiceLaunchContext`. |
| **Breath (Foundation)** | `practiceParams.breath.preset` | `practiceStore.practiceParams` | Yes | Yes | Preset key (UI). May be `null` when manually editing phase sliders. |
| **Breath (Foundation)** | `practiceParams.breath.pattern.inhale` | `practiceStore.practiceParams` | Yes | Yes | Phase duration seconds. |
| **Breath (Foundation)** | `practiceParams.breath.pattern.hold1` | `practiceStore.practiceParams` | Yes | Yes | Phase duration seconds. |
| **Breath (Foundation)** | `practiceParams.breath.pattern.exhale` | `practiceStore.practiceParams` | Yes | Yes | Phase duration seconds. |
| **Breath (Foundation)** | `practiceParams.breath.pattern.hold2` | `practiceStore.practiceParams` | Yes | Yes | Phase duration seconds. |
| **Breath (Foundation)** | `breathSoundEnabled` | `settingsStore` (`src/state/settingsStore.js`) | Yes | Yes | Breath tone toggle. Not per-practice today. Consider session override (do not mutate user default for path sessions). |
| **Breath (Foundation)** | `benchmark.benchmark.*` | `breathBenchmarkStore` (`src/state/breathBenchmarkStore.js`) | Yes | Usually | User’s max capacity used for progressive scaling (`useBreathSessionState`). Paths may want to require benchmark first, but should not override benchmark values. |
| **Breath (Tempo Sync)** | `enabled` | `tempoSyncStore` (`src/state/tempoSyncStore.js`) | Yes | Yes | When enabled, breath timing quantizes to BPM. Consider session override + lock for path-driven sessions. |
| **Breath (Tempo Sync)** | `bpm` | `tempoSyncStore` | Yes | Yes | |
| **Breath (Tempo Sync)** | `beatsPerPhase` | `tempoSyncStore` | Yes | Yes | |
| **Breath (Tempo Sync)** | `breathMultiplier` | `tempoSyncStore` | Yes | Yes | |
| **Breath (Tempo Sync)** | `isLocked` | `tempoSyncStore` | Yes | Yes | Lock state for UI dials (tempo panel). |
| **Breath (FX)** | `currentFxPreset` | `PracticeSection` local state | No | Yes | Ring FX selection is ephemeral (`ringFXPresets`). If paths need deterministic FX, promote to session override key (do not persist unless user selects it). |
| **Integration (Rituals)** | `practiceParams.ritual.activeRitualId` | `practiceStore.practiceParams` | Yes | Yes | Drives which ritual is selected by default. |
| **Circuit** | `practiceParams.circuit.activeCircuitId` | `practiceStore.practiceParams` | Yes | Yes | Exists in defaults; circuit execution primarily uses `circuitManager` + `curriculumStore.getCircuit`. Treat as legacy unless fully wired. |
| **Circuit** | `circuits[]` | `circuitManager` (`src/state/circuitManager.js`) | Yes | Yes | Circuit library (user-created templates). Paths may reference a circuit by ID. |
| **Circuit** | `activeSession.*` | `circuitManager` | Yes | N/A | Runtime state for an in-progress circuit. Not a lock target. |
| **Awareness (umbrella)** | `practiceParams.awareness.activeMode` | `practiceStore.practiceParams` | Yes | Yes | Submode selector: `insight` (cognitive), `bodyscan` (somatic), `feeling` (emotion). |
| **Awareness → Cognitive (Vipassana)** | `practiceParams.cognitive_vipassana.sensoryType` | `practiceStore.practiceParams` | Yes | Yes | Often `'sakshi'`; used in instrumentation + session content selection. |
| **Awareness → Cognitive (Vipassana)** | `practiceParams.cognitive_vipassana.vipassanaTheme` | `practiceStore.practiceParams` | Yes | Yes | Visual theme ID (see `src/data/vipassanaThemes.js`). |
| **Awareness → Cognitive (Vipassana)** | `practiceParams.cognitive_vipassana.vipassanaElement` | `practiceStore.practiceParams` | Yes | Yes | Thought element style ID (bird/leaf/cloud/lantern). |
| **Awareness → Cognitive (Vipassana)** | `practiceParams.cognitive_vipassana.scanType` | `practiceStore.practiceParams` | Yes | Yes | Present; currently more relevant for body scans. |
| **Awareness → Cognitive (Vipassana)** | `selectedScene` | `awarenessSceneStore` (`src/state/awarenessSceneStore.js`) | Yes | Yes | Scene wallpaper selection used by Sakshi visuals. Consider session override if paths want deterministic scenes. |
| **Awareness → Cognitive (Vipassana)** | `sakshiVersion` | `awarenessSceneStore` | Yes | Yes | Sakshi rendering version (1 scenic, 2 panel). |
| **Awareness → Somatic (Body Scan)** | `practiceParams.somatic_vipassana.sensoryType` | `practiceStore.practiceParams` | Yes | Yes | Defaults to `'bodyScan'`. |
| **Awareness → Somatic (Body Scan)** | `practiceParams.somatic_vipassana.scanType` | `practiceStore.practiceParams` | Yes | Yes | `'full'`, `'head'`, `'hands'`, `'chest'`, `'feet'`, etc. |
| **Awareness → Emotion (Feeling)** | `practiceParams.feeling.mode` | `practiceStore.practiceParams` | Yes | Yes | Emotion focus (discomfort, fear, pleasure, etc.). |
| **Awareness → Emotion (Feeling)** | `practiceParams.feeling.promptMode` | `practiceStore.practiceParams` | Yes | Yes | Prompt style (`minimal`/`guided`). |
| **Awareness → Emotion (Feeling)** | `practiceParams.feeling.intent` | `practiceStore.practiceParams` | Yes | Yes | Present in defaults; not fully surfaced. Useful future path hook. |
| **Awareness → Emotion (Feeling)** | `practiceParams.feeling.promptText` | `practiceStore.practiceParams` | Yes | Yes | Present in defaults; not fully surfaced. Useful future path hook. |
| **Resonance (umbrella)** | `practiceParams.resonance.activeMode` | `practiceStore.practiceParams` | Yes | Yes | Submode selector: `aural` (sound) or `cymatics`. |
| **Resonance → Sound** | `practiceParams.sound.soundType` | `practiceStore.practiceParams` | Yes | Yes | `'Binaural'` vs UI labels (`'Binaural Beats'`, `'Isochronic Tones'`, etc.) are normalized in UI glue. |
| **Resonance → Sound** | `practiceParams.sound.volume` | `practiceStore.practiceParams` | Yes | Yes | Global volume for sound practice. |
| **Resonance → Sound** | `practiceParams.sound.binauralPresetId` | `practiceStore.practiceParams` | Yes | Yes | Currently stored as preset `name` (not stable ID). Consider migrating to stable IDs. |
| **Resonance → Sound** | `practiceParams.sound.isochronicPresetId` | `practiceStore.practiceParams` | Yes | Yes | Currently stored as preset `name` (not stable ID). Consider migrating to stable IDs. |
| **Resonance → Sound** | `practiceParams.sound.exactHz` | `practiceStore.practiceParams` | Yes | Yes | Entrainment target. Ensure UI reads/writes from this key (avoid local-only state drift). |
| **Resonance → Sound** | `practiceParams.sound.carrierFrequency` | `practiceStore.practiceParams` | Yes | Yes | Isochronic carrier frequency. |
| **Resonance → Sound** | `practiceParams.sound.reverbWet` | `practiceStore.practiceParams` | Yes | Yes | Advanced FX wet (0..1). Ensure UI is fully wired (avoid local-only state drift). |
| **Resonance → Sound** | `practiceParams.sound.chorusWet` | `practiceStore.practiceParams` | Yes | Yes | Advanced FX wet (0..1). Ensure UI is fully wired (avoid local-only state drift). |
| **Resonance → Sound** | `practiceParams.sound.mantraPresetId` | (not yet implemented) | N/A | Yes | `SoundConfig` supports mantra/nature selection props, but persistence keys are not currently modeled in `practiceParams.sound`. |
| **Resonance → Sound** | `practiceParams.sound.naturePresetId` | (not yet implemented) | N/A | Yes | See note above. |
| **Resonance → Cymatics** | `practiceParams.cymatics.frequencySet` | `practiceStore.practiceParams` | Yes | Yes | E.g. `solfeggio`. |
| **Resonance → Cymatics** | `practiceParams.cymatics.selectedFrequencyIndex` | `practiceStore.practiceParams` | Yes | Yes | Index into `SOLFEGGIO_SET`. |
| **Resonance → Cymatics** | `practiceParams.cymatics.driftEnabled` | `practiceStore.practiceParams` | Yes | Yes | |
| **Resonance → Cymatics** | `practiceParams.cymatics.audioEnabled` | `practiceStore.practiceParams` | Yes | Yes | |
| **Resonance → Cymatics** | `practiceParams.cymatics.fadeInDuration` | `practiceStore.practiceParams` | Yes | Yes | |
| **Resonance → Cymatics** | `practiceParams.cymatics.displayDuration` | `practiceStore.practiceParams` | Yes | Yes | |
| **Resonance → Cymatics** | `practiceParams.cymatics.fadeOutDuration` | `practiceStore.practiceParams` | Yes | Yes | |
| **Resonance → Cymatics** | `practiceParams.cymatics.voidDuration` | `practiceStore.practiceParams` | Yes | Yes | |
| **Perception (umbrella)** | `practiceParams.perception.activeMode` | `practiceStore.practiceParams` | Yes | Yes | Submode selector: `visualization` or `photic`. |
| **Perception → Visualization (Kasina)** | `practiceParams.visualization.geometry` | `practiceStore.practiceParams` | Yes | Yes | Geometry renderer selection. |
| **Perception → Visualization (Kasina)** | `practiceParams.visualization.fadeInDuration` | `practiceStore.practiceParams` | Yes | Yes | |
| **Perception → Visualization (Kasina)** | `practiceParams.visualization.displayDuration` | `practiceStore.practiceParams` | Yes | Yes | |
| **Perception → Visualization (Kasina)** | `practiceParams.visualization.fadeOutDuration` | `practiceStore.practiceParams` | Yes | Yes | |
| **Perception → Visualization (Kasina)** | `practiceParams.visualization.voidDuration` | `practiceStore.practiceParams` | Yes | Yes | |
| **Perception → Visualization (Kasina)** | `practiceParams.visualization.audioEnabled` | `practiceStore.practiceParams` | Yes | Yes | |
| **Perception → Photic (global-risk)** | `photic.rateHz` | `settingsStore` | Yes | Yes | **Global-risk**: path-driven overrides should be applied as session overrides; do not mutate user defaults for curriculum sessions. |
| **Perception → Photic (global-risk)** | `photic.dutyCycle` | `settingsStore` | Yes | Yes | **Global-risk**. |
| **Perception → Photic (global-risk)** | `photic.timingMode` | `settingsStore` | Yes | Yes | `simultaneous` / `alternating`. **Global-risk**. |
| **Perception → Photic (global-risk)** | `photic.gapMs` | `settingsStore` | Yes | Yes | **Global-risk**. |
| **Perception → Photic (global-risk)** | `photic.brightness` | `settingsStore` | Yes | Yes | **Global-risk**. |
| **Perception → Photic (global-risk)** | `photic.spacingPx` | `settingsStore` | Yes | Yes | **Global-risk**. |
| **Perception → Photic (global-risk)** | `photic.radiusPx` | `settingsStore` | Yes | Yes | **Global-risk**. |
| **Perception → Photic (global-risk)** | `photic.colorLeft` | `settingsStore` | Yes | Yes | **Global-risk**. Supports weekday-specific path overrides (future). |
| **Perception → Photic (global-risk)** | `photic.colorRight` | `settingsStore` | Yes | Yes | **Global-risk**. Supports weekday-specific path overrides (future). |
| **Perception → Photic (global-risk)** | `photic.linkColors` | `settingsStore` | Yes | Yes | **Global-risk**. |
| **Perception → Photic (global-risk)** | `photic.bgOpacity` | `settingsStore` | Yes | Yes | **Global-risk**. |

**Implementation note (required for future paths)**: for any row marked **global-risk**, path-driven launches must use a *session override layer* (effective config = user defaults + overrides) rather than mutating the persisted store. This prevents path-driven settings (example: weekday photic colors) from leaking into free practice.

### **2. Navigation & Path Domain** (`navigation`, `program selection`, `consistency`, `curriculum`)
- **Stores owning navigation state**:
  - `navigationStore` (key `immanence_navigation_state`): Active path, selected path ID, quiz unlocks, foundation video flag, last activity timestamp
  - `cycleStore` (key `immanence_cycle_state`): Current cycle metadata, checkpoints, consistency tracking, cycle progression
  - `curriculumStore` (key `immanence_curriculum`): Onboarding completion, active curriculum, day/leg completions, active practice session pointers, **schedule (practiceTimeSlots)**, **precision configuration (precisionMode, offDaysOfWeek)**
- **Source of truth**: Navigation store holds the current run state; curriculum store gates progression and holds canonical schedule; cycle store tracks consistency
- **Derived**: Program badges (cycle status), path recommendations (history-based), unlock flags based on activity; precision rail (14-day rolling window with category/time adherence)
- **Note**: `navigationStore.scheduleSlots` is deprecated; use `curriculumStore.practiceTimeSlots` (canonical) instead (Phase 6 unification)

### **2a. Curriculum Precision Rail System** (Schedule adherence tracking & visualization)

**Objective**: Provide a deterministic, category-aware 14-day rolling window visualization of practice schedule adherence, with immutable snapshots computed at session record time.

#### **Canonical Sources**
- **Schedule**: `curriculumStore.practiceTimeSlots` (array of up to 3 "HH:mm" strings, normalized at write time)
- **Curriculum days**: `curriculumStore.getCurriculumDay(dayNumber)` (each day contains required legs with categoryId, matchPolicy, practiceId)
- **Session truth**: `progressStore.sessionsV2[]` (normalized session records with immutable `scheduleMatched` snapshot)
- **Precision rail computation**: `src/services/infographics/curriculumRail.js::getCurriculumPrecisionRail()` (pure function, no side effects)
- **UI infographic**: `src/components/infographics/CurriculumPrecisionRail.jsx` (read-only, mounted in DailyPracticeCard)

#### **Precision Semantics (Non-Negotiable)**

Each day in the 14-day window is assigned one of four states based on session adherence to curriculum legs:

| State | Meaning | Condition |
|-------|---------|-----------|
| **GRAY** | Not measured | Vacation active, advanced mode enabled, off-day, or before curriculum start |
| **BLANK** | Incomplete | At least one required leg has no matching session (status = null) |
| **GREEN** | All on-time | All required legs matched with |deltaMinutes| ≤ 15 |
| **RED** | Some late | All required legs matched but at least one has 15 < \|deltaMinutes\| ≤ 60 |

**Key invariant**: A session matching result depends on:
1. **Category match**: session.categoryId must equal leg.categoryId (resolved via `resolveCategoryIdFromSessionV2`)
2. **Time adherence**: |deltaMinutes| where deltaMinutes = session.startedAt local time - scheduled time in leg
   - ≤ 15 min → GREEN
   - 15–60 min → RED
   - > 60 min → OUTSIDE (does not count; treated as unmatched)
3. **Match policy**: if leg.matchPolicy = EXACT_PRACTICE, session.practiceId must match leg.practiceId
4. **One session per leg**: Greedy matching; once a session is used for a leg, it is not reused (prevents double-counting)

#### **Deterministic Snapshots (Phase 7)**

At session record time (in `sessionRecorder.js`), a `scheduleMatched` snapshot is computed and persisted:

```javascript
scheduleMatched: {
  legNumber: number,              // 1-based leg in curriculum day
  categoryId: string,             // e.g., 'breathwork', 'awareness', 'visualization'
  matchPolicy: string,            // 'exact_practice' | 'any_in_category'
  scheduledTime: 'HH:mm',        // Expected time for this leg
  deltaMinutes: number,           // Signed delta (negative = early, positive = late)
  status: 'green' | 'red',        // Classification; null if unmatched
  matchedAt: ISO string,          // Audit trail (when snapshot was created)
}
```

**Determinism rule**: Once recorded, `scheduleMatched` is **never** recomputed or mutated. The rail uses this snapshot as the source of truth (fast-path); only sessions without snapshots (pre-Phase-7 data) fall back to computed matching.

**Backward compatibility**: Sessions recorded before Phase 7 have `scheduleMatched = null` and are matched using the fallback computed logic in curriculumRail.js. They produce identical results but require recomputation on every render.

#### **Rail Computation Flow**

1. **Get 14-day window**: Construct array of dates from `(today - 13 days)` to `today` in local timezone
2. **For each day**:
   - Determine day status (GRAY/BLANK/GREEN/RED) based on:
     - Vacation + off-day check → GRAY
     - Curriculum day existence check → GRAY if not found
     - Required legs extraction (only `leg.required === true`)
     - Session matching (prefer `scheduleMatched` snapshot; fallback to computed)
     - Day status determination:
       - Any leg unmatched → BLANK
       - All matched, any RED → RED
       - All matched, all GREEN → GREEN
3. **Return rail**: Array of 14 objects with day status + satisfiedSlots details (used by UI)

#### **UI Representation**

The precision rail is visualized as a **14-cell grid** (oldest on left, newest on right):
- GRAY cells: dim, low opacity (no measurement required)
- BLANK cells: transparent with subtle border (incomplete)
- GREEN cells: bright green with ✓ symbol (success)
- RED cells: bright red with ! symbol (late but counted)
- Hover tooltip: Shows date, day status, and leg-level details (legNumber, categoryId, time, delta, status)

Mounted in: `src/components/DailyPracticeCard.jsx` (below progress meter)

### **3. Progress & Tracking Domain** (`history`, `stats`, `streak`, `vacation`)
- **Stores owning progress state**:
  - `progressStore` (key `immanence_progress`): Authoritative `sessionsV2` (normalized session records), `honorLogs` (honor practices), `streak`, `vacation`, `benchmarks`, `goals`
  - `journalStore` (key `immanence_journal`): Post-session journal entries paired with session IDs
  - `wisdomStore`, `videoStore`: Domain-specific reading/watch history
- **Source of truth**: `progressStore.sessionsV2` is the canonical session spine; `honorLogs` for non-practice contributions; `journalStore` for narrative context
- **Derived**: Streak calculations, weekly patterns, trajectory forecasts, domain stats (computed from spine on read)

### **4. Tutorial & Onboarding Domain** (`guidance`, `help`, `flow state`)
- **Stores owning tutorial state**:
  - `tutorialStore` (key `immanence.tutorial`): Current tutorial ID, step index, completion flags per tutorial
  - `curriculumStore` (partial): Onboarding gates (should show welcome, completions, thought catalog)
- **Source of truth**: Tutorial store holds current tutorial state; curriculum gates initial onboarding
- **Derived**: Tutorial visibility (based on section, practice type), step positioning, admin override state

### **5. Display & Settings Domain** (`viewport`, `theme`, `preferences`)
- **Stores owning display state**:
  - `displayModeStore` (key `immanence_display_mode`): Mode (sanctuary/hearth), viewport mode, color scheme, stage asset style
  - `settingsStore` (key `immanence_settings`): Display preferences, LLM model, volume, avatar naming, photic circles config
- **Source of truth**: Display mode for layout decisions; settings for user preferences
- **Derived**: Responsive breakpoints, stage colors (based on lunar phase + mode)

## Routing

- **Section switcher**: `App.jsx` owns `activeSection` (`null` = HomeHub, `practice`, `navigation`, `wisdom`, `application`). Default view comes from `localStorage` (`immanenceOS.defaultView`), with a first-run `WelcomeScreen` gate and curriculum onboarding/completion gates from `curriculumStore`.
- **Section consumers**: `SectionView` renders the requested section; avatar and stage title are suppressed for `navigation`/`application` (those sections render their own avatars) and for ritual library overlays.
- **Navigators**:
  - `HomeHub` calls `onSelectSection` to set `activeSection`.
  - `ApplicationSection` empty state button calls `onNavigate('navigation')` to send users back to path selection.
  - Practice summary flows stay inside `PracticeSection`; returning to HomeHub uses the `Home` button in the header.
- **Tracking Archive deep links**: `SessionHistoryView` accepts `initialTab` and `initialReportDomain`; use `src/components/tracking/archiveLinkConstants.js` for stable tab/domain keys.
- **Stage/path preview state**: `App` holds `previewStage`, `previewPath`, `previewAttention`, and `previewShowCore`, updating them via `onStageChange` callbacks from avatars and propagating to `ThemeProvider` + `StageTitle`.

## Context Definitions (Menu Context vs. Running Context)

Two critical context layers govern practice and navigation behavior:

### **Menu Context** (Configuration/Selection Phase)
- **Active in**: Practice selector, navigation path selector, ritual library, config panels
- **What it owns**: User preferences, selected practice type, active submode, duration, practice-specific config (breath preset, sound frequency, etc.)
- **Storage**: `practiceStore.practiceParams` (persisted per practice), `navigationStore.selectedPathId`, component local state for transient UI choices
- **Lifecycle**: Lives until user clicks "Begin Practice" or changes practice type
- **Example**: User in `PracticeSection` toggles between "Breath & Stillness" and "Sound", adjusts breath pattern in config panel. Menu context holds `{ practiceId: 'breath', preset: 'Box', pattern: {...} }`. If they switch to Sound without starting, context changes to `{ practiceId: 'resonance', practiceMode: 'sound', soundType: 'Binaural' }`.

### **Launch Context** (One-Shot Cross-Section Intent)
- **Active in**: Any UI surface that wants to launch another surface with specific parameters (paths → practice, curriculum → practice, paths → wisdom chapter/video).
- **Storage**: `uiStore` (`practiceLaunchContext`, `contentLaunchContext`) — transient, in-memory only.
- **Lifecycle**: Written by the source surface, consumed by the destination surface, then cleared immediately.
- **Practice launch shape**: `{ source, practiceId, durationMin, practiceParamsPatch?, overrides?, locks?, practiceConfig?, pathContext?, persistPreferences? }`.
  - `practiceParamsPatch` is legacy/back-compat; prefer `overrides.practiceParams`.
  - `overrides` is session-scoped and may include global-risk settings (example: `overrides.settings.photic`).
  - `locks` defines which keys are immutable for curriculum-launched sessions; if omitted for `source: "dailySchedule"`, `PracticeSection` applies default locks via `sessionOverrideStore`.
  - **Key invariant**: when `persistPreferences === false`, the launch must not overwrite `practiceStore` saved preferences (it is a contextual recommendation, not a user choice).
- **Content launch shape**: `{ target: 'chapter'|'video', chapterId?|videoId?, durationMin? }`.
- **Example**: User clicks a path’s “Morning Breath (7m)” slot → `uiStore.practiceLaunchContext` sets duration + preset, `PracticeSection` consumes it, runs the session, and restores user prefs afterward.

### **Running Context** (Active Session Phase)
- **Active in**: Practice session actively running (timer ticking, visual/audio active)
- **What it owns**: Current phase/cycle progress, elapsed time, pause/resume state, user interruptions (click "Done" early, timeout, etc.), session instrumentation (exit type)
- **Storage**: In-memory hooks (`useBreathSessionState`, `usePracticeSessionInstrumentation`), RAF loops for timers
- **Lifecycle**: Created when practice starts; destroyed on completion, abandonment, or section switch
- **Snapshot saved on exit**: `recordPracticeSession` captures menu context as `configSnapshot` + running state as `instrumentation`/`completion`
- **Example**: User runs Breath & Stillness for 10 minutes. Running context tracks phase progress (inhale 4s → hold 4s → exhale 4s → hold 4s, repeat). At minute 8, user clicks "Done" early; running context exit type becomes `'completed'` (intentional exit); session records with duration 8 min, exit type, and breath config snapshot.

### **Context Continuity on Return**
- **After session completes**: Menu context is restored from `practiceStore` (user's last saved preferences) OR from `curriculumStore` if an active leg is loaded
- **After modal closes**: If user opens tutorial or settings, menu context is suspended but not cleared; upon close, user returns to same practice/config state
- **Path/practice switching**: Switching practice type clears running context but preserves menu context of the previous practice in `practiceStore`

## Defaults & Fallbacks (Explicit Statement)

### **Practice Defaults**
- **Primary fallback**: Breath & Stillness (`practiceId: 'breath'`)
- **When applied**:
  - App startup if no prior practice was used (`practiceStore` empty)
  - After currency/program completion if no practice selected
  - User clicks "Quick Start" without previous context
- **Breath-specific defaults** (from `practiceStore.PER_PRACTICE_DEFAULTS.breath`):
  - Preset: `'Box'` (4-4-4-4 pattern)
  - Pattern: `{ inhale: 4, hold1: 4, exhale: 4, hold2: 4 }` (seconds)
  - Duration: 10 minutes

### **Navigation Defaults**
- **Primary fallback**: HomeHub (`activeSection: null`)
- **When applied**: App startup, user clicks home button, section unmounts without explicit navigation
- **Path selection defaults**:
  - If user has no `activePath`: static path grid displays with program cards (Foundation Cycle, Thought Detachment) prepended
  - If user completes a path: `navigationStore.activePath` clears; next view shows static grid
  - If no `selectedPathId`: first path in grid is highlighted (visual only, not auto-selected)

### **Curriculum Defaults**
- **Onboarding gate** (first-run):
  - If `curriculumStore.onboardingComplete === false`: `WelcomeScreen` blocks all sections
  - After welcome: Thought Detachment or Foundation Cycle modal opens (depends on user choice)
- **Active curriculum fallback**:
  - If no curriculum in progress: HomeHub shows "Start curriculum" option
  - If curriculum abandoned: streak frozen, next start re-initializes curriculum

### **Display Mode Defaults**
- **Width mode**: Sanctuary (820px) on desktop; Hearth (430px) on mobile (<= 640px viewport)
- **Color scheme**: Dark mode (canonical, performant, reduced eye strain)
  - Light mode opt-in via `displayModeStore.colorScheme: 'light'` (used by dev tools for testing)
- **Stage asset style**: Animated orb (light mode) vs. sigil (dark mode)

### **Session Duration Defaults**
- **Global default**: 10 minutes (`DURATIONS.default`)
- **Min duration for cycle registration**: 10 minutes (`cycleMinDuration`)
- **Min duration for stats**: any duration > 0 minutes (all sessions record)

### **Fallback Chain (Error Recovery)**
When a store read returns `null` or `undefined`:
1. Check in-memory cache (e.g., `useBreathSessionState` memoized state)
2. Check `practiceStore.loadPreferences()` (restores from localStorage)
3. Apply `DEFAULT_PREFERENCES` (hardcoded defaults)
4. If practice type unknown: apply `practiceId: 'breath'` fallback

### **Persistence Fallback**
If localStorage write fails (quota exceeded, privacy mode):
- In-memory session state continues (user can still practice and get stats for current run)
- On reload, all session data is lost (graceful degradation)
- User sees no error; app continues (localStorage writes are fire-and-forget)

## Non-Negotiable Invariants (Semantic Guardrails)

These invariants protect the precision rail system and broader state consistency. They **must never be violated** by future changes without explicit architectural review and documentation update.

### **Session Completion & Counting**
- **Partial completion ≠ full completion**: A session with `completion: 'partial'` is recorded and tracked but does **not** count toward cycle consistency or precision rail completion
- **Only completed sessions count**: Abandoned sessions are recorded for history but ignored in streak/cycle logic
- **One session per leg maximum**: Greedy matching prevents a single session from satisfying multiple legs (enforced by `usedSessionIds` tracking)

### **Time Adherence Boundaries**
- **GREEN threshold**: |deltaMinutes| ≤ 15 (includes 0-15 early or late)
- **RED threshold**: 15 < |deltaMinutes| ≤ 60 (includes edge 16-60)
- **OUTSIDE threshold**: |deltaMinutes| > 60 (not counted; session does not satisfy leg)
- **No rounding**: Time deltas are computed to the minute; 61 minutes is OUTSIDE, not RED

### **Category & Policy Enforcement**
- **Category must match**: session.categoryId (resolved via `resolveCategoryIdFromSessionV2`) must equal leg.categoryId, with no wildcard or pattern matching
- **EXACT_PRACTICE is strict**: If leg.matchPolicy = EXACT_PRACTICE and leg.practiceId is set, session.practiceId must equal it exactly (no prefix/suffix matching)
- **ANY_IN_CATEGORY is permissive**: If leg.matchPolicy = ANY_IN_CATEGORY, any session with matching categoryId satisfies the leg regardless of practiceId

### **Day Status Logic**
- **GRAY gates everything**: Days in GRAY (vacation, off-day, advanced mode, before curriculum start) are never BLANK/GREEN/RED; no measurement occurs
- **BLANK takes precedence**: Any unmatched leg makes the day BLANK, even if other legs are GREEN
- **RED takes precedence over GREEN**: All legs matched is required; if any RED, day is RED (not green mixed with red)
- **No GRAY downgrade**: A day computed as BLANK/GREEN/RED never becomes GRAY after the fact (immutability)

### **Snapshot Determinism**
- **Snapshots are immutable**: Once `scheduleMatched` is computed at record time, it is never recomputed or mutated
- **Snapshot gates fallback**: If a session has a snapshot, computed matching is skipped (no double-evaluation)
- **Fallback is conservative**: Sessions without snapshots use the same matching rules as snapshot computation to ensure consistency
- **No snapshot mutation on data change**: If schedule or curriculum changes after session record, the snapshot does not update (uses historical truth)

### **Schedule & Curriculum Consistency**
- **One canonical schedule**: `curriculumStore.practiceTimeSlots` is the only source; `navigationStore.scheduleSlots` is deprecated read-only
- **Three-slot maximum**: `practiceTimeSlots` contains at most 3 "HH:mm" strings; excess is silently truncated at write time
- **No inter-day mixing**: A session on day N cannot satisfy a leg from day N+1 or N-1; must be same calendar day (local timezone)
- **Curriculum days are immutable after definition**: Curriculum day legs do not change mid-run; if curriculum is updated, active run retains original leg definitions

### **Off-Days & Vacation**
- **Off-days do not weaken cycles**: An off-day (e.g., Sunday) does not extend cycle deadline or forgive missed days
- **Vacation suspends precision, not recording**: Sessions during vacation are recorded and visible in history but do not contribute to precision rail (GRAY)
- **Vacation is boolean**: No partial vacation or time-windowed vacation; either `progressStore.vacation.active` is true or false

### **Advanced Mode**
- **Advanced mode disables precision entirely**: When `curriculumStore.precisionMode = 'advanced'`, all days render GRAY and no snapshots are computed
- **Advanced mode is explicit**: No automatic switching; only toggled via direct action (future UI or DevPanel)

## Deprecation Ledger

This section documents deprecated APIs and their removal conditions. All removals must include data migration.

| **Deprecated Item** | **Deprecation Phase** | **Reason** | **Replacement** | **Removal Condition** |
|---|---|---|---|---|
| `navigationStore.scheduleSlots` | Phase 6 | Schedule duplication; navigationStore should not own curriculum data | `curriculumStore.practiceTimeSlots` | After one release + data migration verification |
| `navigationStore.activePath.schedule.selectedTimes` | Phase 6 | Duplicate schedule source; path-level schedule redundant with curriculum | `curriculumStore.practiceTimeSlots` via `getPracticeTimeSlots()` | After one release; migration in `onRehydrateStorage` |
| Computed-only rail matching (no snapshots) | Phase 7 | Performance + consistency; snapshots provide immutable audit trail | `sessionRecorder.js::computeScheduleMatchedSnapshot()` | Automatic fallback; no removal needed (backward compatible) |

**Data migration strategy**:
- Phase 6: `navigationStore.onRehydrateStorage()` copies legacy `scheduleSlots` → `curriculumStore.practiceTimeSlots` on first hydration
- Phase 7: Sessions recorded before Phase 7 retain `scheduleMatched = null`; rail falls back to computed matching with identical semantics
- Future removal: If `navigationStore.scheduleSlots` removed, ensure all existing data migrated and active paths have no references

## Store Independence (Single Source of Truth)

### Critical Rule: No Two-Way Sync Between Stores

Production tracking follows a **strict one-way data flow** to prevent synchronization errors and maintain immutability:

| Store | Purpose | Authority | Sync Direction | Allowed Operations |
|---|---|---|---|---|
| **progressStore** | Authoritative session spine | ✅ YES (immutable) | N/A | Write sessions, honor logs, streaks; read-only by all other stores |
| **attentionStore** | Weekly feature aggregation | NO | ← READ progressStore | Compute weekly features; trigger re-aggregation on session write |
| **mandalaStore** | Stage/accuracy derivation | NO | ← READ progressStore | Sync derived metrics; trigger on session write |
| **trackingStore** | Dev-only precision meter mocks | NO (dev-only) | Isolated | Inject mock `devModeOverride` for `PrecisionMeterDevPanel` testing only |
| **Other stores** | Various purposes | NO | ← READ progressStore where needed | Read-only access to sessions for secondary computations |

### trackingStore Scope (Dev-Only)

`trackingStore` exists **SOLELY** to inject mock data for testing the precision meter component in DevPanel:

```javascript
devModeOverride: null,           // Array of 7-day mock timing offsets
setDevModeOverride(mockData),    // Inject mock data
clearDevModeOverride(),          // Reset to empty
getWeeklyTimingOffsets(),        // Return mock if active; else []
```

**Restrictions:**
- ❌ DO NOT record sessions to `trackingStore`
- ❌ DO NOT sync data between `trackingStore` and `progressStore`
- ❌ DO NOT store production data in `trackingStore`
- ❌ DO NOT compute stats in `trackingStore`
- ✅ DO use `trackingStore` for testing precision meter mock injection (DevPanel only)

### Consequence of Store Independence

- ✅ **No sync bugs**: Each store controls its own data; no conflicts possible
- ✅ **Immutable sources**: productionStore data never mutated by derived stores
- ✅ **Clear ownership**: Each store has explicit responsibility; no ambiguity
- ✅ **Testability**: Dev-only stores isolated from production data flow
- ✅ **Debugging**: Track data changes through explicit one-way flow only

## Source of Truth vs. Derived State (Reference Matrix)

| **Data Type** | **Source of Truth** | **Derivers** | **Fallback** |
|---|---|---|---|
| **Practice preferences** | `practiceStore` (localStorage) | `PracticeSection` (reader), sessions on save | `DEFAULT_PREFERENCES` |
| **Active session state** | In-memory hooks (`useBreathSessionState`) | Active timer loop, RAF updates | None (ephemeral) |
| **Session records** | `progressStore.sessionsV2` (localStorage) | `recordPracticeSession` (writer), read by stats | Legacy `sessions` array |
| **Honor logs** | `progressStore.honorLogs` (localStorage) | `recordHonorPractice`, read by stats | Empty array |
| **Streak data** | `progressStore.streak` (localStorage) | Computed from sessions on read via `getStreakInfo` | `{ lastPracticeDate: null, longest: 0 }` |
| **Active path/curriculum** | `navigationStore.activePath` (localStorage) + `curriculumStore` (localStorage) | `beginPath`, `completeWeek`, `abandonPath` | `null` / static path grid |
| **Cycle progress** | `cycleStore.currentCycle` (localStorage) | `startCycle`, `logPracticeDay`, `stopCycle` | `null` |
| **Onboarding state** | `curriculumStore.onboardingComplete` (localStorage) | `completeOnboarding`, gates `WelcomeScreen` | `false` (show on first run) |
| **Display mode** | `displayModeStore.mode` (localStorage) | Viewport listener, user toggles | Detect from viewport |
| **Tutorial state** | `tutorialStore` (localStorage) | `openTutorial`, `nextStep`, `closeTutorial` | `{ tutorialId: null, stepIndex: 0 }` |
| **Weekly pattern** | Derived from `progressStore.sessionsV2` | `getWeeklyPattern` selector (computed on read) | Empty pattern |
| **Trajectory forecast** | Derived from sessions + time-series | `getTrajectory` selector (computed on read) | Linear interpolation |
| **Mandala aggregates** | Derived from `progressStore` | `syncFromProgressStore` (re-computed on write) | Recompute on demand |
| **Stage colors** | Derived from `lunarStore.stage` + `displayModeStore.colorScheme` | Theme context + stage presets | Neutral (Seedling) |

## Stores (ownership, key actions, wiring)

- **progressStore** (`src/state/progressStore.js`)
  - Owns: `sessions` (legacy v1 array), `sessionsV2` (authoritative v2 normalized sessions), `honorLogs`, `streak`, `vacation`, `practiceHistory`, `benchmarks`, `consistencyMetrics`, `goals`, display preference.
  - Actions: `recordSessionV2` (primary writer for normalized sessions), `recordSession` (legacy, do not use), `logHonorPractice`, display preference setters. Selectors: `getStreakInfo`, `getDomainStats`, `getWeeklyPattern`, `getHonorStatus`, `getSessionsWithJournal`, `getPrimaryDomain`.
  - Writers: `recordPracticeSession` (via `recordSessionV2`), `circuitIntegration` (via `recordSessionV2`), DevPanel mock loaders.
  - Readers: `HomeHub` (streak/domain stats/weekly pattern), `TrackingHub`, `DishonorBadge`, `CompactStatsCard`, `TrajectoryCard`, `DevPanel`, `SessionHistoryView`.
  - **V2 Session Schema** (authoritative, persisted in `sessionsV2`):
    - `id`: unique session identifier
    - `startedAt`: ISO 8601 timestamp of session start
    - `endedAt`: ISO 8601 timestamp of session end
    - `durationSec`: duration in seconds (normalized from various input formats)
    - `practiceId`: consolidated practice ID (e.g., `breath`, `awareness`, `resonance`, `perception`, `feeling`, `integration`, `circuit`)
    - `practiceMode`: submode for umbrella practices (e.g., `vipassana`/`sound`/`cymatics`/`visualization`/`photic`/`feeling` under umbrella domains)
    - `configSnapshot`: object containing practice-specific settings at recording time (e.g., `{ preset: 'Box', pattern: {...} }` for breath, `{ soundType, frequency }` for sound)
    - `completion`: `'completed'`|`'abandoned'`|`'partial'` (completion status of session)
    - `metadata`: arbitrary session metadata (instrumentation, notes, custom context)
    - `pathContext`: object with `{ activePathId, runId, dayIndex, weekIndex }` linking to navigation path state at recording time
  - **V1→V2 Migration** (automatic): `loadPreferences()` and on-read helpers map legacy IDs/labels via `LEGACY_MAP` to consolidated umbrella IDs; `sessionsV2` is authoritative, with legacy `sessions` as fallback.
- **Centralized Session Recording: recordPracticeSession**
  - Location: `src/services/sessionRecorder.js`
  - Purpose: single authoritative entry point for session completion writes; normalizes input formats and manages downstream syncs (mandala, cycle gating) without duplication.
  - Why: eliminates duplicate write paths, keeps instrumentation/cycle consistency, manages exit type normalization and path context resolution.
  - Function signature: `recordPracticeSession(payload = {}, options = {})`
  - **Payload fields** (incoming from practice runner):
    - `domain`: practice domain string (resolved to umbrella ID for v2)
    - `duration`: minutes (converted to `durationSec`)
    - `metadata`: arbitrary session metadata object
    - `instrumentation`: object with `{ exit_type, duration_ms, ... }` tracking user action type (click "Done", timeout, etc.)
    - `exitType`: string `'completed'|'abandoned'` (overrides/supplements `instrumentation.exit_type`)
    - `practiceId`: consolidated practice ID (e.g., `'breath'`, `'awareness'`, `'feeling'`)
    - `practiceMode`: submode within umbrella (e.g., `'vipassana'` under `'awareness'`, `'cymatics'` under `'resonance'`)
    - `configSnapshot`: object capturing practice settings at record time (e.g., `{ preset, pattern }` for breath; `{ soundType, frequency }` for sound; `{ mode, promptMode, intent }` for feeling)
    - `completion`: explicit completion status override (`'completed'|'abandoned'|'partial'`)
    - `activePathId`, `dayIndex`: path context (optional; resolved from `navigationStore.activePath` if not provided)
    - `startedAt`, `endedAt`: ISO timestamps (endedAt defaults to now; startedAt computed from durationSec + endedAt if not provided)
    - `durationSec`: raw duration in seconds (takes precedence if provided)
  - **Options** (control recorder behavior):
    - `persistSession`: boolean (default `true`); whether to write to `progressStore.sessionsV2`
    - `syncMandala`: boolean (default `true`); whether to trigger mandala store sync
    - `cycleEnabled`: boolean (default `false`); whether to check cycle gating
    - `cycleMinDuration`: number (default 10); minimum minutes before cycle registration
    - `cyclePracticeData`: object (optional); alternative practice metadata for cycle-only logging (e.g., ritual/circuit completion without a session record)
  - **Phase 7 Enhancement (Snapshot)**: Deterministic `scheduleMatched` snapshot computed at record time
    - If `startedAt` is valid and curriculum/precision rail is available:
      - Resolve session category via `resolveCategoryIdFromSessionV2({ practiceId, practiceMode })`
      - Find curriculum day for session date
      - Match session to required legs by category + time adherence (|deltaMinutes| ≤ 60)
      - Capture best match (closest time) as immutable snapshot object
      - If no match: snapshot is `null` (treated as unmatched by rail)
    - Snapshot structure: `{ legNumber, categoryId, matchPolicy, scheduledTime, deltaMinutes, status, matchedAt }`
    - Snapshot is never recomputed or mutated after record; persisted in `sessionsV2`
    - Rail prefers snapshot when present (fast-path); falls back to computed matching for pre-Phase-7 sessions
  - **Execution order**:
    1. Normalize instrumentation (`exit_type` field) from exitType + existing instrumentation
    2. If `persistSession=true`:
       - Normalize/resolve all fields (duration, timestamps, path context, completion status)
       - **Compute `scheduleMatched` snapshot** (Phase 7)
       - Persist to `progressStore.recordSessionV2()`
    3. If `cycleEnabled=true`: check if `durationSec >= cycleMinDuration * 60`; if so, call `logPractice(cycleType, duration, metadata)` from `cycleManager.js`
    4. If `syncMandala=true`: trigger `syncFromProgressStore()` exactly once at end of recorder execution
  - **Examples**:
    - Normal practice completion: `recordPracticeSession({ domain: 'breathwork', duration: 12, metadata: {...}, instrumentation: { exit_type: 'user_clicked_done' }, practiceId: 'breath', practiceMode: undefined, configSnapshot: { preset: 'Box', pattern: {...} }, exitType: 'completed' }, { cycleEnabled: true, cycleMinDuration: 10 })`
    - Circuit/ritual completion (cycle only, no session): `recordPracticeSession({ /* metadata describing circuit event */ }, { persistSession: false, cycleEnabled: true, cycleMinDuration: 0, cyclePracticeData: { type: 'circuit', duration: 20 } })`
    - Feeling/Emotion practice: `recordPracticeSession({ domain: 'focus', duration: 8, practiceId: 'feeling', practiceMode: 'discomfort', configSnapshot: { mode: 'discomfort', intent: 'compassion', promptText: '...' }, exitType: 'completed' }, { cycleEnabled: true })`
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
- **uiStore** (`src/state/uiStore.js`)
  - Owns (transient, not persisted): `practiceLaunchContext`, `contentLaunchContext`.
  - Writers: `HomeHub`/`DailyPracticeCard` (practice launch), `NavigationSection`/`PathOverviewPanel`/`ActivePathState` (chapter/video deep links), future curriculum content links.
  - Readers: `PracticeSection` (consume practice context), `WisdomSection`/`VideoLibrary` (consume content context).
- **wisdomStore** (`src/state/wisdomStore.js`)
  - Owns: reading sessions, bookmarks, **completedSections** (chapter completion map), quiz unlocks, flashcard state, recommendation history.
  - Actions: `recordReadingSession`, `markSectionCompleted`, `addBookmark/removeBookmark`, quiz + flashcard helpers.
  - Readers/Writers: `WisdomSection` (Treatise reading/bookmarks/recommendations; completion inferred from scroll depth + time spent), domain stats surfaces and reports.
- **ritualStore** (`src/state/ritualStore.js`)
  - Owns: ritual run state (`id`, `startTime`, `currentStep`, `status`, `stepData`, `photoUrl`, `selectedMemory`).
  - Actions: `startRitual/advanceStep/goToStep/recordStepData/setPhotoUrl/setSelectedMemory/resetRitual/completeRitual`.
  - Used by legacy `RitualPortal` flow (not wired into current practice selection) to coordinate guided multi-step ritual + `logRitualResult` service call.
- **practiceStore** (`src/state/practiceStore.js`)
  - Owns: persisted practice preferences and session history via localStorage.
  - State: `GLOBAL_DEFAULTS` (default practice ID, default duration), `PER_PRACTICE_DEFAULTS` (per-practice config like preset, pattern, settings), `LEGACY_MAP` (migration from old labels/IDs to consolidated umbrella IDs).
  - Actions: `loadPreferences()` (applies LEGACY_MAP to normalize stored IDs), `savePreferences()`, `loadSessions()`, `addSession()`.
  - **Key Variables**:
    - **Consolidated umbrella practice IDs**: `breath`, `integration`, `circuit`, `awareness`, `resonance`, `perception`, `feeling` (replace older granular IDs like `insight`, `bodyscan`, `visualization`, `cymatics`, `photic`).
    - **Per-practice parameter defaults** example for `sound`: `{ soundType, volume, binauralPresetId, isochronicPresetId, exactHz, reverbWet, chorusWet, carrierFrequency }`.
    - **Per-practice parameter defaults for feeling** (Emotion practice): `{ mode: 'discomfort'|'tension'|'joy', promptMode: 'minimal'|'rich', intent: 'compassion'|..., promptText }`.
    - **LEGACY_MAP entries** map old labels ("Breath & Stillness", "Insight Meditation", etc.) and old IDs ("insight", "bodyscan", etc.) to consolidated umbrella IDs for seamless migration on load.
  - Used by `PracticeSection` (loading/saving defaults and practice-specific config) and legacy `RitualPortal` (breath pattern seed).
- **Other supporting stores**: `lunarStore` (stage progression used by HomeHub), `pathStore` (attention instrumentation fed by progressStore + wisdomStore), `videoStore` (video playback state), `sigilStore`, `mandalaStore`, `applicationStore/attentionStore/historyStore` (used inside Application/Tracking surfaces). These are read-only for this document unless wiring above references them.

## Static Data vs. Dynamic State

- **Program & path definitions**: `src/data/navigationData.js` exposes path catalog and `getAllPaths()`; combines with program cards declared in `PathSelectionGrid`.
- **Ritual definitions**: `src/data/rituals/index.js` (registry + `RITUAL_CATEGORIES`), with category files under `src/data/rituals/*`. Thought Detachment ritual is assembled ad-hoc inside `ThoughtDetachmentOnboarding`.
- **Curriculum**: `src/data/ritualFoundation14.js` drives the 14-day ritual foundation program consumed by `curriculumStore`.
- **Practice catalogs**: `ringFXPresets`, `vipassanaThemes`, `practiceFamily`, `emotionPractices`, practice presets files under `src/data` and `src/utils/frequencyLibrary.js` feed selectors in `PracticeSection`.
  - **practiceFamily.js** — Pure mapping from practice metadata → attentional family (SETTLE, SCAN, RELATE, INQUIRE). Priority: sensoryType (e.g., `bodyScan` → SCAN, `bhakti` → RELATE) > ritualCategory (e.g., `grounding` → SETTLE) > domain (e.g., `breathwork` → SETTLE). Domains `yoga` and `wisdom` are omitted (span multiple families); must resolve via sensoryType/ritualCategory.
  - **emotionPractices.js** — Feeling/Emotion practice metadata including modes (`discomfort`, `tension`, `joy`), prompt text, and closing lines. Used by EmotionConfig UI and session recording for feeling-specific summary context.
- **Wisdom content**: `treatise.generated.js` + `treatiseParts.js` (chapters/parts), `wisdomRecommendations.js`, `videoData.js` power `WisdomSection` tabs.

## Component boundaries (runners vs. selectors vs. legacy)

- **Runners**: `RitualSession` (full-screen ritual playback/timer), `PracticeSection` session renderer, `CircuitTrainer` (via CircuitConfig/execution), `VipassanaVariantSelector` start gate for cognitive vipassana, `PhoticCirclesOverlay` (photic entrainment), `EmotionConfig` (Feeling/Emotion practice runner).
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

### Feeling/Emotion Practice → Configure → Run session → Record with metadata

1. **Entry point**: User selects "Feeling" practice type in `PracticeSection`.
2. **Configure**: `EmotionConfig` presents mode selector (`discomfort`|`tension`|`joy`), prompt mode (`minimal`|`rich`), intent selector, and optional custom prompt text. Config persists to `practiceStore.practiceParams.feeling`.
3. **Run session**: Click "Begin Practice" → timer starts, prompt displays on-screen (based on chosen mode/promptMode), user engages with prompt until duration expires or user clicks "Done".
4. **Completion write**: `PracticeSection.handleStop` calls `recordPracticeSession` with:
   - `practiceId: 'feeling'`
   - `practiceMode: 'feeling'` (no submode variants)
   - `configSnapshot: { mode, promptMode, intent, promptText }` (captures user-selected feeling context)
   - `exitType: 'completed'|'abandoned'`
5. **Closing context**: If `curriculumStore` has active leg, `curriculumStore.logLegCompletion` is called with closing line fetched from `getEmotionClosingLine(mode)` for post-session narrative context.
6. **Stats update**: `progressStore.recordSessionV2` creates V2 session entry; `cycleManager` registers practice if duration ≥ 10 minutes; mandala syncs on completion.

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
- **PracticeSection** (`src/components/PracticeSection/PracticeSection.jsx` + `src/components/PracticeSection.jsx`)
  - Role: orchestration layer for the practice lifecycle and session state; coordinates UI components while retaining ownership of state, effects, and side effects.
  - **Practice Registry** (`src/components/PracticeSection/constants.js`): 
    - `PRACTICE_REGISTRY`: maps consolidated practice IDs to metadata (label, icon, description, config component, subModes)
    - `PRACTICE_IDS`: all practice identifiers (`breath`, `integration`, `circuit`, `awareness`, `resonance`, `perception`, `feeling`)
    - `GRID_PRACTICE_IDS`: subset available in primary selector grid
    - `OLD_TO_NEW_PRACTICE_MAP`: legacy ID/label → consolidated ID mapping
    - `resolvePracticeId()`: normalizes old IDs to new consolidated IDs
  - **Consolidated Umbrella Practice IDs**:
    - `breath`: "Breath & Stillness" (breathwork singular)
    - `integration`: "Ritual" (rituals, ceremonies, guided practices)
    - `circuit`: "Circuit" (circuit training, drills)
    - `awareness`: "Awareness" (vipassana, body scan, insight meditation) → subModes: `vipassana`|`sound`|`cymatics`|`visualization`|`photic`|`feeling` **[DEFERRED: refactoring in progress]**
    - `resonance`: "Resonance" (sound, binaural, isochronic) → subModes: `sound` (active), `cymatics`
    - `perception`: "Perception" (visualization, photic, visual entrainment) → subModes: `visualization`, `photic`
    - `feeling`: "Feeling" (emotion/feeling practices) → no subModes, single runner
  - **Primary components**: practice pickers (`PracticeSelector`, `SacredTimeSlider`, `PracticeOptionsCard`), configs (`BreathConfig`, `SensoryConfig`, `VipassanaVariantSelector`, `SoundConfig`, `VisualizationConfig`, `CymaticsConfig`, `CircuitConfig`, `EmotionConfig`), runners (`BreathingRing`, `VipassanaVisual`, `SensorySession`, `VisualizationCanvas`, `CymaticsVisualization`, `NavigationRitualLibrary`, `PhoticCirclesOverlay`), `SessionSummaryModal`, `PostSessionJournal`, `TempoSyncPanel` (Breath & Stillness only).
  - **Inputs**: props (`onPracticingChange`, `onBreathStateChange`), `practiceStore` preferences (loaded via `loadPreferences()`, normalized via LEGACY_MAP), `curriculumStore` active sessions/legs, `displayModeStore.colorScheme`, `useSessionInstrumentation` hook state; `tempoSyncStore` selectors (`enabled`, `getPhaseDuration()`, `beatsPerPhase`) passed to `PracticeOptionsCard`.
  - **Outputs**: `recordPracticeSession` (via `sessionRecorder.js`), `curriculumStore.logLegCompletion`, `logCircuitCompletion`, `onPracticingChange` callbacks, `onBreathStateChange` updates for avatar; `tempoSyncStore` updates via `useTempoDetection` hook (BPM detection, lock/unlock, multiplier changes).
  - **Navigation next**: none directly; ritual deck "Return to Hub" triggers `handleStop`, home navigation handled by global header button.
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
  - Inputs: static treatise/wisdom/video data, `wisdomStore` bookmarks/reading sessions/completions, `localStorage` scroll positions, optional `uiStore.contentLaunchContext` (deep link intent).
  - Outputs: `wisdomStore.recordReadingSession`, `wisdomStore.markSectionCompleted`, `addBookmark/removeBookmark`; records treatise progress to `localStorage`.
  - Navigation next: section-local tab switches only, but can *consume* cross-section deep links (paths/curriculum → open specific chapter/video).
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

---

## Dashboard Tiles (Phase 9A) — Home Overview Metrics

**Objective**: Render 5 key performance metrics on the HomeHub dashboard without UI mutations, purely derived from reporting layer.

### Architecture

**Data Flow**: `progressStore.sessionsV2` → `selectSessions()` → `aggregators` → `getQuickDashboardTiles()` → `HomeHub` → `<QuickDashboardTiles />`

**Key Principle**: UI layer is read-only; all data transformations happen in pure reporting functions.

### Tile Contract

| Tile ID | Label | Definition | Range | Display Format |
|---------|-------|------------|-------|-----------------|
| `minutes_total` | Total Minutes | Sum of all `durationSec` in scope, divided by 60 | 0–∞ | Integer, "min" unit |
| `sessions_total` | Sessions | Count of all sessions in scope | 0–∞ | Integer |
| `days_active` | Active Days | Count of unique calendar days with ≥1 session | 0–∞ | Integer |
| `completion_rate` | Completion Rate | `completed / (completed + abandoned + partial) * 100` | 0–100 | Percent integer |
| `on_time_rate` | On-Time Rate | `green / (green + red) * 100` (from `scheduleMatched`); null if no denominator | 0–100 or null | Percent integer or "—" |

### Completion Status Vocabulary

Sessions normalized by `aggCompletionBreakdown()` to canonical statuses:

- **completed**: Session finished as planned
- **abandoned**: Session terminated early without full completion
- **partial**: Session completed but under threshold, or exit type unclear
- **Note**: Legacy tokens `"early_exit"`, `"earlyExit"` automatically normalized to `"partial"`

### On-Time Rate Semantics

- Uses `session.scheduleMatched` snapshot (computed at record time in `sessionRecorder.js`)
- **GREEN**: |deltaMinutes| ≤ 15 (within 15 min of scheduled time)
- **RED**: 15 < |deltaMinutes| ≤ 60 (late but within grace window)
- **null** denominator → tile shows "—" (no adherence data available)

### Scope & Range Policy

**Policy file**: `src/reporting/tilePolicy.js::getHomeDashboardPolicy()`

Default rules:

- **scope**: `'runId'` if `activePath.runId` exists, else `'lifetime'`
- **range**: `'30d'` (fixed for home dashboard)
- **includeHonor**: `true` (comprehensive view)

### Components

**Pure UI layer**:

- `src/components/dashboard/QuickDashboardTiles.jsx`: Renders 5-tile layout with styling
- `src/components/HomeHub.jsx`: Wires tiles using `getQuickDashboardTiles()` and policy

**Reporting layer** (pure functions):

- `src/reporting/selectSessions.js`: Filter sessions by scope/range
- `src/reporting/aggregators.js`: Reduce to metrics (minutes, counts, adherence)
- `src/reporting/dashboardProjection.js`: Compose `getQuickDashboardTiles()`
- `src/reporting/tilePolicy.js`: Determine policy inputs from navigation state

### No Mutations

- Tiles read-only; no UI state management
- No session modifications from dashboard
- Aggregators are pure reducers (no side effects)
- Moon orbit overlay

## Dashboard Detail Expansion (Phase 9B) — Modal Breakdowns & Hub Variant

**Objective**: Extend dashboard with a detail modal showing completion and adherence breakdowns, and provide a compact 4-KPI hub variant for the tracking section.

### Architecture

**Data Flow**: `progressStore.sessionsV2` → `selectSessions()` → `aggregators` → `getDashboardDetail()` → `HomeHub` → `<DashboardDetailModal />`

**Key Principle**: Same read-only pure reporting architecture as Phase 9A, extended with modal component for expanded detail view.

### Modal Contract

The detail modal displays three sections derived from `getDashboardDetail()`:

#### **Completion Breakdown**

| Metric | Source | Definition |
|--------|--------|------------|
| Completed | `aggCompletionBreakdown()` | Count of sessions with `completion === 'completed'` |
| Abandoned | `aggCompletionBreakdown()` | Count of sessions with `completion === 'abandoned'` |
| Partial | `aggCompletionBreakdown()` | Count of sessions with `completion === 'partial'` or legacy `early_exit`/`earlyExit` |
| Completion Rate | `aggQualitySignals()` | `(completed / (completed + abandoned + partial)) * 100` |

#### **Schedule Adherence**

| Metric | Source | Definition |
|--------|--------|------------|
| On-Time | `aggScheduleAdherence()` | Count of sessions with `scheduleMatched.status === 'green'` |
| Late | `aggScheduleAdherence()` | Count of sessions with `scheduleMatched.status === 'red'` |
| Total Matched | `aggScheduleAdherence()` | Count of sessions with `scheduleMatched !== null` |
| Adherence Percent | `aggScheduleAdherence()` | `(greenCount / (greenCount + redCount)) * 100` |

#### **Weekly Activity**

Inherited from Phase 9A; heatmap of session count and total minutes per day of week (7-day aggregation).

### Hub Variant (4-KPI Compact)

The tracking section of HomeHub renders a compact dashboard variant:

- **Grid Layout**: 2×2 KPI tiles (omits `minutes_total` for space efficiency)
- **KPIs Displayed**: `sessions_total`, `days_active`, `completion_rate`, `on_time_rate`
- **Range**: `'90d'` (deeper insight than top dashboard's 30d)
- **Details Button**: Opens modal to show full breakdown
- **Size**: ~50% of previous CompactStatsCard height

### Scope & Range Policy

**Hub-specific ranges**:

- **Top dashboard** (Phase 9A): `'30d'` (quick snapshot)
- **Hub variant** (Phase 9B): `'90d'` (longer-term trends for detailed analysis)
- **scope**: Same as Phase 9A (`'runId'` if active, else `'lifetime'`)
- **includeHonor**: `true`

### Components

**Pure UI layer**:

- `src/components/dashboard/DashboardDetailModal.jsx`: Two-column modal showing completion and adherence breakdowns with light/dark mode support
- `src/components/dashboard/QuickDashboardTiles.jsx`: Extended with `variant='hub'` and `onOpenDetails` callback
- `src/components/HomeHub.jsx`: Wires modal state and detail computation

**Reporting layer** (pure functions, no mutations):

- `src/reporting/dashboardProjection.js::getDashboardDetail()`: Composes aggregators to return `{ completionBreakdown, scheduleAdherence, weeklyActivity }`
- Existing aggregators: `aggCompletionBreakdown()`, `aggScheduleAdherence()`, `aggQualitySignals()`, `getWeeklyActivityHeatmap()`

### No Mutations

- Modal is read-only; no session modifications
- Hub variant is presentational
- Detail data computed fresh on each render (90d window)
- No state mutations during modal open/close

## Hub Card with Infographics (Phase 9B Visual) — SVG-based Dashboard

**Objective**: Replace plain tile layout with rich SVG infographics that convey data through visual form, maintaining glass aesthetic.

### Variant: `hubCard`

Replaces the simpler `hub` variant with pure SVG/CSS infographics for each KPI.

### Infographic Modules

#### **1. Sessions Module**
- **Visual**: Horizontal progress bar (rounded, filled)
- **Soft cap**: 60 sessions (presentational, no semantic meaning)
- **Fill calculation**: `clamp(sessions_total / 60, 0, 1)`
- **Display**: Large number + bar + label "SESSIONS"

#### **2. Active Days Module**
- **Visual**: 14-dot strip (circles, 2-week visual representation)
- **Fill**: `min(days_active, 14)` — dots filled left-to-right
- **Semantic note**: No per-day distribution data, so count-based encoding is honest (shows magnitude without implying daily pattern)
- **Display**: Large number + dot strip + label "ACTIVE DAYS"

#### **3. Completion Rate Module**
- **Visual**: Donut/ring chart using SVG stroke-dasharray
- **Calculation**: `circumference = 2πr`, `dashLength = (rate / 100) * circumference`
- **Rendering**: Filled arc from -90° (top)
- **Display**: Center percentage + ring + label "COMPLETION"
- **Null-safe**: If no data, shows empty ring + "—"

#### **4. On-Time Rate Module**
- **Visual**: Same donut style as completion
- **Null-safe**: Shows "—" + dim ring if `on_time_rate` is null
- **Display**: Center percentage + ring + label "ON-TIME"

### Card Container

- **Glass aesthetic**: Matches HomeHub aesthetic (translucent, blur, subtle border, shadow)
- **Header**: "PROGRESS OVERVIEW" (left) + "90 DAYS" (right)
- **Layout**: 2×2 grid of modules, centered
- **Spacing**: ~16px gap between modules
- **Details button**: Full-width below grid, "VIEW DETAILS" affordance
- **Size**: Approximately 50% height of prior CompactStatsCard
- **Light/dark mode**: Full color scheme support throughout

### Data Source

- `getQuickDashboardTiles({ scope: ..., range: '90d', ... })`
- Returns: `{ sessions_total, days_active, completion_rate, on_time_rate }`
- No new aggregation logic required

### No New Aggregators

- Uses existing `getQuickDashboardTiles()` output
- Visual presentation only; no transformations to data shape
