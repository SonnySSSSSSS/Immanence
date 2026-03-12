# Architecture

Technical system documentation for Immanence OS.

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Presentation Layer                   │
│   React 19 · React Three Fiber · Framer Motion      │
├─────────────────────────────────────────────────────┤
│              Theming & FX Layer                      │
│   Stage Colors · Display Modes · Avatar Composite    │
├─────────────────────────────────────────────────────┤
│             State Management Layer                   │
│   Zustand (25+ stores) · localStorage persistence    │
├─────────────────────────────────────────────────────┤
│              Curriculum Engine                        │
│   Program Registry · Gating · Prerequisites          │
├─────────────────────────────────────────────────────┤
│            Tracking & Reporting                      │
│   Progress · Cycles · Attention · Path Inference     │
├─────────────────────────────────────────────────────┤
│              Dev Tooling Layer                        │
│   DevPanel · Inspectors · Simulators · Tuners        │
└─────────────────────────────────────────────────────┘
```

### Presentation Layer

React 19 with JSX (no TypeScript). 3D rendering via React Three Fiber for avatar visualization and sacred geometry. Framer Motion handles animation transitions. Tailwind CSS 3.4 plus custom CSS for styling. Two layout modes (Sanctuary at 1366px, Hearth at 1080px) and two color schemes (Dark, Light).

### Theming & FX Layer

Stage-specific color palettes defined in `src/theme/stageColors.js`. Avatar composite renders four independently tunable layers (background, stage, glass ring, rune ring). Particle system (`IndrasNet.jsx`) provides ambient decoration with display-mode-aware rendering.

### State Management

All persistent state lives in Zustand stores with `persist` middleware writing to localStorage. No backend. No cloud sync. Stores are organized by domain — practice tracking, curriculum progress, avatar state, settings, and UI state each have dedicated stores.

### Separation of Concerns

Components handle rendering and user interaction. Stores handle state and persistence. Services handle LLM communication, cycle management, and integration logic. Data files hold static definitions (rituals, programs, practice families). Config files hold asset mappings and stage definitions.

## Dual Mode Architecture

### Mode State

Stored in `userModeStore.js` with two fields: `userMode` (`'student'` | `'explorer'`) and `hasChosenUserMode` (boolean). On first launch, a chooser screen blocks all other rendering until a mode is selected.

### Routing Differences

**Student Mode** intercepts section navigation in `App.jsx`. The `handleSectionSelect` function blocks access to Wisdom and Application sections entirely. Practice section is only accessible when launched from a curriculum card (via `practiceLaunchContext`). Navigation section is only accessible when initial setup is incomplete.

**Explorer Mode** passes all section selections through without restriction. All four navigation targets (Practice, Wisdom, Application, Navigation) are available.

### Dashboard Adaptation

Tile policy (`src/reporting/tilePolicy.js`) adjusts by mode:

| Aspect | Student | Explorer |
|--------|---------|----------|
| Data window | 14 days | 90 days |
| Primary metrics | Completion rate, on-time rate | Total sessions, days active |
| Hub card ordering | Adherence-first | Volume-first |

### UI Differences

Student mode hides the "Explore Modes" navigation buttons on the home hub. The side navigation renders all four section buttons but click handlers enforce gating silently — no error messages, just no-ops for locked sections.

## Curriculum Engine

### Program Structure

Programs are defined in `src/data/pilotTestProgram.js` and registered in `src/data/programRegistry.js`. Each program contains an ordered sequence of days, and each day contains one or more **legs** (practice sessions).

```
Program
  └─ Day 1
       ├─ Leg 1 (morning session)
       └─ Leg 2 (evening session)
  └─ Day 2
       └─ Leg 1
  └─ ...
```

### State Tracking

`curriculumStore.js` tracks:
- Active program ID
- Curriculum start date (anchored at onboarding completion)
- Leg completions as a map: `{ "1-1": timestamp, "1-2": timestamp, "2-1": timestamp }`
- Current day number derived from start date (capped at program length)
- Onboarding state and schedule preferences

### Day Status Resolution

Each day resolves to one of four states:
- `complete` — all legs for that day have completion timestamps
- `today` — current calendar day based on start date offset
- `missed` — past day with incomplete legs
- `future` — not yet reached

### Prerequisite System

Path activation requires prerequisite validation (`src/utils/pathActivationGuards.js`):
- **Breath benchmark gate**: `validateBenchmarkPrerequisite` checks that the user has achieved a minimum breath benchmark score before unlocking secondary practice types
- **Time slot validation**: `validatePathActivationSelections` ensures schedule commitments meet path contract requirements

### Path Contracts

Each navigation path can define a contract (`src/utils/pathContract.js`) specifying:
- Total days in the path
- Required practice days per week
- Required time slots
- Maximum and required legs per day

Contract obligations are tracked in `navigationStore.js` and evaluated by `contractObligations.js`.

### Schedule Configuration

Users configure up to 2 time slots per day during onboarding. Practice days default to Monday–Saturday (configurable). The curriculum engine uses these to determine which legs are expected on which days.

## Capacity Model

The curriculum is designed around layered capacity acquisition. Each layer builds on the previous:

1. **Regulatory control** — Breath pattern execution, timing accuracy, sustained holds
2. **Attentional bandwidth** — Duration of sustained focus without drift
3. **Interoceptive precision** — Body scan accuracy, somatic signal detection
4. **Filtering** — Selective attention during multi-stimulus environments (sound, visual)
5. **Switching** — Transitioning between attentional targets without losing stability
6. **Insight** — Cognitive observation without reactive identification (Four Modes)

This is a training architecture, not a theory of consciousness. The sequencing reflects practical dependencies: you cannot filter effectively without attentional bandwidth, and you cannot sustain attention without regulatory stability.

## Avatar System

### Original Design Problem

The initial avatar system required 90+ visual variations across stages, paths, and layers — a combinatorial explosion that was expensive to produce and maintain.

### Refactored Architecture

Reduced to a stage-token abstraction with five core stages and a rune variation system:

**Five stages**: Seedling, Ember, Flame, Beacon, Stellar (with three Stellar substages)

**Four composite layers** (`src/components/avatarV3/AvatarComposite.jsx`):

| Layer | Content | Tunability |
|-------|---------|------------|
| `bg` | Stage-specific cosmic background | Opacity, scale, position |
| `stage` | Plant/growth foreground asset | Opacity, scale, position |
| `glass` | Glass ring overlay | Opacity, scale, position |
| `ring` | Rune ring (stage-specific PNG) | Opacity, scale, position |

Each stage has exactly one set of assets (`src/config/avatarStageAssets.js`): wallpaper, background, rune ring, glass ring, and plant foreground. No per-path visual branching at the asset level.

**Path differentiation** is handled through:
- Text-based path identity (name, symbol, interface label)
- Practice mode weights (`photic`, `haptic`, `sonic`, `ritual`) calculated from 42-day session windows
- Path definitions in `src/data/pathDefinitions.js` with symbols: Yantra (△), Kaya (◍), Chitra (✶), Nada (≋)

**Path inference** (`src/state/pathStore.js`):
- 90-day rolling window with minimum 45 signal minutes
- Path emergence requires 90 days of sustained dominant signal
- Path shift requires 180 days of new dominant signal
- Lifecycle: `forming` → `established` → `shifting` → `resting` → `dormant` → `fading`

### Stage Advancement

Two parallel scoring systems:

**Calendar-based** (`src/state/stageConfig.js`): Days since first practice determine stage. Seedling at 0, Ember at 90, Flame at 180, Beacon at 270, Stellar at 360+ (substages at 540 and 720).

**Score-based** (`src/state/mandalaStore.js`): `stageScore = 0.35 × volumeScore + 0.65 × accuracyScore`. Thresholds: Seedling 0.00, Ember 0.15, Flame 0.35, Beacon 0.55, Stellar 0.80.

## Progression Systems

### Cycle System

Three cycle lengths enforce sustained consistency:

| Cycle | Duration | Use Case |
|-------|----------|----------|
| Foundation | 14 days | Beginners, establishing habit |
| Transformation | 90 days | Intermediate, deepening practice |
| Integration | 180 days | Advanced, long-term integration |

Two consistency modes:
- **Consecutive**: 100% adherence required
- **Flexible**: 67% adherence required

Checkpoints occur every 14 days. Users can switch between consecutive and flexible modes at checkpoints based on their consistency rate.

### Moon Orbit

`lunarStore.js` tracks progress as 0.0–12.0 (twelve segments = one full orbit = one stage). Recent activity trail (last 7 entries) provides momentum visualization. Vacation mode freezes progress. At Stellar III ceiling, completed orbits increment a counter.

### Lifetime Tracking

`progressStore.js` maintains lifetime milestones via `updateLifetimeTracking()`. Annual rollups tracked separately for year-over-year comparison. Session history includes practice type, duration, accuracy, and timestamps.

## State Store Architecture

### Persisted Stores (localStorage)

| Store | Key | Domain |
|-------|-----|--------|
| `progressStore` | `immanenceOS.progress` | Session history, streaks, honor logs |
| `pathStore` | `immanenceOS.path` | Path inference from practice patterns |
| `navigationStore` | `immanenceOS.navigationState` | Active paths, contracts, schedule |
| `curriculumStore` | `immanenceOS.curriculum` | Program state, day/leg completions |
| `cycleStore` | `immanenceOS.cycles` | Cycle tracking, checkpoints |
| `lunarStore` | `immanence-lunar` | Moon orbit progress |
| `chainStore` | `immanence-chains` | Four Modes chain state |
| `attentionStore` | `immanenceOS.attention` | Weekly attention aggregation |
| `applicationStore` | `immanenceOS.applicationState` | Awareness logs, intention |
| `settingsStore` | `immanence-settings` | Preferences, accessibility, dev flags |
| `wisdomStore` | `immanenceOS.wisdom` | Reading progress, bookmarks |
| `videoStore` | `immanenceOS.videos` | Video watch progress |
| `journalStore` | `immanenceOS.journal` | Per-session reflections |
| `ritualStore` | `ritual-storage` | Active ritual state |
| `sigilStore` | `immanenceOS.sigils` | Sigil drawings (IndexedDB) |
| `userModeStore` | `immanence-user-mode` | Student/Explorer mode |
| `tutorialStore` | `immanence.tutorial` | Tutorial completion |
| `breathBenchmarkStore` | `immanence-breath-benchmark` | Breath benchmark scores |
| `modeTrainingStore` | `immanence-mode-training` | Mode training history |
| `trackingStore` | `immanenceOS.tracking` | Tracking data |
| `displayModeStore` | `immanenceOS.displayMode` | Layout mode, color scheme |
| `avatarV3Store` | (persisted) | Avatar layer tuning, mode weights |
| `devPanelStore` | (persisted) | Dev panel composite tuning |

### Canonical Persistence Ownership Contract

Contract intent: one concept -> one authoritative owner. Non-owner stores may derive or consume, but must not become a second persisted source of truth.

| Concept | Authoritative owner | Non-owner boundaries |
|---|---|---|
| Session completion history | `progressStore` (`immanenceOS.progress`) | `trackingStore` is derived/reporting only; legacy `immanence_sessions_v1` remains migration-compat only |
| Schedule adherence and slot-window outcomes | `navigationStore` (`immanenceOS.navigationState`) | `curriculumStore` consumes adherence outcomes for gating/expectations but does not own adherence logs |
| Curriculum day/leg completion state | `curriculumStore` (`immanenceOS.curriculum`) | `navigationStore` and `progressStore` must not duplicate leg-completion persistence |
| Benchmark prerequisite truth | `breathBenchmarkStore` (`immanence-breath-benchmark`) | Other stores/components are read-only consumers of benchmark state |
| Ritual defaults and ritual completion markers | `ritualStore` (`ritual-storage`) | UI components should not persist ad-hoc ritual keys as long-term ownership |
| Tutorial completion state | `tutorialStore` (`immanence.tutorial`) | Dev tutorial override/admin flags remain separate dev-scope controls, not canonical completion truth |

### Session-Only Stores

| Store | Purpose |
|-------|---------|
| `uiStore` | Practice launch context, content launch context |
| `historyStore` | Undo stacks for Four Modes entries |
| `tempoAudioStore` | Live audio playback state |
| `tempoSyncSessionStore` | Active tempo sync session |
| `sessionOverrideStore` | Locked practice parameters during session |

## Dev Panel Architecture

Access: `Ctrl+Shift+D` or 5× tap on version number. Gated by `isDevtoolsEnabled()` from `src/dev/uiDevtoolsGate.js`. Not rendered in production builds without the gate flag.

### Modular Sections

Each section is independently collapsible and maintains its own expanded state:

| Section | Function |
|---------|----------|
| Avatar Stage | Wallpaper preview, stage/path dropdown selection |
| Avatar Composite Tuner | Per-layer opacity, scale, position sliders for all four avatar layers |
| Inspector | Live state inspection for selected stores |
| Card Styling Tuner | Practice card visual parameter adjustment |
| Navigation Button FX Tuner | Button hover/active effect controls |
| UI Playground | Isolated component rendering for design iteration |
| Curriculum | Day/leg completion injection, onboarding state manipulation |
| Tracking Hub | Live view of tracking store contents |
| Reporting Layer | Dashboard tile query execution, metric preview |
| Tutorial Tools | Tutorial state reset, step-by-step walkthrough |
| Design & Diagnostic | Inspector overlays, layout grid visualization |
| Data Management | Full localStorage export, import, and reset |

### Simulation Capabilities

- Inject mock completion data for any curriculum day/leg
- Override stage and path for avatar preview without actual progression
- Reset tutorial state to re-trigger onboarding flows
- Execute reporting queries against current state
- Manipulate avatar composite layer parameters in real time

Dev panel state persists in `devPanelStore.js` so tuning values survive page reloads during development sessions.

## LLM Integration

Local Ollama instance at `localhost:11434`, proxied through Vite as `/api/ollama`.

Used exclusively for Four Modes cognitive validation:

| Function | Purpose |
|----------|---------|
| `validateMirrorEntry()` | E-Prime compliance checking |
| `evaluatePrismInterpretations()` | Interpretation quality assessment |
| `evaluateWaveCoherence()` | Emotional coherence validation |
| `validateSwordCommitment()` | Action commitment clarity check |

Model: `gemma3:1b`. Runs entirely on the user's machine. No data leaves the device.

## Component Hierarchy

```
App.jsx
├── Background.jsx              Cosmic/parchment background
├── IndrasNet.jsx                Particle system decoration
├── HomeHub.jsx                  Dashboard with avatar + metrics
├── PracticeSection.jsx          All practice types
│   ├── BreathConfig             Breath pattern selection
│   ├── VisualizationConfig      Sacred geometry selection
│   ├── SensoryConfig            Awareness mode selection
│   └── CircuitConfig            Circuit composition
├── WisdomSection.jsx            Treatise, videos, recommendations
├── ApplicationSection.jsx       Four Modes + awareness tracking
│   ├── FourModesHome.jsx        2×2 mode grid
│   └── TrackingView.jsx         Gesture → Trace → Pattern → Direction
├── NavigationSection.jsx        Settings, profile, path selection
├── DevPanel.jsx                 Developer tooling (gated)
├── SigilTracker.jsx             Vigilance mode tracker
└── SideNavigation.jsx           Section navigation buttons
```

## Design Principles

**UX over aesthetic excess.** Visual richness serves the practice interface. Effects that don't improve usability or practice focus are removed.

**Capacity-based progression.** Unlock logic reflects genuine skill prerequisites, not arbitrary timers or point accumulation.

**Symbolic consistency.** Stage colors, rune designs, and identity markers follow a coherent system. Each stage has a defined visual language that carries across all UI surfaces.

**Reduction over expansion.** The avatar refactor from 90+ variations to 5 stage-token sets is the template. Fewer well-defined states over combinatorial sprawl.

**Iteration infrastructure over hardcoding.** The dev panel exists so that visual tuning, curriculum testing, and state simulation don't require code changes. Design decisions are made with live tools, then committed.

## File Organization

```
src/
├── components/           React components
│   ├── avatarV3/         Avatar composite system
│   ├── vipassana/        Vipassana-specific visuals
│   ├── Codex/            Wisdom content cards
│   ├── PracticeSection/  Practice UI and config
│   └── ...
├── state/                Zustand stores (25+)
├── services/             LLM, cycles, benchmarks, circuits
├── data/                 Static definitions
│   ├── rituals/          Ritual definitions by category
│   └── ...
├── config/               Asset mappings, stage definitions
├── theme/                Stage colors, theming
├── utils/                Helpers, guards, contracts
├── hooks/                Custom hooks (wake lock, audio, etc.)
├── icons/                Icon system with variants
├── context/              React contexts (ThemeProvider)
├── reporting/            Dashboard tile policies and queries
├── dev/                  Dev tooling gate and utilities
└── App.jsx               Root component

docs/                     Technical documentation
public/
├── bg/                   Stage-specific background images
├── visualization/        Sacred geometry SVGs
└── stamps/               Vipassana thought icons
```

## Data & Privacy

- All data in browser localStorage (one store uses IndexedDB for binary sigil data)
- No telemetry, analytics, or usage tracking
- LLM runs locally via Ollama — no API calls to external services
- Static site deployment (GitHub Pages) — no backend server
- No accounts, no authentication, no cloud sync
