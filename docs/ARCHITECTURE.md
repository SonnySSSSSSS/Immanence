# Immanence OS — Architecture Overview

## System Philosophy

Immanence OS is a **local-first, constraint-based practice instrument**. The system:

- Observes behavior, does not prescribe
- Stores all data locally (no cloud)
- Provides structure without judgment
- Uses AI for validation, not recommendation

### UI/UX Design Principles (Meditative Practice)

The interface follows a **"high-tech HUD over cosmic chaos"** philosophy, where the cosmology bows during practice:

1. **One Dominant Visual Anchor** - Each screen has one clear focus
2. **Local Quiet Zones** - Islands of calm within the cosmic background
3. **Compressed Luminance** - Softer contrasts during active practice (lifted blacks, capped highlights)
4. **Motion Transfers** - Animation flows, doesn't stack; freeze everything except the locus of attention
5. **UI Waits for User** - Interface that listens, not demands; text appears after visuals settle

**Key Aesthetic Choices:**

- Glass capsule containers with thin white strokes and backdrop blur
- Serif fonts (Cinzel, Playfair Display) for headers with wide letter-spacing
- Fine gold hairline rules instead of thick glows
- Defined frames with rounded corners for visualizations
- Text pulsing effects for collapsible affordances (pulse when idle, stop on hover/expand)

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
│  │ WisdomHub   │  │ Navigation  │  │ DevPanel            │  │
│  │ (Library)   │  │ Section     │  │ (Ctrl+Shift+D)      │  │
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

| Store                 | Purpose                        | Key Data                                                                                            |
| --------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| `progressStore`       | Session tracking, streaks      | sessions[], streaks, benchmarks, practiceHistory                                                    |
| `applicationStore`    | Awareness tracking & Intention | awarenessLogs[], intention, getWeekLogs()                                                           |
| `chainStore`          | Four Modes chains              | activeChain, completedChains                                                                        |
| `cycleStore`          | Cycle & consistency tracking   | currentCycle, history, checkpoints, modeHistory                                                     |
| `settingsStore`       | App settings & preferences     | displayMode, llmModel, themeStageOverride, volume, useNewAvatars, buttonThemeDark, buttonThemeLight |
| `historyStore`        | Undo/redo for modes            | histories{}, positions{}, snapshots                                                                 |
| `curriculumStore`     | Circuit definitions            | circuits, exercises                                                                                 |
| `waveStore`           | Personality profile (Big Five) | traits, assessmentHistory                                                                           |
| `lunarStore`          | Lunar cycle tracking           | currentPhase, ritualCompletions                                                                     |
| `attentionStore`      | Attention path inference       | weeklyData, dominantPath                                                                            |
| `circuitJournalStore` | Practice journaling            | entries[], archivedSessions, insightsData                                                           |

### Supporting Stores

| Store               | Purpose                        |
| ------------------- | ------------------------------ |
| `practiceStore`     | Current practice session state |
| `navigationStore`   | Section navigation state       |
| `wisdomStore`       | Bookmarks, reading progress    |
| `videoStore`        | Video library state            |
| `mandalaStore`      | Mandala visualization state    |
| `displayModeStore`  | Light/dark mode toggle         |
| `modeTrainingStore` | Mode training progress         |
| `pathStore`         | Path recognition data          |

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

### Circuit Configuration

**Circuit Mode** allows chaining multiple practice types in sequence.

**Key Features:**

- Horizontal scrolling exercise selection ribbon (6 exercises: Breath, Cognitive Vipassana, Somatic Vipassana, Cymatics, Sound Bath, Visualization)
- Per-exercise duration dropdown (3, 5, 7, 10, 12, 15, 20 min)
- Auto-calculated total circuit duration
- Clean linear sequence display with numbered badges
- Dynamic accent color integration based on stage/path
- Heartbeat pulse animation on START button (~60 BPM)

**Duration Control:**

- Main duration selector hidden for Circuit mode
- Per-exercise dropdown updates ALL exercises simultaneously
- Total circuit time displayed in OPTIONS panel

**Components:**

- `CircuitConfig.jsx` - Main configuration component
- `OrbitalSequence.jsx` - Unused orbital layout (reference)
- `CircuitSigil.jsx` - Unused charging ring (reference)

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

### Practice System

The practice system is the core training engine of Immanence OS, managing various meditation and focus exercises.

**Primary Orchestrator:** `PracticeSection.jsx`

- Manages switching between **Configuration** and **Running** views.
- Loads/Saves user preferences (duration, breath pattern, theme).
- Records practice metrics (accuracy, duration, breath count) to `progressStore`.

| Practice Mode           | Purpose                                   | Primary Components                                                 |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| **Breath & Stillness**  | Rhythmic breathing & timing accuracy      | `BreathingRing.jsx`, `BreathConfig.jsx`, `PathParticles.jsx`       |
| **Cognitive Vipassana** | Thought labeling & mental observation     | `vipassana/VipassanaVisual.jsx`, `ThoughtLabeling.jsx`             |
| **Somatic Vipassana**   | Body awareness & sensory tracking         | `SensorySession.jsx`, `BodyScanVisual.jsx`, `SensoryConfig.jsx`    |
| **Visualization**       | Mental object focus & geometric stability | `VisualizationCanvas.jsx`, `VisualizationConfig.jsx`               |
| **Cymatics**            | Frequency-to-geometry resonance           | `CymaticsVisualization.jsx`, `CymaticsConfig.jsx`                  |
| **Sound**               | Binaural beats & frequency entrainment    | `SoundConfig.jsx`, `ToneGenerator` (Web Audio API)                 |
| **Ritual**              | Multi-step structured rituals             | `RitualPortal.jsx`, `RitualSelectionDeck.jsx`, `RitualSession.jsx` |
| **Circuit**             | Chained sequence of different practices   | `Cycle/CircuitConfig.jsx`, `CircuitTrainer.jsx`                    |

**Practice Visuals:**

- **BreathingRing**: Central teacher, syncs with breath phases (inhale/hold/exhale/rest).
- **Vipassana Canvas**: Dynamic visualizers for thought-objects (DynamicClouds, ScrollingFog).
- **BodyScan silhouette**: Anatomical outline with Ember FX bar for focus tracking.

**Practice Journaling System:**
The journaling system bridges practice sessions with long-term insights, capturing both structured (circuit) and unstructured (single session) data.

- **Post-Session Routing**: `PostSessionJournal.jsx` acts as a traffic controller, routing users to the appropriate form based on the session type (Single vs. Circuit).
- **Circuit Assessments**: Maps per-exercise attention quality and technical notes, plus overall circuit challenges and general insights.
- **Visual Archive**: `SessionHistoryView.jsx` provides a portal-based hub for viewing entries, filtering by date/type, and accessing the Insights dashboard.
- **Data Portability**: Built-in JSON and CSV export capabilities ensure users own their practice data.

### Application (The Four Modes)

The "Four Modes" workflow moves from observation to action through four distinct recursive chambers.

**Primary Orchestrator:** `ApplicationSection.jsx` -> `ModeTraining.jsx`

1. **Mirror (Observation)**: Pure description of an event.

   - `MirrorObservation.jsx`: Context, Actor, Action, Recipient.
   - `VoiceInput.jsx`: Transcription with confirm-first preview.
   - `MirrorValidationFeedback.jsx`: E-Prime check + AI-powered neutrality validation.
   - `MirrorStillness.jsx`: Post-observation dwell time.

2. **Prism (Separation)**: Breaking one "Truth" into multiple interpretations.

   - `PrismSeparation.jsx`: Identifying subjective filters.
   - `PrismReframing.jsx`: Creating alternative meanings supported by evidence.

3. **Wave (Capacity)**: Somatic experience and emotional intensity.

   - `WaveRide.jsx`: Tracking somatic locations and emotional impulses.
   - `ResonatorChambering.jsx`: Increasing capacity for the feeling without reactivity.

4. **Sword (Commitment)**: Precise action aligned with values.
   - `SwordCommitment.jsx`: Defining small, cost-bound actions.
   - `SwordCompression.jsx`: Distilling the commitment to its core essence.

### Awareness Tracking Hub

The Tracking Hub (`TrackingHub.jsx`) provides the "Ground" for practice, visualizing behavioral data.

- **AwarenessCompass.jsx**: Cardinal-direction logging (N/E/S/W). Manages "Intention" seal. Features the **Dual-Visual Orb System** where background orbs represent intensity and foreground SVG indicators represent precision (Bullseye ≥90%, Crosshair 70-89%, Dashed <70%).
- **SevenDayTrendCurve.jsx**: Frequency analysis of logged moments.
- **PathJourneyLog.jsx**: Long-term alignment with the 6 paths (Soma, Prana, Dhyana, etc.).
- **HonorLogModal.jsx**: Record of commitments kept or broken.

### Themed Button Assets

The system uses a dynamic, theme-aware button asset system for the mode navigation buttons.

**Key Features:**

- **Mode-Aware Generation:** Distinct themes for light and dark modes (40 total assets).
- **Themes:**
  - Dark: `cosmic`, `bioluminescent`, `aurora`, `crystalline`, `electric`.
  - Light: `watercolor`, `sketch`, `botanical`, `inkwash`, `cloudscape`.
- **Dynamic Loading:** `SimpleModeButton.jsx` retrieves the active theme from `settingsStore` and constructs paths: `mode_buttons/{icon}_{theme}_{mode}.png`.
- **Customization:** Themes can be toggled via the Dev Panel.

### Wisdom Hub

The library and reflection space for theoretical understanding.

- **Treatise**: Hierarchical text content (The Book of Immanence).
- **VideoLibrary.jsx**: Featured and category-based video instruction with "Idle Hearth" metaphors.
- **Self-Knowledge**: Visualization of self-reported traits and patterns.
- **Recommendations**: Dynamic content suggestions based on current needs assessment.

### ComfyUI API Integration

The system uses a direct REST API connection to a local ComfyUI instance for generating high-fidelity assets like stage backgrounds.

**Key Features:**

- **Script-based Generation:** `generate_parchment.ps1` allows headless image generation via PowerShell.
- **API Mapping:** Interacts with `http://127.0.0.1:8188/prompt` to queue workflows.
- **Workflow Management:** Uses `UnsavedWorkflow.json` (exported in API format) as the base template.
- **Dynamic Prompts:** Script modifies node values (text prompts, seeds, resolutions) before submission.

**Standard Prompt Structure:**

- **Positive:** High quality parchment paper texture, botanical watercolor accents, minimalist zen style (Seedling theme).
- **Negative:** Text, watermark, people, harsh colors, neon, oversaturated.

**Components:**

- `generate_parchment.ps1` - API client and generation logic.
- `comfyui_workflow.json` - Local copy of the generation template.

---

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

### Ritual System

Rituals are structured, multi-step meditative practices with specific friction mappings.

**Key Features:**

- **Minimum Dwell Time Enforcement:** Users must spend 50% of step duration before "NEXT STEP" unlocks
- **Visual Feedback:** Button transitions from grey to golden glow when enabled
- **Ritual Seal:** Post-session summary card for non-ritual practices showing duration, breath count, accuracy
- **Crisis Preparation Suite:** Rituals targeting specific emotional states (Agitation, Shame, Overwhelm, Numbness)

**Storm Anchor Ritual** (Crisis Preparation):

- Category: `grounding` → `SETTLE` family
- 4 steps: Sighting, Physiological Sigh, Weight of Being, Triage Script
- Friction Mapping: Targets **Agitation** via parasympathetic reset
- Path Impact: Pre-path foundational work, contributes to Ekagrata path signal

**Components:**

- `RitualPortal.jsx` - Main ritual interface with dwell time enforcement
- `PracticeSection.jsx` - Ritual Seal summary display

---

### Header & Hamburger Logic

The application header adapts dynamically to the `displayMode` (Sanctuary vs. Hearth) to ensure a clean mobile-first experience.

**Visibility States:**

- **Sanctuary Mode (Wide):**
  - Full desktop header visible (Branding, Width/Theme Toggles, Dev Panel button, version).
  - Hamburger menu hidden.
- **Hearth Mode (iPhone):**
  - Clean mobile header: Only **StageTitle** remains in the center.
  - Hamburger menu visible in the top-right.
  - Desktop controls (Toggles, Version) move inside the hamburger dropdown menu.

**Components:**

- `App.jsx` handles the conditional rendering logic based on `displayMode === 'hearth'`.

### Main Sections

```
App.jsx
├── Background.jsx          # Cosmic background
├── IndrasNet.jsx           # Particle system
├── SectionView
│   ├── Avatar.jsx          # Central multi-layer avatar (Canvas + PNGs)
│   │   ├── AvatarContainer.jsx     # Layer orchestration (z-index management)
│   │   ├── StaticSigilCore.jsx     # Inner jewel with visual effects
│   │   ├── RuneRingLayer.jsx       # Rotating rune/astrolabe ring
│   │   ├── BreathingAura.jsx       # Practice-mode breathing glow
│   │   └── HaloGate.jsx            # Radial navigation (currently disabled)
│   ├── StageTitle.jsx      # Stage/path/attention display
│   │   └── GoldCartouche.jsx   # Gold seal for attention vectors
│   └── [Section Content]
│       ├── HomeHub.jsx             # Dashboard
│       ├── PracticeSection.jsx     # Breathing, visualization, Ember FX
│       │   └── BodyScanVisual.jsx  # Body scan silhouette + Ember FX bar
│       ├── WisdomSection.jsx       # Reading content
│       ├── ApplicationSection.jsx  # Four Modes training
│       │   ├── TrackingView.jsx    # Gesture → Trace → Pattern → Direction
│       │   │   ├── AwarenessCompass.jsx        # Includes tracking stats & intention
│       │   │   ├── TodayAwarenessLog.jsx
│       │   │   ├── WeeklyReview.jsx
│       │   │   └── PathJourneyLog.jsx
│       │   └── FourModesHome.jsx   # 2x2 Mode Grid
│       └── NavigationSection.jsx   # Settings, profile
└── DevPanel.jsx            # Developer tools
```

### StageTitle Component

`StageTitle.jsx` displays the user's current stage, path, and attention vector in a compact, premium gold-bordered capsule.

**Layout Structure (3-column grid):**

1. **Left column**: Stage title image (e.g., "FLAME", "SEEDLING")
2. **Center column**: Attention Vector as `GoldCartouche` (e.g., "SAHAJA", "EKAGRATA") OR diamond separator when no attention set
3. **Right column**: Path title image (e.g., "Soma", "Prana")

**Sizing:**

- Images: `h-14` (56px) for balanced proportions
- Container padding: `4px 34px 4px` (minimal vertical, moderate horizontal)
- Min width: `300px` to prevent layout shifts

**Visual Design:**

- Dynamic gold gradient border with avatar-based lighting
- Stage-adaptive tint overlay from stage colors
- Minimal marble texture (4% opacity)
- Hover tooltips with stage/path descriptions (2s delay)
- Light mode uses multiply blend for "FLAME" title

**Components:**

- `GoldCartouche.jsx` - Polished gold seal for attention state indicators
- `TexturedTitleCard` - Internal wrapper with gold border and lighting effects

### Avatar System

The avatar is a multi-layer visual system representing the user's spiritual state through concentric layers of visual effects.

**Layer Stack (z-index order):**

1. **z-index 0**: Base plate - contrast backing for rings/core
2. **z-index 1**: Luminous canvas - glowing web pattern
3. **z-index 5**: Rune ring - rotating PNG with stage-specific markings
4. **z-index 6**: Decorative outline rings with stage-adaptive colors
5. **z-index 7-9**: Avatar sigil core with effects (see below)
6. **z-index 10**: Sigil rotation container

**Avatar Visual Effects ("Captured Star" Aesthetic):**

- **Black separation ring**: 52% backdrop with 48% avatar floating inside
- **Cyan/teal halo**: `rgba(80, 200, 180)` blurred glow bleeding over rim
- **Screen blend mode**: Luminous jewel effect on avatar image
- **Teal-tinted stone frame**: Rune ring uses `hue-rotate(-10deg)` for color harmony
- **Toned background haze**: Conic gradient at 30% opacity
- **Counter-rotation**: Avatar sigil rotates opposite to rune ring at 25% speed

**Settings:**

- `useNewAvatars` (settingsStore): Toggle between old (`Flame-Dhyana.png`) and new (`avatar-flame-dhyana-ekagrata_00001_.png`) naming conventions
- DevPanel includes "Avatar Set" toggle (OLD/NEW buttons)

**Components:**

- `avatar/index.jsx` - Main component with HaloGate integration
- `avatar/AvatarContainer.jsx` - Layer orchestration and z-index management
- `avatar/StaticSigilCore.jsx` - Inner jewel with cyan halo and screen blend
- `avatar/RuneRingLayer.jsx` - Rotating ring with teal-tinted stone effect
- `avatar/BreathingAura.jsx` - Practice-mode breathing glow
- `avatar/HaloGate.jsx` - Radial navigation system (currently disabled)
- `avatar/constants.js` - Stage colors and glow definitions

### Four Modes Components

```
ApplicationSection.jsx
└── ModeTraining.jsx
    ├── MirrorObservation.jsx      # + MirrorValidationFeedback
    │   └── VoiceInput.jsx         # Speech-to-text with preview modal
    ├── PrismSeparation.jsx        # + VoiceInput per field
    ├── WaveCapacity.jsx           # + VoiceInput per field
    └── SwordCommitment.jsx        # + VoiceInput per field
```

**Voice Input System:**

- Uses Web Speech API for speech-to-text
- "Confirm-first" preview modal pattern
- Per-field mic buttons with glassmorphic styling
- Real-time transcription with manual confirmation
- Fallback messaging for unsupported browsers

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
  breathPattern={{ inhale, holdTop, exhale, holdBottom }}
  practiceEnergy={0.5} // 0.3=stillness, 0.5=active, 1.0=intense
  pathId="prana" // Path-specific FX
  fxPreset={preset} // Custom particle behavior
  onTap={handleTap} // Accuracy feedback
  onCycleComplete={fn} // Breath cycle callback
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
- **Avatar Rotation**: The central avatar sigil rotates counter-clockwise at 25% the speed of the outer rune ring. Light/Dark modes use explicit opposing classes (`.dark-ring-rotate`, `.light-ring-rotate`) for distinct feels.
- **Interactive Shadow**: In Light Mode, the inner rim shadow dynamically shifts opposite to the moon's orbital position.
- **Z-Index Stacking**: Header section (`z-20`) is strictly above content (`z-10`) to prevent tooltip occlusion.

**Key Props:**

- `intensity` (0-1) - Particle visibility/activity
- `phase` - Current breath phase
- `ringScale` - Dynamic ring size
- `pathId` / `fxPreset` - Visual style

---

## Visual Effects & Background Components

This section maps all visual effect components to their module ownership and display mode behavior. Use this as a quick reference when debugging visual elements.

### Component Ownership Map

| Component                         | Location                 | Module     | Render Layer   | Light Mode                  | Dark Mode                            |
| --------------------------------- | ------------------------ | ---------- | -------------- | --------------------------- | ------------------------------------ |
| `Background.jsx`                  | `src/components/`        | Background | z-index 0      | Parchment base + clouds     | Cosmic particles (auto 100% height)  |
| `AvatarLuminousCanvas.jsx`        | `src/components/`        | Avatar     | z-index 1      | **Hidden** (skipHeavyFx)    | Active particles + dust + week nodes |
| `MoonOrbit.jsx`                   | `src/components/`        | Avatar     | z-index 100    | **Returns null**            | Lunar orbit SVG with glyphs          |
| `AvatarContainer.jsx`             | `src/components/avatar/` | Avatar     | z-index 6      | Decorative rings **hidden** | Full decorative outline rings        |
| `StaticSigilCore.jsx`             | `src/components/avatar/` | Avatar     | z-index 7-10   | Gold halo/glow              | Cyan/teal halo + glow                |
| `RuneRingLayer.jsx`               | `src/components/avatar/` | Avatar     | z-index 5      | Active (rotating)           | Active (rotating)                    |
| `BreathingAura.jsx`               | `src/components/avatar/` | Avatar     | Practice mode  | Active during practice      | Active during practice               |
| `PathParticles.jsx`               | `src/components/`        | Practice   | Canvas overlay | Active                      | Active                               |
| `AvatarLuminousCanvas` week nodes | `src/components/`        | Avatar     | Canvas layer   | Active (sacred geometry)    | Active (week practice dots)          |

**Key Takeaway:** Most heavy visual effects (particles, dust, decorative rings, moon orbit) are **hidden in light mode** to achieve a clean, "handled instrument" aesthetic.

### Background Layer Stack (Bottom to Top)

The complete layering order from base to content:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Background.jsx (z-index 0)                                │
│    ├─ Light Mode: Parchment base color                       │
│    └─ Dark Mode: Cosmic background with particles            │
├─────────────────────────────────────────────────────────────┤
│ 2. Cloud Overlay (HomeHub.jsx, light mode only)              │
│    ├─ Stage-specific: {stage}_{cloudVariant}.png             │
│    ├─ Position: center bottom, auto 100% height              │
│    ├─ Gradient fade at top for seamless blend                │
│    └─ Animation: 60s horizontal drift (cloudDrift)           │
├─────────────────────────────────────────────────────────────┤
│ 3. ConstellationField.jsx (REMOVED)                          │
│    └─ Previously: Canvas-based gold constellation            │
├─────────────────────────────────────────────────────────────┤
│ 4. Content Layers (z-index 10+)                              │
│    └─ Avatar, UI, text content                               │
└─────────────────────────────────────────────────────────────┘
```

### Avatar Visual Effects Stack (Inside to Outside)

The avatar is composed of multiple visual layers with specific z-index ordering:

```
Avatar Container (64% of viewport)
├─ LAYER 0 (z-index 0): Base Plate
│  ├─ Flame-specific dark backer (dark mode only)
│  ├─ Universal shadow backer (dark mode only)
│  └─ Ring rim shadow (both modes)
│
├─ LAYER 1 (z-index 1): AvatarLuminousCanvas
│  ├─ Dark Mode: Particles, dust, nebula, sacred geometry
│  └─ Light Mode: HIDDEN (skipHeavyFx = true)
│     - Particles: wrapped in if (!skipHeavyFx)
│     - Dust: wrapped in if (!skipHeavyFx)
│     - Sacred geometry: still renders
│
├─ LAYER 2 (z-index 5): RuneRingLayer
│  ├─ Rotating PNG with stage-specific rune markings
│  ├─ Both modes: Active rotation
│  └─ Speed: adjustable via ringSpeedMultiplier
│
├─ LAYER 3 (z-index 6): Decorative Outline Rings
│  ├─ Dark Mode: Two concentric rings (108%, 102%) + top pin
│  └─ Light Mode: HIDDEN (wrapped in {!isLight && (...)})
│
├─ LAYER 4 (z-index 2): Mode-specific Glow
│  ├─ Light Mode: Subtle radial gradient
│  └─ Dark Mode: None (glow handled by other layers)
│
├─ LAYER 5 (z-index 7): Inner Shadow / Depth
│  ├─ Light Mode: Directional shadow opposite moon position
│  └─ Dark Mode: Centered shadow
│
├─ LAYER 6 (z-index 8-10): StaticSigilCore
│  ├─ Inner jewel/avatar image with effects
│  ├─ Light Mode: Gold halo (rgba(200, 160, 110))
│  ├─ Dark Mode: Cyan/teal halo (rgba(80, 200, 180))
│  ├─ Conic gradient whirlpool (30% opacity)
│  ├─ Black separation ring at 52%
│  └─ Counter-rotation: Opposite to rune ring at 25% speed
│
└─ LAYER 7 (z-index 100): MoonOrbit (SVG)
   ├─ Light Mode: RETURNS NULL (completely hidden)
   └─ Dark Mode: Lunar orbit track with moon glyphs
      - Orbit radius: avatarRadius * 1.4
      - Moon phases: new, crescent, quarter, full
      - Ghost echo arc on progress change
```

### Mode-Specific Visibility Quick Reference

Use this table to quickly determine what's visible in each display mode:

| Visual Element          | Light Mode       | Dark Mode           | Notes                                      |
| ----------------------- | ---------------- | ------------------- | ------------------------------------------ |
| **Background**          | ✅ Parchment     | ✅ Cosmic particles | Auto 100% height, bottom-anchored          |
| **Cloud overlay**       | ✅ Visible       | ❌ Hidden           | Stage-specific watercolor clouds           |
| **Constellation field** | ❌ Removed       | ❌ Removed          | Deleted component (ConstellationField.jsx) |
| **Avatar particles**    | ❌ Hidden        | ✅ Visible          | AvatarLuminousCanvas skipHeavyFx check     |
| **Avatar dust**         | ❌ Hidden        | ✅ Visible          | Wrapped in if (!skipHeavyFx)               |
| **Decorative rings**    | ❌ Hidden        | ✅ Visible          | {!isLight && (...)} conditional            |
| **Moon orbit SVG**      | ❌ Returns null  | ✅ Visible          | Early return in MoonOrbit.jsx              |
| **Avatar halo color**   | 🟡 Gold          | 🔵 Cyan/Teal        | StaticSigilCore color swap                 |
| **Sacred geometry**     | ✅ Visible       | ✅ Visible          | Concentric circles in AvatarLuminousCanvas |
| **Week practice nodes** | ✅ Visible       | ✅ Visible          | Hexagram markers around avatar             |
| **Rune ring**           | ✅ Rotating      | ✅ Rotating         | Always visible in both modes               |
| **Breathing aura**      | ⚡ Practice only | ⚡ Practice only    | BreathingAura.jsx during sessions          |

**Legend:**

- ✅ Fully visible
- ❌ Completely hidden
- 🟡 Modified appearance (gold)
- 🔵 Modified appearance (cyan)
- ⚡ Conditionally visible

### Debugging Guidelines

When tracking down unexpected visual elements:

1. **Check display mode first**: Use DevPanel (Ctrl+Shift+D) to confirm light/dark mode
2. **Identify the layer**: Look at z-index to determine which component owns it
3. **Check conditional rendering**: Search for `isLight`, `skipHeavyFx`, or `colorScheme` checks
4. **Verify file changes**: Use hard refresh (Ctrl+Shift+R) to clear browser cache
5. **Restart dev server**: Some canvas-based effects require full rebuild

**Common Issues:**

- **Particles appearing in light mode**: Check `AvatarLuminousCanvas.jsx` lines 795-809 for `skipHeavyFx` wrapping
- **Cyan circles around avatar**: Check `AvatarContainer.jsx` line 130 for `{!isLight && (...)}` conditional
- **Moon orbit glyphs in light mode**: Check `MoonOrbit.jsx` line 72 for early `return null`
- **Constellation stars**: ConstellationField.jsx deleted, check it's not imported in HomeHub.jsx

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
const USE_OLLAMA = true; // Toggle between Ollama and Gemini API
const WORKER_URL = "/api/ollama"; // Vite proxy
```

### Cycle Services

**cycleManager.js** - Practice logging, consistency calculation, mode switching
**benchmarkManager.js** - Self-reported metrics, stage requirements
**circuitManager.js** - Multi-path circuit training management

```javascript
// circuitManager
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

// circuitIntegration (Internal Service)
export function completeCircuitSession() // Ends session & triggers journaling
export function saveCircuitJournal(completedCircuitId, assessment) // Stores rich data
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

### Practice Journaling Flow

```
Practice Session Completes
    ↓
circuitIntegration.completeCircuitSession()
    ↓
progressStore.recordSession()
    ↓
PostSessionJournal Modal appears
    ↓
Route: SingleSessionJournalForm OR CircuitJournalForm
    ↓
User submits rich technical notes / attention ratings
    ↓
circuitJournalStore.createEntry()
    ↓
Archive: SessionHistoryView reflects new data
```

### Awareness Tracking Flow

Tracking in Immanence OS follows a temporal resonance model: **Gesture → Trace → Pattern → Direction**.

1.  **Gesture** (`AwarenessCompass.jsx`): A rapid, somatic act (swipe) to log a moment of captured pattern. Now includes:
    - Integrated tracking statistics (count of logged items per direction)
    - Intention statement display with edit functionality
    - Direct access to state via `useApplicationStore`
2.  **Trace** (`TodayAwarenessLog.jsx`): The immediate temporal echo of recent gestures, visualized as a chronological list.
3.  **Pattern** (`WeeklyReview.jsx`): A medium-term aggregation showing emerging clusters and frequency.
4.  **Direction** (`PathJourneyLog.jsx`): Long-term narrative alignment, where tracking stats meet the user's defined "Path".

**The Intention "Seal":**
Intentions are not just text fields; they are "sealed" commitments. The transition from editing to "Sealed" state represents a small ritual of commitment, moving from potentiality to enacted direction.

**Note:** `ActiveTrackingItems` component has been deprecated and removed; `AwarenessCompass` now handles all tracking display functionality.

---

## Theming System

### Stage Colors (`src/theme/stageColors.js`)

Each stage has primary/accent/glow colors:

| Stage    | Primary        | Accent      |
| -------- | -------------- | ----------- |
| Seedling | Soft greens    | Pale gold   |
| Ember    | Warm oranges   | Copper      |
| Flame    | Deep reds      | Bright gold |
| Beacon   | Ethereal blues | Silver      |
| Stellar  | Cosmic purples | White       |

### CSS Variables

```css
:root {
  --font-sacred: "Cinzel", serif;
  --font-ui: "Outfit", sans-serif;
  --font-body: "Crimson Pro", serif;
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
│   ├── circuitJournalStore.js # NEW: Practice Journaling
│   ├── waveStore.js          # Big Five personality
│   └── ...
├── services/
│   ├── llmService.js         # Ollama integration
│   ├── cycleManager.js       # NEW: Cycle logic
│   ├── benchmarkManager.js   # NEW: Metrics
│   ├── circuitManager.js     # NEW: Circuits
│   └── circuitIntegration.js  # NEW: Bridge between UI & Stores
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

### 7. Dashboard Real Data Integration

**Home Hub** displays live user statistics:

- Total Sessions, Streak, Accuracy from `progressStore`
- Last Practiced, Next Stage, Progress % from `lunarStore`
- Quick Insights respond to real user behavior patterns
- All placeholder data removed in favor of actual tracked metrics
- **Mode-Specific Aesthetics**: Light Mode prioritizes a 'handled instrument' aesthetic with flatter geometry, 2D engraved celestial glyphs, slower rotations, and etched visual treatments. Dark Mode retains a cosmic/mystical feel with volumetric glows and faster rotations.

### 9. Practice Settings Persistence

User's last-used practice settings persist between sessions via `localStorage`:

- Practice type, duration, breath pattern
- Vipassana theme/element, sound type, geometry
- Loaded on component mount, saved when session begins
- Implemented via `loadPreferences()` and `savePreferences()` in `practiceStore.js`

### 9. Accessibility & Input Methods

Multiple input methods supported for inclusive access:

- Traditional keyboard/mouse input
- Voice input via Web Speech API (with browser fallbacks)
- Touch gestures for mobile (swiping for awareness logging)
- All critical workflows remain accessible without speech
