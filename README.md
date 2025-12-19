# Immanence OS

A constraint-based practice instrument for contemplative technology.

![Version](https://img.shields.io/badge/version-2.96.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![License](https://img.shields.io/badge/license-Private-red)

## Overview

Immanence OS is a local-first meditation and self-regulation application. It provides structured practices for breathing, visualization, cognitive processing, and habit tracking—without cloud dependency or data collection.

**Core Philosophy:** The system observes behavior and recognizes patterns. It does not provide advice, therapy, or gamified rewards. All data stays on your device.

## Features

### 🧘 Practice System
- **Breathing practices** with configurable patterns (Box, 4-7-8, Resonance, Custom)
- **Tap timing accuracy** tracking with visual feedback
- **Visualization** with sacred geometry options
- **Vipassana** thought labeling practice

### 🔄 Four Modes (Cognitive Processing)
Sequential cognitive practice chain:
- **Mirror** — Neutral observation (with AI validation)
- **Prism** — Interpretation separation
- **Wave** — Emotional capacity training
- **Sword** — Committed action definition

### 📊 Progress Tracking
- 5-stage progression system (Seedling → Ember → Flame → Beacon → Stellar)
- 6 path variants per stage
- Streak tracking and weekly review
- Lunar cycle integration

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