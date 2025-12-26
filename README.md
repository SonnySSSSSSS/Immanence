# Immanence OS

A constraint-based practice instrument for contemplative technology.

![Version](https://img.shields.io/badge/version-3.01.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![License](https://img.shields.io/badge/license-Private-red)

## Overview

Immanence OS is a local-first meditation and self-regulation application. It provides structured practices for breathing, visualization, cognitive processing, and habit tracking—without cloud dependency or data collection.

**Core Philosophy:** The system observes behavior and recognizes patterns. It does not provide advice, therapy, or gamified rewards. All data stays on your device.

> **This is training for people who are willing to be bored without quitting.**
> 
> **This platform is designed to reduce dependence on any single teacher, including its creator.**

## Progression Philosophy

The real progression in this system is not measured by more practices, more insights, or more explanation. It follows **Trunk Logic**:

*   **2 weeks** → Capacity to remain.
*   **3 months** → Capacity to observe without interference.
*   **6 months** → Capacity to act with restraint.
*   **12 months** → Capacity to carry meaning without fantasy.

Each phase should remove something, not add something. Adding risks spiritual accumulation; removing cultivates resilience.

### Evolution of the Practitioner

The system's relationship with the user shifts fundamentally at each milestone:

*   **Stage 0: Commitment** — The user commits to themselves.
*   **After 2 weeks** — Novelty is removed. The user is expected to continue without the boost of "new features" or "unlocks." Expectation increases while support remains neutral.
*   **After 3 months** — Guidance is reduced. Less explanation and more silence. The skill being trained here is self-trust under ambiguity; the system withholds comfort to foster independence.
*   **After 6 months** — Responsibility is shifted. Focus moves to real-world observation and ethical friction. Empathy, detachment, and discernment stop being ideas and become constraints on behavior.
*   **After 12 months** — Internalization. The only real question is: *"What kind of person are you when no one is watching?"* At this stage, the practitioner carries the logic internally, and the system almost disappears.

### Guarding Against Aestheticization

Meaning is never declared by the system; it must be inferred from behavior. To keep the work grounded, we prioritize behavioral evidence over "insights." Instead of asking what changed or what was realized, the focus is on:

*   *"What did you notice yourself not doing?"*
*   *"What impulse did you not follow?"*
*   *"What pattern weakened?"*

Pattern weakening is the primary metric of success.

## Features

### 🧘 Practice System
- **Breathing practices** with configurable patterns (Box, 4-7-8, Resonance, Custom)
- **Tap timing accuracy** tracking with visual feedback
- **Visualization** with sacred geometry options
- **Vipassana** (Cognitive & Somatic) thought/sensation observation
- **Circuit Training** — Multi-path sequential sessions with custom configurations

### 🔄 Four Modes (Cognitive Processing)
Sequential cognitive practice chain:
- **Mirror** — Neutral observation (with AI validation)
- **Prism** — Interpretation separation
- **Wave** — Emotional capacity training
- **Sword** — Committed action definition

### 📊 Cycle & Consistency System
- **Foundation/Advanced** cycle types (21/42 days)
- **Consecutive/Flexible** modes with different consistency requirements
- Practice logging with 10+ minute threshold
- Checkpoint reviews every 2 weeks
- Benchmark tracking for breath, focus, body capacity
- Circuit training across multiple paths

### 📈 Progress Tracking
- 5-stage progression system (Seedling → Ember → Flame → Beacon → Stellar)
- 6 path variants per stage (Soma, Prana, Dhyana, Drishti, Jnana, Samyoga)
- Streak tracking and weekly review
- Lunar cycle integration
- Consistency metrics and effective progress calculation

### 🎨 Avatar System
- Dynamic avatar with rune ring, sigil core, and particles
- Stage-based visual evolution
- Path-specific accent colors

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:5175/Immanence/
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 |
| Build | Vite (Rolldown) |
| State | Zustand |
| Animation | Framer Motion |
| 3D | React Three Fiber |
| LLM | Ollama (local) |

## Project Structure

```
src/
├── components/     # React components
├── state/          # Zustand stores
├── services/       # LLM service, utilities
├── data/           # Static data (rituals, prompts)
├── theme/          # Stage colors, theming
└── utils/          # Helper functions

public/
├── bg/             # Background images
├── visualization/  # Sacred geometry SVGs
└── stamps/         # Vipassana thought icons
```

## Documentation

- [Philosophy & Design](docs/PHILOSOPHY.md)
- [Avatar System](docs/AVATAR_SYSTEM.md)
- [Cycle & Consistency System](docs/CYCLE_SYSTEM.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [User Manual](documentation/4%20Modes%20User%20Manual.md)
- [Design Philosophy](documentation/attention-axis-logic.md)
- [LLM Integration](docs/LLM_INTEGRATION.md)
- [Development Guide](docs/DEVELOPMENT.md)

## Data & Privacy

- **Local Storage Only** — All data stored in browser localStorage
- **No Cloud Sync** — No server-side backup
- **No Telemetry** — No usage data collection
- **LLM is Local** — Ollama runs on your machine

## Development

```bash
# Lint
npm run lint

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## License

Private / User-Owned