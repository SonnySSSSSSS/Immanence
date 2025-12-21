# Immanence OS — Architecture Overview

## System Philosophy

Immanence OS is a **local-first, constraint-based practice instrument**. The system:
- Observes behavior, does not prescribe
- Stores all data locally (no cloud)
- Provides structure without judgment
- Uses AI for validation, not recommendation

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App.jsx                               │
│                    (Root Component)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ HomeHub     │  │ Practice    │  │ Four Modes          │  │
│  │ (Dashboard) │  │ Section     │  │ (ApplicationSection)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Wisdom      │  │ Navigation  │  │ DevPanel            │  │
│  │ Section     │  │ Section     │  │ (Ctrl+Shift+D)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    Zustand State Layer                       │
│  progressStore | chainStore | cycleStore | settingsStore |  │
│  historyStore | curriculumStore | waveStore | lunarStore    │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  llmService | cycleManager | benchmarkManager | circuitMgr  │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management (Zustand)

All state is managed with Zustand stores, persisted to localStorage.

### Core Stores

| Store | Purpose | Key Data |
|-------|---------|----------|
| `progressStore` | Session tracking, streaks | sessions[], streaks, benchmarks, practiceHistory |
| `applicationStore` | Awareness tracking & Intention | awarenessLogs[], intention, getWeekLogs() |
| `chainStore` | Four Modes chains | activeChain, completedChains |
| `cycleStore` | Cycle & consistency tracking | currentCycle, history, checkpoints, modeHistory |
| `settingsStore` | App settings & preferences | displayMode, llmModel, themeStageOverride, volume |
| `historyStore` | Undo/redo for modes | histories{}, positions{}, snapshots |
| `curriculumStore` | Circuit definitions | circuits, exercises |
| `waveStore` | Personality profile (Big Five) | traits, assessmentHistory |
| `lunarStore` | Lunar cycle tracking | currentPhase, ritualCompletions |
| `attentionStore` | Attention path inference | weeklyData, dominantPath |

### Supporting Stores

| Store | Purpose |
|-------|---------|
| `practiceStore` | Current practice session state |
| `navigationStore` | Section navigation state |
| `wisdomStore` | Bookmarks, reading progress |
| `videoStore` | Video library state |
| `mandalaStore` | Mandala visualization state |
| `displayModeStore` | Light/dark mode toggle |
| `modeTrainingStore` | Mode training progress |
| `pathStore` | Path recognition data |

---

## Key Data Structures

### Chain (Four Modes)

```javascript
{
  id: 'chain_1702...xxx',
  startDate: '2024-12-19T...',
  state: 'MIRROR_ACTIVE' | 'MIRROR_LOCKED' | 'PRISM_ACTIVE' | ...,
  
  mirror: {
    locked: false,
    context: { date, time, location, category },
    actor: '',
    action: '',
    recipient: '',
    neutralSentence: '',
    llmValidation: { status, result, lastAttempt }
  },
  
  prism: {
    locked: false,
    interpretations: [{ id, text, isSupported, evidenceNote }],
    supportedRatio: 0.25
  },
  
  wave: {
    locked: false,
    emotions: [],
    somaticLocation: '',
    impulses: [],
    startIntensity: 8,
    endIntensity: 5
  },
  
  sword: {
    locked: false,
    value: '',
    action: '',
    cost: '',
    timeBound: ''
  }
}
```

### Wave Profile (Big Five)

```javascript
{
  traits: {
    openness: 0.72,
    conscientiousness: 0.65,
    extraversion: 0.45,
    agreeableness: 0.78,
    neuroticism: 0.38
  },
  lastAssessedAt: '2024-12-19T...',
  assessmentHistory: [...]
}
```

### Cycle (Consistency System)

```javascript
{
  id: 'cycle_1702...xxx',
  type: 'foundation',  // 21 days | 'advanced' = 42 days
  mode: 'consecutive', // or 'flexible' (67% baseline)
  startDate: '2024-12-19T...',
  
  practiceDays: [
    { date: '...', type: 'breath', duration: 12, sessionId: '...' }
  ],
  
  checkpoints: [
    {
      date: '...',
      dayNumber: 14,
      consistencyRate: 0.85,
      effectiveDays: 12,
      canSwitchMode: true,
      modeLockUntil: '...'
    }
  ],
  
  consistencyMetrics: {
    rate: 0.82,
    effectiveDays: 17,
    projectedCompletion: '...',
    timeOfDayConsistency: 0.75,
    durationConsistency: 0.6
  },
  
  modeHistory: [
    { switchedAt: '...', from: 'consecutive', to: 'flexible', reason: '...' }
  ]
}
```

### Wisdom Section

`WisdomSection.jsx` serves as the "Akashic Record" - the library and reflection space.

**Structure:**
```
WisdomSection.jsx
├── Recommendations         # Needs-based wisdom (8 categories)
├── Treatise               # Full text with parts/chapters
├── Bookmarks              # User-saved chapters
├── Videos                 # VideoLibrary component
└── Self-Knowledge         # Big Five + self-described patterns
```

**Video Library** (`VideoLibrary.jsx`):
- "Flame" metaphor - idle hearth with embers
- Featured + Library bands (horizontal scroll)
- Video hearth with ember glow when playing
- Isolated with `z-index: 50` to hide PathParticles decorations

**Components:**
- `ChapterModal` - Full-screen chapter reading
- `PartAccordion` - Collapsible treatise sections
- `CategoryCard` - Needs assessment cards
- `SelfKnowledgeView` - Wave Function personality viz
- `VideoToken` - Minimal video selector

### Sound Practice

Sound-based practices use binaural beats and isochronic tones.

**Frequency-to-Color Mapping:**
- 100-200 Hz → Warm Orange #FF8C42 (grounding)
- 200-300 Hz → Yellow #FFD93D (energizing)
- 300-400 Hz → Green #6BCF7F (balance)
- 400-500 Hz → Blue #4A90E2 (ethereal)

**UI Features:**
- Analog mixer-style fader slider (20x40px thumb)
- Dynamic color mapping for thumb, track, Hz text
- Gradient track showing full spectrum
- Volume slider in practice session (uses avatar accent color)

**Components:**
- `SoundConfig.jsx` - Hz selector, sound type
- Rendered in `PracticeSection.jsx` with volume control

---

## Component Hierarchy

### Main Sections

```
App.jsx
├── Background.jsx          # Cosmic background
├── IndrasNet.jsx           # Particle system
├── SectionView
│   ├── Avatar.jsx          # Central multi-layer avatar (Canvas + PNGs)
│   ├── StageTitle.jsx      # Stage/path display with hover tooltips
│   └── [Section Content]
│       ├── HomeHub.jsx             # Dashboard
│       ├── PracticeSection.jsx     # Breathing, visualization, Ember FX
│       │   └── BodyScanVisual.jsx  # Body scan silhouette + Ember FX bar
│       ├── WisdomSection.jsx       # Reading content
│       ├── ApplicationSection.jsx  # Four Modes training
│       │   ├── TrackingView.jsx    # Gesture → Trace → Pattern → Direction
│       │   │   ├── AwarenessCompass.jsx
│       │   │   ├── TodayAwarenessLog.jsx
│       │   │   ├── WeeklyReview.jsx
│       │   │   └── PathJourneyLog.jsx
│       │   └── FourModesHome.jsx   # 2x2 Mode Grid
│       └── NavigationSection.jsx   # Settings, profile
└── DevPanel.jsx            # Developer tools
```

### Four Modes Components

```
ApplicationSection.jsx
└── ModeTraining.jsx
    ├── MirrorObservation.jsx      # + MirrorValidationFeedback
    ├── PrismSeparation.jsx
    ├── WaveCapacity.jsx
    └── SwordCommitment.jsx
```

### ALPHA UI Element: BreathingRing

`BreathingRing.jsx` is the **central onboarding teacher** — a global overlay element that can appear across all sections, not tied to specific practice components.

**Key Architecture:**
- Independent component, not embedded in Avatar
- Can be invoked globally for onboarding/teaching
- Syncs with breath patterns (inhale/exhale/hold phases)
- Integrated PathParticles for visual energy feedback
- `practiceEnergy` prop (0.3-1.0) controls particle intensity based on context

**Props:**
```javascript
<BreathingRing 
  breathPattern={{inhale, holdTop, exhale, holdBottom}}
  practiceEnergy={0.5}  // 0.3=stillness, 0.5=active, 1.0=intense
  pathId="prana"        // Path-specific FX
  fxPreset={preset}     // Custom particle behavior
  onTap={handleTap}     // Accuracy feedback
  onCycleComplete={fn}  // Breath cycle callback
  startTime={timestamp}
/>
```

### Visual FX System: PathParticles

`PathParticles.jsx` is a canvas-based particle system with 12+ motion patterns synced to breath phases.

**Motion Patterns:**
- `ember-mixed` - Rising fire particles
- `electric-varied` - Plasma conduit (continuous noise ring)
- `plasma-directional` - Sci-fi directional flow
- `starfield-smooth` - Radiating bursts with breath sync
- `hyperspace-rays` - Dual-layer rays with shimmer
- `snowglobe-active` - Parallax layers with swirl
- `meteor-cycle` - 3-layer streaks
- `wisp-drift`, `ribbon-flow`, `circuit-pulse`, etc.

**Integration:** Rendered inside BreathingRing, responds to:
- Breath phase (`inhale`/`hold`/`exhale`/`rest`)
- Ring scale (breath-driven expansion)
- Practice energy (intensity modifier)
- Path-specific presets (via `pathFX.js`)

### Ember FX & Decorative Layers
- **Ember FX Bar**: A horizontal, glowing, flickering bar added to the top of the `BodyScanVisual` container.
- **Avatar Rotation**: The central avatar sigil rotates counter-clockwise at 25% the speed of the outer rune ring (62.4s CW vs 249.6s CCW).
- **Z-Index Stacking**: Header section (`z-20`) is strictly above content (`z-10`) to prevent tooltip occlusion.

**Key Props:**
- `intensity` (0-1) - Particle visibility/activity
- `phase` - Current breath phase
- `ringScale` - Dynamic ring size
- `pathId` / `fxPreset` - Visual style

---

## Service Layer

### LLM Service (`src/services/llmService.js`)

Communicates with local Ollama for AI-powered validation.

```javascript
// Key exports
export async function sendToLLM(systemPrompt, userPrompt, options)
export async function sendToLLMForJSON(systemPrompt, userPrompt, options)
export async function checkLLMAvailability()

// Mode-specific validators
export async function validateMirrorEntry(mirrorEntry)
export async function evaluatePrismInterpretations(...)
export async function evaluateWaveCoherence(...)
export async function validateSwordCommitment(...)
```

**Configuration:**
```javascript
const USE_OLLAMA = true;  // Toggle between Ollama and Gemini API
const WORKER_URL = '/api/ollama';  // Vite proxy
```

### Cycle Services

**cycleManager.js** - Practice logging, consistency calculation, mode switching
**benchmarkManager.js** - Self-reported metrics, stage requirements
**circuitManager.js** - Multi-path circuit training management

```javascript
// cycleManager
export function logPractice(type, durationMin, sessionData)
export function calculateConsistency(cycle)
export function switchMode(newMode, reason)

// benchmarkManager
export function logBenchmark(path, value, notes)
export function checkStageRequirements(stage, benchmarks)

// circuitManager
export function getAvailableCircuits()
export function startCircuit(circuitId)
export function logCircuitCompletion(circuitId, exercises)
```

---

## Data Flow

### Practice Session Flow

```
User taps rhythm
    ↓
PracticeSection detects tap timing
    ↓
practiceStore.recordTap(accuracy)
    ↓
Session completes
    ↓
progressStore.recordSession({
  practiceType, duration, accuracy, breathCount
})
    ↓
Streak updated, Honor/Dishonor logged
    ↓
localStorage persisted
```

### Four Modes Chain Flow

```
User starts chain
    ↓
chainStore.startNewChain()
    ↓
MirrorObservation.jsx
    ↓
User fills form → clicks "Validate with AI"
    ↓
llmService.validateMirrorEntry()
    ↓
chainStore.setMirrorLLMValidation(status, result)
    ↓
User locks → chainStore.lockMirror(neutralSentence)
    ↓
Chain state: MIRROR_LOCKED
    ↓
[Repeat for Prism, Wave, Sword]
    ↓
chainStore.lockSword() → Chain archived to completedChains
```

### Awareness Tracking Flow

Tracking in Immanence OS follows a temporal resonance model: **Gesture → Trace → Pattern → Direction**.

1.  **Gesture** (`AwarenessCompass.jsx`): A rapid, somatic act (swipe) to log a moment of captured pattern. 
2.  **Trace** (`TodayAwarenessLog.jsx`): The immediate temporal echo of recent gestures, visualized as a chronological list.
3.  **Pattern** (`WeeklyReview.jsx`): A medium-term aggregation showing emerging clusters and frequency.
4.  **Direction** (`PathJourneyLog.jsx`): Long-term narrative alignment, where tracking stats meet the user's defined "Path".

**The Intention "Seal":**
Intentions are not just text fields; they are "sealed" commitments. The transition from editing to "Sealed" state represents a small ritual of commitment, moving from potentiality to enacted direction.

---

## Theming System

### Stage Colors (`src/theme/stageColors.js`)

Each stage has primary/accent/glow colors:

| Stage | Primary | Accent |
|-------|---------|--------|
| Seedling | Soft greens | Pale gold |
| Ember | Warm oranges | Copper |
| Flame | Deep reds | Bright gold |
| Beacon | Ethereal blues | Silver |
| Stellar | Cosmic purples | White |

### CSS Variables

```css
:root {
  --font-sacred: 'Cinzel', serif;
  --font-ui: 'Outfit', sans-serif;
  --font-body: 'Crimson Pro', serif;
  --stage-primary: var(--seedling-primary);
  --stage-accent: var(--seedling-accent);
}
```

---

## File Structure

```
src/
├── components/
│   ├── Application/          # Four Modes
│   │   └── practices/        # Mirror, Prism, Wave, Sword
│   ├── Cycle/                # NEW: Cycle & Circuit components
│   │   ├── CircuitTrainer.jsx
│   │   ├── CircuitSession.jsx
│   │   ├── CircuitConfig.jsx
│   │   ├── ConsistencyFoundation.jsx
│   │   ├── CycleChoiceModal.jsx
│   │   ├── CheckpointReview.jsx
│   │   ├── ModeSwitchDialog.jsx
│   │   └── BenchmarkInput.jsx
│   ├── Avatar.jsx            # Main avatar
│   ├── BreathingRing.jsx     # Breathing visualization
│   ├── HomeHub.jsx           # Dashboard
│   └── ...
├── state/
│   ├── progressStore.js      # Sessions, streaks
│   ├── chainStore.js         # Four Modes
│   ├── cycleStore.js         # NEW: Cycle state
│   ├── settingsStore.js      # NEW: App settings
│   ├── historyStore.js       # NEW: Undo/redo
│   ├── curriculumStore.js    # NEW: Circuits
│   ├── waveStore.js          # Big Five personality
│   └── ...
├── services/
│   ├── llmService.js         # Ollama integration
│   ├── cycleManager.js       # NEW: Cycle logic
│   ├── benchmarkManager.js   # NEW: Metrics
│   └── circuitManager.js     # NEW: Circuits
├── data/
│   ├── fourModes.js          # Mode definitions
│   ├── rituals/              # Ritual definitions
│   └── ...
├── theme/
│   └── stageColors.js        # Color definitions
└── utils/
    └── ...

docs/
├── ARCHITECTURE.md           # This file
├── CYCLE_SYSTEM.md           # NEW: Cycle system docs
├── LLM_INTEGRATION.md        # Ollama setup
└── DEVELOPMENT.md            # Dev guide

documentation/
├── 4 Modes User Manual.md    # User guide
└── attention-axis-logic.md   # Design philosophy
```

---

## Key Design Decisions

### 1. Local-First

All data in localStorage. No backend required. Survives offline use.

### 2. No Gamification

System observes patterns, does not reward or punish. Honor/Dishonor logs are factual records, not achievements.

### 3. Constraint-Based Validation

Mirror mode uses E-Prime word-list (soft warnings) + LLM (intelligent validation). Users must satisfy constraints before locking entries.

### 4. Hysteresis in Path Inference

Attention paths (Ekagrata, Sahaja, Vigilance) require sustained behavioral signals before recognition. Short-term fluctuations are ignored.

### 5. AI as Validator, Not Advisor

LLM validates neutral language, checks interpretations, confirms commitment clarity. It does not suggest what to think or do.

### 6. Cycle-Based Progression

Avatar advancement requires both cycle completion and demonstrated capacity (see [Cycle & Consistency System](CYCLE_SYSTEM.md)).
