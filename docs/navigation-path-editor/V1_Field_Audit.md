# Navigation Path Editor V1 Field Audit

## Scope and constraints

This is an audit-only inventory for a future **Navigation Path Editor**. It does not propose runtime changes, store rewrites, or editor UI implementation.

Explicit V1 constraints:

- English-only content; no locale, fallback, or translation fields
- Additive schema only; do not replace the current runtime before V1 ships
- Explicitly excluded from V1: multi-track mixing, captions/transcripts, per-phase cueing, caching, localization

## Current data flow

### Data flow (text diagram)

`PathDefinition shell (src/data/navigationData.js)`  
`-> path selection / onboarding contract (PathSelectionGrid, PathOverviewPanel, pathContract, scheduleSelectionConstraints)`  
`-> active run snapshot (useNavigationStore.beginPath -> activePath)`  
`-> daily launch object (DailyPracticeCard builds slot launch payload + pathContext)`  
`-> transient practice launch context (useUiStore.setPracticeLaunchContext)`  
`-> practice runtime (PracticeSection consumes launch context, applies practiceConfig, preserves pathContext)`  
`-> recorded session (recordPracticeSession -> pathContext + scheduleMatched)`  
`-> adherence/reporting (contractObligations, pathReport, NavigationPathReport)`

### What currently acts as source of truth

1. **Path shell definition**
   - Current source: `src/data/navigationData.js` via `getPathById()` / `getAllPaths()`
   - Consumed by: `PathSelectionGrid`, `PathOverviewPanel`, `useNavigationStore`, `DailyPracticeCard`, `pathContract`, `scheduleSelectionConstraints`

2. **Run-time frozen path instance**
   - Current source: `src/state/navigationStore.js` via `beginPath()`
   - Canonical run snapshot: `activePath = { runId, activePathId, startedAt, endsAt, status, schedule, progress, weekCompletionDates }`

3. **Day/leg obligations**
   - Current source: `src/data/programRegistry.js` -> `getProgramDay()`
   - For the active initiation path, that resolves to `src/data/ritualInitiation14v2.js`
   - Consumed by: `useCurriculumStore.getCurriculumDay()`, `getDayLegsWithStatus()`, `DailyPracticeCard`, `contractObligations`

4. **Practice launch payload**
   - Current source shape: `src/state/uiStore.js` comment on `practiceLaunchContext`
   - Produced by: `DailyPracticeCard` and `HomeHub`
   - Consumed by: `PracticeSection` launch-context effect

5. **Guidance audio**
   - Current consumer exists, but authoring does not yet
   - `PracticeSection` hard-codes `GUIDANCE_AUDIO_PLACEHOLDER` and writes it into `useTempoAudioStore.setSource()`
   - `GuidanceAudioController` consumes `useTempoAudioStore.source`

## Enumerated entities

## PathDefinition

Top-level authorable object for path card copy, activation contract, and the link to the day-plan source.

Recommended minimal insertion point for V1: keep this in `src/data/navigationData.js` (or extract to an adjacent data file still imported by `getPathById()` / `getAllPaths()`). That is the least disruptive location because all current path selection and activation code already reads from there.

## DayPlan

One day in the contract sequence, matching the current `programRegistry -> getProgramDay()` / `ritualInitiation14v2.days[]` shape.

## Leg

One required or optional obligation inside a day. This is the unit that:

- renders in the curriculum-style daily card
- drives adherence matching
- supplies practice launch metadata

## PracticeInstance

Launch-ready practice payload nested under a leg (or used by legacy path slot fallback). This is the shape `PracticeSection` can already consume after it passes through `practiceLaunchContext`.

## GuidanceSpec v1

Minimal per-practice guidance audio assignment metadata. This should be attached to `PracticeInstance`, not treated as a global path field, because the current runtime launches one practice at a time and guidance is practice-scoped.

## V1 Field Inventory

### Required

These are the minimum fields that should be authorable in V1 to cover the current runtime without another schema migration.

#### PathDefinition

| Field | Current consumer / usage | Why it is required |
| --- | --- | --- |
| `id` | `src/data/navigationData.js` `getPathById()`; `src/state/navigationStore.js` `beginPath()`; `src/components/PathSelectionGrid.jsx` selection; `src/components/PathOverviewPanel.jsx` `handleBegin()` | Primary key for selection, activation, and run tracking. |
| `title` | `src/components/PathSelectionGrid.jsx` card title; `src/components/PathOverviewPanel.jsx` hero title; `src/components/DailyPracticeCard.jsx` active-path title | User-visible path name appears in multiple surfaces. |
| `subtitle` | `src/components/PathSelectionGrid.jsx` card subtitle | Card copy is already rendered. |
| `glyph` | `src/components/PathSelectionGrid.jsx` card glyph | Current card UI expects an icon-like marker. |
| `description` | `src/components/PathOverviewPanel.jsx` overview quote/body | Core overview content shown before activation. |
| `contract.totalDays` | `src/utils/pathContract.js` `getPathContract()`; `src/components/PathSelectionGrid.jsx` duration label; `src/components/PathOverviewPanel.jsx` duration copy; `src/state/navigationStore.js` `getPathDurationDays()` | V1 should author the normalized duration explicitly instead of relying on `duration * 7` fallback. |
| `contract.requiredTimeSlots` | `src/utils/pathContract.js` `validatePathActivationSelections()`; `src/utils/scheduleSelectionConstraints.js` `getScheduleConstraintForPath()`; `src/components/PathOverviewPanel.jsx` schedule validation | Controls how many time slots must be chosen before activation. |
| `contract.maxLegsPerDay` | `src/utils/pathContract.js`; `src/utils/scheduleSelectionConstraints.js`; `src/state/navigationStore.js` frozen `activePath.schedule.maxLegsPerDay`; `src/services/infographics/contractObligations.js` leg-limit enforcement | Required for slot caps and adherence math. |
| `contract.requiredLegsPerDay` | `src/utils/pathContract.js`; `src/state/navigationStore.js` frozen run schedule | Needed because adherence and run state currently preserve this separately from slot count. |
| `contract.practiceDaysPerWeek` | `src/utils/pathContract.js`; `src/components/PathOverviewPanel.jsx` day picker validation; `src/state/navigationStore.js` frozen run schedule | Required for paths that constrain active days (for example, `initiation-2`). |
| `requiresBenchmark` | Current source field is `showBreathBenchmark`; consumed by `src/components/PathOverviewPanel.jsx` benchmark gating, `src/state/navigationStore.js` `setSelectedPath()` and `beginPath()`, `src/components/DailyPracticeCard.jsx` benchmark lock state | The editor should author this as explicit path gating. |
| `tracking.curriculumId` | `src/components/PracticeSection.jsx` `resolveInitiationV2BenchmarkContext()`; `src/components/DailyPracticeCard.jsx` `isInitiationV2Path`; `src/data/navigationData.js` current source | This is the bridge from path shell to day/leg obligations. Without it the path cannot bind to its structured day plan. |

#### DayPlan

| Field | Current consumer / usage | Why it is required |
| --- | --- | --- |
| `dayNumber` | `src/state/curriculumStore.js` `getCurriculumDay()`; `src/data/programRegistry.js` `getProgramDay()` | Required lookup key for each day in the sequence. |
| `title` | `src/components/DailyPracticeCard.jsx` `todaysPractice.title` | The current curriculum-style daily card renders this. |
| `legs[]` | `src/state/curriculumStore.js` `getDayLegsWithStatus()` / `getActivePracticeLeg()`; `src/services/infographics/contractObligations.js`; `src/components/DailyPracticeCard.jsx` | Core container for obligations and launches. |

#### Leg

| Field | Current consumer / usage | Why it is required |
| --- | --- | --- |
| `legNumber` | `src/state/curriculumStore.js` `getActivePracticeLeg()` / `getDayLegsWithStatus()`; `src/services/infographics/contractObligations.js`; `src/components/DailyPracticeCard.jsx` | Slot ordering, time-slot mapping, and adherence matching all depend on this ordinal. |
| `label` | `src/components/DailyPracticeCard.jsx` leg title display | Current UI renders this when present. |
| `description` | `src/components/DailyPracticeCard.jsx` leg body copy | Current UI renders this directly. |
| `required` | `src/services/infographics/contractObligations.js` filters `requiredLegs` | Defines whether the leg contributes to adherence obligations. |
| `categoryId` | `src/services/infographics/contractObligations.js` `doesSessionMatchLegCategory()` | Required for matching a recorded session to the obligation. |
| `matchPolicy` | `src/services/infographics/contractObligations.js` `doesSessionMatchLegCategory()` | Required to distinguish category-only vs exact-practice matching. |
| `practiceType` | `src/components/PracticeSection.jsx` curriculum auto-start uses `labelToPracticeId(activeLeg.practiceType)`; `src/components/DailyPracticeCard.jsx` fallback label | Current practice launch still derives the canonical practice from this label in curriculum mode. |
| `practice` (`PracticeInstance`) | `src/state/curriculumStore.js` `getActivePracticeLeg()` returns `practiceConfig`; `src/components/DailyPracticeCard.jsx` shows duration from `leg.practiceConfig.duration`; `src/components/PracticeSection.jsx` consumes `ctx.practiceConfig` | The actual launch payload needs to be authorable, not reconstructed from prose. |

#### PracticeInstance

| Field | Current consumer / usage | Why it is required |
| --- | --- | --- |
| `practiceId` | Current launch payload shape in `src/state/uiStore.js` comment; `src/components/DailyPracticeCard.jsx` path-slot launches; `src/components/PracticeSection.jsx` launch effect | Canonical runtime selector for which practice screen opens. |
| `durationMin` | `src/components/DailyPracticeCard.jsx` launch payload; `src/components/PracticeSection.jsx` sets timer from `ctx.durationMin` and from `activeLeg.practiceConfig.duration` | Practice duration is already runtime-configurable per launch. |
| `practiceConfig.breathPattern` | `src/components/DailyPracticeCard.jsx` `resolvePracticeLaunchFromEntry()`; `src/components/PracticeSection.jsx` maps to `breath.preset` | Needed for breath variants. |
| `practiceConfig.circuitId` | `src/components/DailyPracticeCard.jsx`; `src/components/PracticeSection.jsx` loads the circuit in the launch effect | Needed for circuit launches. |
| `practiceParamsPatch` | `src/state/uiStore.js` launch context shape; `src/components/PracticeSection.jsx` `mergePracticeParamsPatch()` | Existing escape hatch for launch-scoped parameter overrides. Keep it authorable so the editor does not need a second schema later. |
| `guidance` (`GuidanceSpec v1`) | Future editor field; current sink is `src/state/tempoAudioStore.js` `setSource()` and `src/components/audio/GuidanceAudioController.jsx`; current placeholder assignment is `src/components/PracticeSection.jsx` guidance-audio effect | This is the smallest additive place to put per-practice guidance audio without changing the rest of the launch shape later. |

#### GuidanceSpec v1

| Field | Current consumer / usage | Why it is required |
| --- | --- | --- |
| `audioUrl` | Future source for `src/state/tempoAudioStore.js` `setSource()`; current hard-coded placeholder in `src/components/PracticeSection.jsx` | Minimal field needed to replace the placeholder with authored guidance. |

Notes for `GuidanceSpec v1`:

- Keep it English-only in V1.
- One file/stream per practice instance only.
- No mixing, transcript, caption, or phase-segment metadata in V1.

### Optional-soon

These fields already exist in content/data, but the current runtime does not strictly need them to launch and track a path.

#### PathDefinition

| Field | Current consumer / usage | Why it is optional-soon |
| --- | --- | --- |
| `overviewNotes[]` | Present in `src/data/navigationData.js` only | Authored copy exists but is not currently rendered in the inspected path surfaces. |
| `content.chapters[]` | `src/components/PathOverviewPanel.jsx` launches chapters via `launchChapter()` | Useful once non-initiation paths are authorable in the editor. |
| `content.applicationItems[]` | `src/components/PathOverviewPanel.jsx` renders and launches videos via `launchVideo()` | Same as above; not required for the current initiation contract. |
| `content.weeks[]` | `src/components/PathOverviewPanel.jsx` weekly accordion; `src/components/DailyPracticeCard.jsx` legacy slot fallback (`getWeekForDay()`) | Useful for legacy non-curriculum path storytelling, but not required if V1 authors explicit day plans. |
| `tracking.summary` | Present in `src/data/navigationData.js` only | Good editorial summary field, but not currently consumed in the inspected runtime. |
| `tracking.allowedPracticeIds` | Present as `allowedPractices` in `src/data/navigationData.js` only | Could become a useful validation/editor hint; not read today. |
| `tracking.tags[]` | Present in `src/data/navigationData.js` only | Classification only at the moment. |

#### DayPlan

| Field | Current consumer / usage | Why it is optional-soon |
| --- | --- | --- |
| `subtitle` | Present in `src/data/ritualInitiation14v2.js` only | Authored today, but not used in the traced navigation-path surfaces. |
| `intention` | Present in `src/data/ritualInitiation14v2.js`; used by curriculum-specific surfaces outside this audit | Valuable day copy, but not required for path launch/adherence. |
| `narrative` | Present in `src/data/ritualInitiation14v2.js` only in the traced flow | Same as above. |

#### Leg

| Field | Current consumer / usage | Why it is optional-soon |
| --- | --- | --- |
| `focusArea` | Present in `src/data/ritualInitiation14v2.js` only | Useful editorial metadata; not read in the traced runtime. |
| `launcherId` | `src/components/DailyPracticeCard.jsx` branches to launcher flow when present; `src/data/programRegistry.js` `getProgramLauncher()` | Useful when a leg opens a custom launcher instead of going straight to practice, but not needed for the current initiation path legs. |

#### GuidanceSpec v1

| Field | Current consumer / usage | Why it is optional-soon |
| --- | --- | --- |
| `displayName` | No current consumer | Editor-friendly label only. |
| `startPaused` | Could map to `useTempoAudioStore.pause()` in the future; no current authoring consumer | Small behavior toggle, but current runtime always auto-plays. |
| `volume` | `src/state/tempoAudioStore.js` has `setVolume()`, but current guidance path does not set per-practice volume | Useful once guidance balancing is needed. |

### Deferred

These should not be part of V1 because the current runtime does not need them and adding them now would over-design the schema.

| Field / capability | Why it is deferred |
| --- | --- |
| `GuidanceSpec.segments[]` / per-phase cue points | Explicitly excluded; current audio runtime only understands a single `source`. |
| `GuidanceSpec.mix`, `ducking`, multiple simultaneous tracks | Explicitly excluded; no current mixer model for authored guidance. |
| `GuidanceSpec.transcript`, `captions`, `captionTracks` | Explicitly excluded. |
| `locale`, `locales`, `fallbackLocale`, translated copy variants | Explicitly excluded; V1 is English-only. |
| Asset caching / prefetch policy metadata | Explicitly excluded and not consumed by the traced runtime. |
| Rich analytics-only metadata beyond current tracking fields | No current consumer in the navigation path flow. |

## Proposed V1 schema shapes

These shapes are intentionally normalized and additive. They do not require replacing the current runtime immediately.

```ts
type PathDefinition = {
  id: string;
  title: string;
  subtitle: string;
  glyph: string;
  description: string;
  contract: {
    totalDays: number;
    requiredTimeSlots: number;
    maxLegsPerDay: number;
    requiredLegsPerDay: number;
    practiceDaysPerWeek?: number | null;
  };
  requiresBenchmark: boolean;
  tracking: {
    curriculumId: string;
  };

  // optional-soon
  overviewNotes?: string[];
  content?: {
    chapters?: Array<{ chapterId: string; durationMin?: number }>;
    applicationItems?: Array<{ videoId: string; title?: string; durationMin?: number }>;
    weeks?: Array<{ number: number; title: string; focus?: string; practices?: Array<string | PracticeInstance> }>;
  };
};

type DayPlan = {
  dayNumber: number;
  title: string;
  legs: Leg[];

  // optional-soon
  subtitle?: string;
  intention?: string;
  narrative?: string;
};

type Leg = {
  legNumber: number;
  label: string;
  description: string;
  required: boolean;
  categoryId: string;
  matchPolicy: 'exact_practice' | 'any_in_category';
  practiceType: string;
  practice: PracticeInstance;

  // optional-soon
  focusArea?: string;
  launcherId?: string;
};

type PracticeInstance = {
  practiceId: string;
  durationMin: number;
  practiceConfig?: {
    breathPattern?: string;
    circuitId?: string;
  };
  practiceParamsPatch?: Record<string, unknown>;
  guidance?: GuidanceSpec;
};

type GuidanceSpec = {
  audioUrl: string;

  // optional-soon
  displayName?: string;
  startPaused?: boolean;
  volume?: number;
};
```

## Known ambiguities / competing sources of truth

1. **There are two different "path" systems in the repo**
   - `src/state/pathStore.js` is the avatar/behavioral identity path system.
   - `src/data/navigationData.js` + `src/state/navigationStore.js` is the navigation path contract system.
   - For the Navigation Path Editor, only the second system should be treated as the authoring target.

2. **Path shell and day-plan data are split**
   - Path shell metadata lives in `src/data/navigationData.js`.
   - Daily obligations live in `src/data/programRegistry.js` and `src/data/ritualInitiation14v2.js`.
   - This is the main risk called out in the task: a single path is currently assembled from multiple files.

3. **Legacy path-slot launching still exists**
   - `src/components/DailyPracticeCard.jsx` can still derive launches from `path.weeks[].practices` or `path.practices`.
   - That is a fallback path, not the strongest source of truth for the initiation contract.
   - V1 should prefer explicit `DayPlan -> Leg -> PracticeInstance` authoring, while keeping legacy week content as optional-soon content metadata.

4. **The task spec’s state-file names are stale**
   - The requested `src/state/path.js`, `src/state/schedule.js`, and `src/state/curriculum.js` do not exist in this repo.
   - The live equivalents used by the runtime are `src/state/pathStore.js`, `src/state/navigationStore.js`, and `src/state/curriculumStore.js`.

5. **Guidance audio has a sink but not a real authored source yet**
   - The runtime already has a transport (`useTempoAudioStore` + `GuidanceAudioController`).
   - The current assignment is hard-coded to `GUIDANCE_AUDIO_PLACEHOLDER` in `PracticeSection`.
   - That makes `GuidanceSpec v1.audioUrl` the right additive field, but it should be documented as a schema target, not treated as already wired.

## Best insertion point for future authoring

The single best minimal-disruption insertion point is:

- **Primary:** `src/data/navigationData.js` for `PathDefinition`

Reason:

- `getPathById()` and `getAllPaths()` already fan out into the selection UI, activation validators, and navigation run state.
- Adding authorable fields here keeps the existing entry points intact.
- The path should continue to reference `tracking.curriculumId`, which then points into the existing day-plan source (`programRegistry` / curriculum data) until a later migration unifies them.

## Next atomic step recommendation

The next atomic step should be **schema-only wiring**, not editor UI:

1. Normalize `navigationData` into the proposed `PathDefinition` field names while keeping compatibility aliases (`showBreathBenchmark` -> `requiresBenchmark`, `duration` fallback retained temporarily).
2. Add a documented `practice.guidance.audioUrl` field to authored day/leg data, but do not change runtime behavior yet.
3. Keep `programRegistry` / `ritualInitiation14v2` as the day-plan source for V1 and defer any unification work until after the field list is human-approved.

