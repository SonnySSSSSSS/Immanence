# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Immanence OS** is a local-first meditation and self-regulation application built with React 19, React Three Fiber, and Zustand. It provides structured practices for breathing, visualization, cognitive processing (Four Modes), and habit tracking—without cloud dependency or data collection.

**Core Philosophy:** The system observes behavior and recognizes patterns. It does not provide advice, therapy, or gamified rewards. All data stays on your device.

## Development Commands

```bash
# Start development server (opens at http://localhost:5175/Immanence/)
npm run dev

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Critical Development Rules

### ⚠️ MANDATORY: Increment Build Version

**Location**: `src/App.jsx` (around line 369)
**Action**: Increment the patch number (last digit) after ANY code modification
**Current format**: `v3.14.15`

### Protected Files (Show Diff First, Wait for Approval)

- `src/components/Avatar.jsx`
- `src/components/MoonOrbit.jsx`
- `src/components/MoonGlowLayer.jsx`

### Protected Patterns (Critical - Do Not Break)

**Particle System Display Mode Switching** (`src/components/IndrasNet.jsx`)
- Three-layer protection system prevents particle stretching when switching hearth ↔ sanctuary
- See `docs/PARTICLE_SYSTEM_PROTECTION.md` for detailed documentation
- ⚠️ DO NOT remove React `key` prop from canvas element
- ⚠️ DO NOT modify displayMode useEffect without reading protection docs
- Test checklist: Toggle modes 10x, verify no stretching/duplication

### Turbo Execution & Verification Rules

1. **TURBO-ALL**: Always set `SafeToAutoRun: true` for build, lint, formatting, and browser verification commands. Do not wait for manual approval on these.
2. **BROWSER AUDITS**: Use `browser_subagent` proactively for visual verification at the target viewports (320px, 1080px).
3. **NEVER restore from git** without explicit user permission.
4. **Avoid multi-line replacements** — Use single-line anchors for edits.
5. **Small changes only** — One thing at a time, verify before next change.
6. **DO NOT guess** — If something is missing, ASK instead of improvising.
7. **STOP ON FAILURE**: Only stop the flow if a build error or logical block occurs. Report success only at the end of the task.

## Architecture Overview

### Tech Stack

- **Frontend**: React 19 with JSX (no TypeScript)
- **Build Tool**: Vite (using Rolldown variant: `rolldown-vite@7.2.5`)
- **State Management**: Zustand with localStorage persistence
- **3D Graphics**: React Three Fiber (@react-three/fiber, @react-three/drei, @react-three/postprocessing)
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS 3.4 + Custom CSS
- **LLM Integration**: Ollama (local) via `/api/ollama` proxy

### Base URL Configuration

The app is deployed to GitHub Pages with base path `/Immanence/` (configured in `vite.config.js`).

### Display Modes

Two layout modes controlled by `displayModeStore`:

- **Sanctuary**: iPad landscape width (1366px) — spacious reading mode
- **Hearth**: Standard desktop width (1080px) — focused practice mode

Two color schemes:

- **Dark**: Default cosmic gradient backgrounds
- **Light**: Warm parchment aesthetic

## Key Architectural Patterns

### State Management (Zustand)

All stores use the `persist` middleware with localStorage. Key stores:

| Store              | Purpose                               | Storage Key              |
| ------------------ | ------------------------------------- | ------------------------ |
| `progressStore`    | Session tracking, streaks, benchmarks | `immanence-progress`     |
| `applicationStore` | Awareness tracking & Intention        | `immanence-application`  |
| `chainStore`       | Four Modes chains                     | `immanence-chains`       |
| `cycleStore`       | Cycle & consistency tracking          | `immanence-cycle`        |
| `waveStore`        | Big Five personality profile          | `immanence-wave-profile` |
| `lunarStore`       | Lunar cycle tracking                  | `immanence-lunar`        |
| `attentionStore`   | Attention path inference              | `immanence-attention`    |
| `settingsStore`    | App settings & preferences            | `immanence-settings`     |

### Component Hierarchy

```
App.jsx (Root)
├── Background.jsx          # Cosmic/parchment background
├── IndrasNet.jsx           # Particle system decoration
├── HomeHub.jsx             # Dashboard with Avatar + StageTitle
├── PracticeSection.jsx     # Breathing, Visualization, Rituals, Circuit Mode
├── WisdomSection.jsx       # Treatise, Videos, Recommendations, Self-Knowledge
├── ApplicationSection.jsx  # Four Modes training + Awareness Tracking
│   ├── FourModesHome.jsx   # 2x2 Mode Grid
│   └── TrackingView.jsx    # Gesture → Trace → Pattern → Direction
├── NavigationSection.jsx   # Settings, profile, path selection
├── DevPanel.jsx            # Developer tools (Ctrl+Shift+D)
├── SigilTracker.jsx        # Vigilance Mode tracker (double-tap or long-press)
└── HardwareGuide.jsx       # Hardware setup instructions
```

### Four Modes System

Sequential cognitive processing chain: **Mirror → Prism → Wave → Sword**

- **Mirror**: Neutral observation with E-Prime validation (LLM-powered)
- **Prism**: Interpretation separation (supported vs. unsupported)
- **Wave**: Emotional capacity training with somatic tracking
- **Sword**: Committed action definition with value alignment

**Chain State Flow**: Each mode must be "locked" before proceeding to the next. Chains are stored in `chainStore` with detailed validation results.

### Cycle & Consistency System

Three cycle types:

- **Foundation**: 14 days (for beginners)
- **Transformation**: 90 days (for intermediate)
- **Integration**: 180 days (for advanced)

Two modes:

- **Consecutive**: 100% consistency required
- **Flexible**: 67% consistency required

**Checkpoints** occur every 14 days. Users can switch modes at checkpoints based on consistency rate.

### LLM Integration (Ollama)

Local LLM service at `http://localhost:11434` proxied through Vite as `/api/ollama`.

**Key Functions** (in `src/services/llmService.js`):

- `validateMirrorEntry()` - E-Prime compliance check
- `evaluatePrismInterpretations()` - Interpretation quality check
- `evaluateWaveCoherence()` - Emotional coherence validation
- `validateSwordCommitment()` - Action commitment clarity check

**Setup**: Install Ollama and run `ollama pull gemma3:1b`

### Avatar System

Multi-layer 3D avatar with:

- **Rune Ring**: Outer rotating ring (62.4s clockwise)
- **Sigil Core**: Inner rotating sigil (249.6s counter-clockwise, 25% speed of ring)
- **PathParticles**: Canvas-based particle system with 12+ breath-synced motion patterns

**Stage Progression**: Seedling → Ember → Flame → Beacon → Stellar
**Path Variants**: Soma, Prana, Dhyana, Drishti, Jnana, Samyoga

Each stage/path combo has unique accent colors and particle effects defined in `src/theme/stageColors.js` and `src/data/pathFX.js`.

### Practice Types

1. **Breath & Stillness**: Configurable patterns (Box, 4-7-8, Resonance, Custom) with tap timing accuracy
2. **Visualization**: Sacred geometry with 3D rendering (Flower of Life, Sri Yantra, etc.)
3. **Vipassana**: Cognitive & Somatic observation with themed visuals
4. **Cymatics**: Audio-reactive visual patterns with frequency mapping
5. **Sound Bath**: Binaural beats and isochronic tones (100-500Hz)
6. **Body Scan**: Silhouette-based progressive relaxation
7. **Ritual Mode**: Multi-step guided practices with dwell time enforcement
8. **Circuit Mode**: Multi-path sequential practice sessions

### Awareness Tracking

Temporal resonance model: **Gesture → Trace → Pattern → Direction**

1. **Gesture** (`AwarenessCompass.jsx`): Swipe-based logging with 8 directions (N, NE, E, SE, S, SW, W, NW)
2. **Trace** (`TodayAwarenessLog.jsx`): Today's chronological log
3. **Pattern** (`WeeklyReview.jsx`): 7-day aggregation with frequency heatmap
4. **Direction** (`PathJourneyLog.jsx`): Long-term narrative alignment

**Intention System**: Users define a sealed "intention" that anchors their tracking practice.

## UI/UX Design Principles

### Meditative Practice Aesthetic

- **High-tech HUD over cosmic chaos**: Interface that listens, not demands
- **One dominant visual anchor** per screen
- **Local quiet zones**: Glass capsule containers with backdrop blur
- **Compressed luminance**: Softer contrasts during practice (lifted blacks, capped highlights)
- **Motion transfers**: Animation flows, doesn't stack; freeze everything except focus point

### Visual Elements

- **Glass capsules**: Thin white strokes, `backdrop-filter: blur(12px)`
- **Serif fonts**: Cinzel (sacred), Playfair Display (headers), Crimson Pro (body)
- **Fine gold hairline rules**: Avoid thick glows
- **Rounded frames**: Defined borders for visualizations
- **Text pulsing**: Collapsible affordances pulse when idle, stop on hover

### Color Mapping

**Stage Colors** (defined in `src/theme/stageColors.js`):

- Seedling: Soft greens, pale gold
- Ember: Warm oranges, copper
- Flame: Deep reds, bright gold
- Beacon: Ethereal blues, silver
- Stellar: Cosmic purples, white

**Sound Frequencies** (100-500Hz):

- 100-200Hz: Warm Orange #FF8C42 (grounding)
- 200-300Hz: Yellow #FFD93D (energizing)
- 300-400Hz: Green #6BCF7F (balance)
- 400-500Hz: Blue #4A90E2 (ethereal)

## File Organization

```
src/
├── components/           # React components
│   ├── vipassana/        # Vipassana-specific visuals
│   ├── Codex/            # Wisdom content cards
│   └── ...
├── state/                # Zustand stores (21 stores)
├── services/             # LLM, cycle management, benchmarks, circuits
├── data/                 # Static data (rituals, prompts, treatise)
│   └── rituals/          # Ritual definitions by category
├── theme/                # Stage colors, theming
├── utils/                # Helper functions, image preloader
├── hooks/                # Custom hooks (useWakeLock, useCymaticsAudio, etc.)
├── icons/                # Icon system with filled/glow variants
│   └── library/
├── context/              # React contexts (ThemeProvider)
└── App.jsx               # Root component

docs/                     # Technical documentation
├── ARCHITECTURE.md       # System architecture (most detailed)
├── CYCLE_SYSTEM.md       # Cycle & consistency details
├── AVATAR_SYSTEM.md      # Avatar progression system
├── LLM_INTEGRATION.md    # Ollama setup guide
├── DEVELOPMENT.md        # Dev environment setup
└── PHILOSOPHY.md         # Design philosophy

public/
├── bg/                   # Background images (stage-specific)
├── visualization/        # Sacred geometry SVGs
└── stamps/               # Vipassana thought icons
```

## Data & Privacy

- **Local Storage Only**: All data in browser localStorage (no cloud sync)
- **No Telemetry**: No usage data collection
- **LLM is Local**: Ollama runs on your machine
- **No Backend**: Static site deployment (GitHub Pages)

## DevPanel Access

Press **Ctrl+Shift+D** or click 🎨 button in header to open developer panel:

- Avatar preview with stage/path selection
- Lunar progress controls
- Path ceremony triggers
- Attention tracking data viewer
- LLM connection testing
- Data management (export/import/reset localStorage)

## Common Development Tasks

### Adding a New Practice Type

1. Define practice in `src/data/practiceFamily.js`
2. Create visual component in `src/components/`
3. Add session recording logic to `practiceStore.js`
4. Update `PracticeSection.jsx` to render new type

### Adding a New Ritual

1. Create ritual definition in `src/data/rituals/{category}/{name}.js`
2. Follow structure: `{ id, name, category, steps[], pathImpact, frictionMapping }`
3. Import in `src/data/rituals/ritualCategories.js`

### Modifying Avatar Appearance

1. **PROTECTED FILE**: Show diff first, wait for approval
2. Edit `src/components/Avatar.jsx`
3. Test all stage/path combinations in DevPanel
4. Increment version in App.jsx

### Adding a New Zustand Store

1. Create in `src/state/{name}Store.js`
2. Use `persist` middleware with unique storage key
3. Define clear actions and selectors
4. Import and use in components

### Updating LLM Prompts

1. Edit system prompts in `src/services/llmService.js`
2. Test validation in DevPanel → LLM Test Panel
3. Ensure Ollama is running (`ollama list`)

## Backup & Restore Strategy

**Structure**:

- `D:\Unity Apps\immanence-os` — Main development folder
- `D:\Unity Apps\immanence-os-backup` — Git backup repository

**Flow**: `immanence-os` → `immanence-os-backup` → GitHub (`backup-latest` branch)

**Restore**: NEVER run `git reset/restore` in main folder. Copy files FROM backup INTO main folder.

## Troubleshooting

### Dev server won't start

```bash
rm -rf node_modules/.vite
npm run dev
```

### LLM validation failing

1. Check Ollama: `ollama list`
2. DevPanel → LLM Test Panel → Test Connection
3. See `docs/LLM_INTEGRATION.md`

### State corruption

DevPanel → Data Management → Clear All Data
Or: `localStorage.clear(); location.reload();`

### Module not found

```bash
npm install
```

## Design Philosophy

Immanence OS is a **constraint-based practice instrument**:

- Observes behavior, does not prescribe
- Provides structure without judgment
- Uses AI for validation, not recommendation
- No gamification — Honor/Dishonor are factual records, not rewards
- Hysteresis in path inference — sustained behavioral signals required
- Local-first architecture for privacy and autonomy
