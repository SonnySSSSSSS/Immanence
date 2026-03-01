# Immanence OS

A local-first meditation training application built with React, Three.js, and Zustand. Structured progression through breathwork, awareness practices, entrainment, and cognitive processing, with browser-first state and optional authenticated access via Supabase.

## What It Is

Immanence OS is a practice instrument for building attentional and regulatory capacity. It treats meditation not as relaxation software but as structured skill development — breath control first, then awareness, then integration.

The system provides two usage modes, a curriculum engine with capacity-based gating, symbolic identity progression, and a full internal developer tooling layer for rapid iteration.

Practice and progression data stay in browser storage. Authenticated account access is handled through the browser via Supabase in the current client code. No telemetry.

## Core Philosophy

**Breath as foundation.** Every training path begins with breathwork. Regulatory capacity is the prerequisite for attentional training — not the other way around.

**Skill-stacking.** Practices build on each other. Body scan requires breath stability. Insight work requires somatic awareness. The curriculum enforces this sequencing rather than offering a buffet.

**Capacity over calmness.** The goal is not to feel relaxed. It is to develop attentional bandwidth, filtering ability, interoceptive precision, and regulatory control that transfers outside the app.

**Structured progression.** Stages advance based on sustained consistency, not single-session performance. Identity markers (avatar, rune, stage) reflect long-term commitment.

## Dual Mode System

### Student Mode

Guardrailed curriculum with sequential unlocks. Practices gate behind prerequisite completion. The dashboard emphasizes completion rate and on-time adherence over raw volume.

- Sections locked until curriculum progression allows access
- Practice sessions launch from curriculum cards, not open browsing
- 14-day data window for focused progress tracking
- Breath benchmark required before advancing to secondary practices

### Explorer Mode

Open access to all practices and sections. Self-directed with tutorial guidance available. Tracking is enabled but nothing is gated.

- All sections and practices accessible immediately
- 90-day data window for long-term pattern recognition
- Volume and consistency as primary dashboard metrics
- Full navigation between Practice, Wisdom, Application, and Navigation

On first launch, the user chooses their mode. This choice persists but can be reset.

## Training Domains

### Regulation

Breathwork with configurable patterns — Box, 4-7-8, Resonance, Pranayama, Kumbhaka, and more. Tap-timing accuracy tracking. Breath benchmarking as a gating mechanism.

### Awareness

Body Scan (progressive somatic attention), Vipassana (cognitive observation with themed visuals), and Insight practices. Sensory configuration for different observation modes.

### Entrainment

Sound Bath (binaural beats, isochronic tones, solfeggio frequencies at 100–500Hz). Cymatics (audio-reactive visual patterns). Photonic practices (photic driving with visual geometry).

### Visualization

Sacred geometry rendering — Flower of Life, Sri Yantra, Kasina objects. 3D rendering via React Three Fiber.

### Ritual & Behavioral Tracking

Multi-step guided practices with dwell-time enforcement. Awareness compass (gesture-based directional logging). Temporal tracking model: Gesture → Trace → Pattern → Direction.

### Cognitive Processing (Four Modes)

Sequential chain: Mirror → Prism → Wave → Sword. Each mode gates behind the previous. LLM-validated (local Ollama) at each step:

- **Mirror**: Neutral observation with E-Prime compliance checking
- **Prism**: Interpretation separation (supported vs. unsupported)
- **Wave**: Emotional capacity with somatic tracking
- **Sword**: Committed action with value alignment

### Circuit Mode

Multi-practice sequential sessions. Compose breath, awareness, and entrainment exercises into ordered circuits with per-exercise journaling.

## Progression & Identity

Five stage labels remain central to the UI: Seedling, Ember, Flame, Beacon, and Stellar.

Each stage has a distinct rune ring, color palette, and avatar composition. Four practice paths (Yantra, Kaya, Chitra, Nada) emerge from sustained behavioral signal rather than being chosen from a menu. The current code uses multiple progression signals (including session-derived avatar state plus separate lunar/mandala systems), so see [ARCHITECTURE.md](ARCHITECTURE.md) for the technical split.

Cycle system enforces consistency: Foundation (14-day), Transformation (90-day), and Integration (180-day) cycles with checkpoint reviews every 14 days.

## Internal Developer Mode

Immanence OS includes a full developer panel (`Ctrl+Shift+D`) used as internal design and debugging infrastructure to accelerate iteration:

- **Avatar Composite Tuner** — Live layer manipulation (background, stage, glass, rune ring) with per-layer opacity, scale, and position controls
- **Stage/Path Preview** — Instant switching between all stage and path combinations
- **Curriculum Simulation** — Day/leg completion injection, onboarding replay, schedule override
- **Tracking Hub** — Live state inspection for all tracking stores
- **Reporting Diagnostics** — Dashboard tile queries, metric previews, policy testing
- **UI Playground** — Component isolation, card styling tuner, navigation button FX tuner
- **Breathing Ring Lab** — Phase-accurate breath ring prototyping
- **Tutorial Tools** — Tutorial state reset and step-through
- **Data Management** — Export, import, and reset all localStorage state
- **Design & Diagnostic** — Inspector overlays, layout debugging

Not production-facing. Dev-only tooling gated behind feature flag.

## Tech Stack

- **React 18** with JSX (no TypeScript)
- **Vite** (Rolldown variant) for builds
- **Zustand** with localStorage persistence (25+ stores)
- **React Three Fiber** for 3D rendering
- **Framer Motion** for animation
- **Tailwind CSS 3.4** + custom CSS
- **Ollama** (local LLM) for cognitive mode validation

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173/)
npm run dev

# Lint
npm run lint

# Production build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

Dev panel: `Ctrl+Shift+D` or tap the version number 5 times.

LLM features require Ollama running locally with `gemma3:1b` model:

```bash
ollama pull gemma3:1b
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - current top-level technical map
- [docs/DOC_GAPS.md](docs/DOC_GAPS.md) - short gap map for missing or stale docs
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - legacy architecture doc retained for reference

## License

Private project. All rights reserved.
