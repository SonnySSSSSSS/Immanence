## Purpose

This file tells AI coding agents how to be immediately productive in Immanence OS.
Follow repository-specific rules, workflows, and examples — not generic advice.

## Quick start
- Dev server: `npm run dev` (opens at http://localhost:5175/Immanence/)
- Build: `npm run build`; Preview: `npm run preview`; Deploy: `npm run deploy`
- LLM (local) proxy: `/api/ollama` via Vite — see `docs/LLM_INTEGRATION.md` and `src/services/llmService.js`
- Version increment: Update patch digit in `src/App.jsx` (line ~369) after ANY change

## Big picture architecture

**Frontend-only local-first React app** (Vite + React 19, no TypeScript). Entry: `src/App.jsx`.

**State layer**: 26+ Zustand stores under `src/state/` using `persist` middleware + localStorage (keys documented in `CLAUDE.md`). Key flows:
- `progressStore` — session logging, streaks, domain stats
- `practiceStore` — practice session preferences + history  
- `cycleStore` — consistency tracking (Foundation/Transformation/Integration cycles)
- `curriculumStore` — onboarding + 14-day ritual foundation program
- `navigationStore` — path/program selection and unlocks
- `displayModeStore` — layout (hearth/sanctuary) and color scheme (dark/light)

**Component sections** (major `App.jsx` routes via `activeSection`):
- `HomeHub` — dashboard with streak/stats and practice shortcuts
- `PracticeSection` — breathing, visualization, rituals, Four Modes (Circuit), Sensory, Photic Circles overlay
- `WisdomSection` — treatise, videos, recommendations, bookmarks
- `ApplicationSection` — Four Modes training chain (Mirror → Prism → Wave → Sword)
- `NavigationSection` — path/program cards, consistency foundation, path ceremonies
- 3D/avatar code in `src/components/Avatar.jsx` and related (protected)

**Data catalog** (`src/data/`): `practiceFamily.js`, `navigationData.js`, `vipassanaThemes.js`, `ritualFoundation14.js`, `treatise.generated.js`, `videoData.js`, `wisdomRecommendations.js`.

**LLM integration**: Ollama local proxy via `/api/ollama` (Vite rewrites to `http://localhost:11434`). Used for Four Modes validation (Mirror E-Prime check, Prism interpretation grading, Wave emotional coherence, Sword commitment clarity).

## Essential patterns & conventions

1. **Version increment**: After any code change, increment patch digit in `src/App.jsx` (line ~369). Format: `v3.14.15` → `v3.14.16`.
2. **Single-line edits**: Use narrow anchors (3–5 lines context before/after). Never multi-line blind replacements.
3. **Reuse-first planning**: Before proposing new component/store, list existing ones and justify reuse decision (see `docs/AGENTS.md` example).
4. **Protected files**: Avatar.jsx, MoonOrbit.jsx, MoonGlowLayer.jsx — show diff first, wait for approval.
5. **Small scope**: One change at a time. Verify before proceeding to next task.
6. **All tasks require**: Goal, Allowlist, Denylist, Constraints, Verification steps, Commit message (see `docs/AGENTS.md`).

## Component hierarchy

```
App.jsx (Root + section router)
├── Background.jsx / IndrasNet.jsx (Decoration)
├── SectionView (Avatar wrapper)
│   └── Avatar.jsx (3D with stage/path/attention)
│
└── Section switcher (activeSection):
    ├── HomeHub (Dashboard)
    │   ├── StageTitle, Avatar, HubStagePanel
    │   ├── HubCardSwiper (practice shortcuts)
    │   ├── CompactStatsCard (streaks/stats)
    │   └── CurriculumHub (onboarding/14-day)
    │
    ├── PracticeSection (Practice runner)
    │   ├── Practice picker + configs
    │   ├── Runners: BreathingRing, VisualizationCanvas, CymaticsVisualization, PhoticCirclesOverlay
    │   ├── RitualLibrary (ritual selection → RitualSession)
    │   └── SessionSummaryModal / PostSessionJournal
    │
    ├── WisdomSection (Content library)
    │   ├── Tabs: Recommendations, Treatise, Bookmarks, Videos, Self-Knowledge
    │   ├── VideoLibrary, SelfKnowledgeView
    │   └── Bookmarks persist to wisdomStore
    │
    ├── ApplicationSection (Four Modes training)
    │   ├── FourModesHome (2x2 grid: Mirror/Prism/Wave/Sword)
    │   ├── TrackingView (Gesture → Trace → Pattern → Direction)
    │   └── LLM validation at each stage
    │
    └── NavigationSection (Path/program selection)
        ├── Avatar (scaled), ConsistencyFoundation
        ├── PathSelectionGrid (with program cards)
        ├── PathOverviewPanel, ActivePathState
        └── CycleChoiceModal / ThoughtDetachmentOnboarding
```

## Data flow patterns

- **Session logging**: `PracticeSection` calls `progressStore.recordSession()` on stop (domain inferred from practice type). If ≥10 min, `cycleManager.logPractice()` updates `cycleStore`.
- **Curriculum progression**: `curriculumStore.setActivePracticeSession()` triggers auto-load in `PracticeSection`. On completion, `logLegCompletion()` marks day/leg and derives guidance.
- **LLM validation**: `llmService.validateMirrorEntry()` / `evaluatePrismInterpretations()` / etc. Tests via DevPanel → LLM Test Panel (Ctrl+Shift+D).
- **Display mode**: `displayModeStore` controls responsive breakpoints (hearth: 430px, sanctuary: 1366px) and color schemes; read by all surfaces.

## Where to make specific changes

- **New practice type**: `src/data/practiceFamily.js` (catalog entry) → component in `src/components/practice/` → config in `PracticeSection.jsx` → session logic (`practiceStore` helpers if needed).
- **New program/path**: Edit `src/data/navigationData.js` and `src/data/pathDescriptions.js`; register in `PathSelectionGrid.jsx`.
- **LLM prompts**: `src/services/llmService.js` (validation functions); test immediately via DevPanel.
- **New store**: `src/state/{name}Store.js` with `persist` middleware + unique `name` key (e.g., `{ name: 'immanence-foo', version: 1 }`).
- **Styling**: Tailwind + custom CSS in `src/styles/` or component `.css` files; check `displayModeStore.colorScheme` for dark/light variants.
- **Avatar state derivation**: Update `src/state/avatarState.js` (coherence formula weights/penalties) or add new metrics to calculation. All avatar components automatically consume via `deriveAvatarState()` — no manual state propagation needed. See ARCHITECTURE.md "Avatar State Derivation" section for formula and stage mapping.

### Zustand Store Lifecycle Example

```javascript
// src/state/exampleStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useExampleStore = create(
  persist(
    (set, get) => ({
      // State
      data: [],
      selectedId: null,

      // Actions
      addItem: (item) => set((state) => ({
        data: [...state.data, item],
      })),
      
      selectItem: (id) => set({ selectedId: id }),

      // Selectors
      getSelected: () => {
        const state = get();
        return state.data.find(item => item.id === state.selectedId);
      },
    }),
    {
      name: 'immanence-example', // localStorage key
      version: 1, // Migration version
      partialize: (state) => ({ // Optional: only persist some fields
        data: state.data,
        selectedId: state.selectedId,
      }),
    }
  )
);
```

**Key points:**
- `name` must be unique and start with `immanence-` (see CLAUDE.md for all keys)
- `version` allows migrations when schema changes
- `partialize` restricts which fields persist to localStorage
- Access state with `useExampleStore()` in components or `useExampleStore.getState()` in non-React code

### Four Modes Validation Chain

**Flow**: Mirror (E-Prime) → Prism (Interpretation) → Wave (Emotional) → Sword (Commitment)

**LLM Integration** (all in `src/services/llmService.js`):

```javascript
// Mirror: Validate E-Prime (no "is/am/are" + objective only)
async function validateMirrorEntry(text) {
  const systemPrompt = `Check if text uses E-Prime (no "is/am/are") and describes only observations...`;
  const userPrompt = `Check: "${text}"`;
  // Returns: { valid: boolean, issues: string[], suggestions: string[] }
}

// Prism: Grade interpretation quality (supported vs unsupported claims)
async function evaluatePrismInterpretations(mirror, interpretations) {
  const systemPrompt = `Evaluate if interpretations logically follow from observation...`;
  const userPrompt = `Observation: "${mirror}"\nInterpretations: ${JSON.stringify(interpretations)}`;
  // Returns: { scores: { [id]: 0-1 }, feedback: { [id]: string } }
}

// Wave: Check emotional coherence (somatic + affective congruence)
async function evaluateWaveCoherence(prism, emotionalCapacity) {
  const systemPrompt = `Assess emotional readiness and somatic alignment...`;
  const userPrompt = `Interpretation: "${prism}"\nCapacity: ${emotionalCapacity}`;
  // Returns: { coherent: boolean, guidance: string }
}

// Sword: Validate commitment clarity (specificity + values alignment)
async function validateSwordCommitment(wave, commitment) {
  const systemPrompt = `Check if commitment is specific, achievable, and value-aligned...`;
  const userPrompt = `Action: "${commitment}"\nContext: ${wave}`;
  // Returns: { valid: boolean, strength: 0-1, refinement: string }
}
```

**Testing**: DevPanel → LLM Test Panel (Ctrl+Shift+D) includes pre-filled examples for each stage.

### Photic Circles System

**What it does**: Experimental light-based entrainment overlay that displays pulsing circles at adjustable frequencies (0.1–20 Hz) for photic stimulation during meditation.

**Entry point**: "Photic" button in `PracticeSection` practice type switcher opens `PhoticCirclesOverlay` (full-viewport overlay, z-index 1000).

**Configuration** (persisted in `settingsStore.photic`):
- Rate: 0.1–20 Hz (frequency of pulse)
- Brightness: 0–1.0 (circle opacity)
- Spacing: 40–320px (distance between circles)
- Radius: 40–240px (circle size)
- Blur: 0–80px (edge softness)
- Colors: 6 presets (white/amber/red/green/blue/violet)

**Technical**: RAF-based loop uses refs for DOM updates (no React re-renders) for performance. UI state (`isOpen`, `isRunning`) kept in component; settings persist to store.

### Avatar State Derivation (AvatarState Contract)

**What it does**: Single canonical source of truth for avatar state. Computes `coherence` deterministically from metrics + transient signals, maps to `stageIndex`, and aggregates all avatar-relevant data.

**Location**: `src/state/avatarState.js` → Exports `deriveAvatarState({ mode, breathPattern, snapshot })`

**Coherence Formula** (deterministic, no LLM):
```javascript
base = 0.55 * avgAccuracy + 0.45 * weeklyConsistency
signal = 0.5 * (focus + clarity)
penalty = distortion
coherence = clamp01(0.55 * base + 0.45 * signal - 0.25 * penalty)
```

**Stage Mapping** (coherence → stageIndex):
- [0.00–0.15) → 0 (SEEDLING)
- [0.15–0.35) → 1 (EMBER)
- [0.35–0.55) → 2 (FLAME)
- [0.55–0.80) → 3 (BEACON)
- [0.80–1.00] → 4 (STELLAR)

**Key distinction**:
- `phase` (persisted development stage) — Does NOT change during sessions
- `coherence`/`stageIndex` (transient alignment) — Updates from live metrics

**Usage**:
```javascript
import { deriveAvatarState } from '../../state/avatarState.js';

const avatarState = deriveAvatarState({ mode: 'hub' });
const { coherence, stageIndex, phase, metrics } = avatarState;
```

All avatar components consume canonical state (no redundant local derivation).

**Documentation**: See `docs/AVATAR_STATE_REFACTOR.md` for implementation details.

## Build & troubleshooting

- **Base path**: `/Immanence/` (configured in `vite.config.js`). Verify routing when previewing.
- **Dev server crash**: `rm -rf node_modules/.vite && npm run dev`.
- **Ollama unreachable**: Check `ollama list` and `ollama --version`; ensure `http://localhost:11434` is accessible locally.
- **Lint errors**: `npm run lint` before commit.

## Verification checklist

1. Increment version in `src/App.jsx`.
2. Run `npm run lint` (no errors).
3. Run `npm run dev` and test in browser (visual smoke test at 320px + 1080px viewports).
4. For LLM changes: Use DevPanel → LLM Test Panel to verify connection + model output.
5. For state changes: Clear localStorage (DevPanel → Data Management) and test workflow end-to-end.
6. Write concise commit message (goal + verification steps).

## Key files for context

- **Entry points** (read first): `.github/copilot-instructions.md` (this file), `CLAUDE.md`, `docs/AGENTS.md`
- **Architecture & data flows**: `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/DOC_ORGANIZATION_STANDARD.md`
- **Agent rules & task specs**: `docs/AGENTS.md`
- **LLM setup & API**: `docs/LLM_INTEGRATION.md`
- **Project philosophy & storages**: `CLAUDE.md`
- **README**: `README.md` (root)
