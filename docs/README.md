# 📚 Documentation Guide

**For AI agents working on Immanence OS**

Start here to navigate the documentation system.

---

## 🚀 Quick Start (First 5 Minutes)

### If you're NEW to this project:

1. Read: **[.github/copilot-instructions.md](../.github/copilot-instructions.md)** (5 min)
   - Quick start commands
   - Big picture architecture
   - Essential patterns & conventions
   - Code examples (Zustand, LLM, Photic Circles)

2. Reference: **[AGENTS.md](AGENTS.md)** (2 min)
   - Task spec template
   - What your task should include
   - Authority chain

3. You're productive! Reference other docs as needed.

---

## 📖 Documentation Map

### Tier 1: Start Here

| Doc | Purpose | Read when |
|-----|---------|-----------|
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | **Quick-start for agents** - patterns, examples, commands | You're new or need a refresher |
| [CLAUDE.md](../CLAUDE.md) | Project philosophy, critical rules, command reference | Understanding project intent |
| [AGENTS.md](AGENTS.md) | Task specs, authority chain, planning constraint | Creating a task spec |
| [../README.md](../README.md) | Public overview, features, setup | Understanding what Immanence OS is |

---

### Tier 2: Deep Dive Architecture

| Doc | Purpose | Read when |
|-----|---------|-----------|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Component wiring, store ownership, data flows, critical flows | Modifying multiple components or stores |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | Setup, dev commands, troubleshooting, state persistence | Setting up dev environment |
| **[LLM_INTEGRATION.md](LLM_INTEGRATION.md)** | Ollama setup, validation functions, API reference | Working on Four Modes validation |
| **[PHILOSOPHY.md](PHILOSOPHY.md)** | Design principles, why constraints exist | Understanding "why" behind decisions |
| **[DOC_ORGANIZATION_STANDARD.md](DOC_ORGANIZATION_STANDARD.md)** | How docs are organized, reusable template | Creating new docs or understanding structure |

---

### Tier 3: Feature-Specific Systems

| Doc | Purpose | When to read |
|-----|---------|--------------|
| **[AVATAR_SYSTEM.md](AVATAR_SYSTEM.md)** | Avatar rendering, stage/path/attention axes | Modifying Avatar.jsx or 3D code |
| **[CYCLE_SYSTEM.md](CYCLE_SYSTEM.md)** | Consistency cycles, checkpoints, mode switching | Modifying cycle/streak tracking |
| **[4 Modes User Manual.md](4%20Modes%20User%20Manual.md)** | End-user guide for Four Modes training | Understanding feature from user perspective |
| **[HOW-TO-USE-SAFELY.md](HOW-TO-USE-SAFELY.md)** | User-facing safety guidelines | Modifying features affecting users |
| **[INTEGRATION.md](INTEGRATION.md)** | Multi-AI workflow, agent handoff | Coordinating with other agents |

---

### Tier 4: Task Logs & Status (Historical)

| Doc | Purpose | When to read |
|-----|---------|--------------|
| **[../WORKLOG.md](../WORKLOG.md)** | Recent work, current blockers | Before starting work (context) |
| **[../PROJECT_STATUS.md](../PROJECT_STATUS.md)** | Current phase, priorities, next steps | Understanding what's happening now |
| **[../CHANGELOG.md](../CHANGELOG.md)** | Version history, breaking changes | When versioning or releasing |
| **[TASK-*.md](.)** | Individual task specs & outcomes | Specific task context |

---

## 🎯 Common Questions: Where to Look

| I need to... | Read this | Time |
|---|---|---|
| Start working on the code | `.github/copilot-instructions.md` | 5 min |
| Understand the full architecture | `ARCHITECTURE.md` | 15 min |
| Create a store (Zustand) | `.github/copilot-instructions.md` (example) + `ARCHITECTURE.md` | 10 min |
| Modify the Avatar or 3D code | `AVATAR_SYSTEM.md` | 10 min |
| Work with Four Modes / LLM | `LLM_INTEGRATION.md` + `.github/copilot-instructions.md` (Four Modes example) | 10 min |
| Understand task format | `AGENTS.md` | 5 min |
| Check project status | `../PROJECT_STATUS.md` | 2 min |
| See recent work | `../WORKLOG.md` | 5 min |
| Debug dev server issues | `DEVELOPMENT.md` → Troubleshooting | 5 min |
| Find what's redundant/needs cleanup | `DOC_INVENTORY.md` | 5 min |

---

## 🗂️ File Organization

```
docs/
├── README.md                             [THIS FILE - Navigation guide]
│
├── [Tier 1: Entry Points]
├── AGENTS.md                             [Task specs + authority]
├── ARCHITECTURE.md                       [Component wiring + flows]
├── DEVELOPMENT.md                        [Setup + troubleshooting]
├── LLM_INTEGRATION.md                    [Ollama + validation]
├── PHILOSOPHY.md                         [Design principles]
├── DOC_ORGANIZATION_STANDARD.md          [Doc organization standard]
│
├── [Tier 3: Feature Specifics]
├── AVATAR_SYSTEM.md                      [Avatar rendering]
├── CYCLE_SYSTEM.md                       [Consistency cycles]
├── 4 Modes User Manual.md                [User guide]
├── HOW-TO-USE-SAFELY.md                  [Safety guidelines]
├── INTEGRATION.md                        [Multi-AI workflow]
│
├── [Tier 4: Status & Logs]
├── ../WORKLOG.md                         [Recent work]
├── ../PROJECT_STATUS.md                  [Current phase]
├── ../CHANGELOG.md                       [Version history]
├── TASK-*.md                             [Task logs]
│
└── archive/                              [Historical/Old docs]
    ├── TASKS/                            [Old task logs]
    ├── PHASES/                           [Old phase handoff docs]
    └── SPECS/                            [Old implementation specs]
```

---

## 📋 Linked Documents (Outside docs/)

These are referenced frequently but live at project root:

| File | Purpose |
|------|---------|
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | **Agent quick-start** (primary entry point) |
| [CLAUDE.md](../CLAUDE.md) | Project philosophy + critical rules |
| [README.md](../README.md) | Public project overview |
| [WORKLOG.md](../WORKLOG.md) | Recent work + blockers |
| [PROJECT_STATUS.md](../PROJECT_STATUS.md) | Current phase + priorities |
| [CHANGELOG.md](../CHANGELOG.md) | Version history |

---

## ✅ Reading Paths by Role

### Path 1: New Agent (Get Productive)

```
1. .github/copilot-instructions.md     [5 min] ← START HERE
2. AGENTS.md                           [2 min]
3. Reference specific docs as needed   [varies]
```

**Time to productivity**: ~15 minutes

---

### Path 2: Modifying Components

```
1. .github/copilot-instructions.md     [5 min] ← Patterns + examples
2. ARCHITECTURE.md                     [15 min] ← Component wiring
3. AVATAR_SYSTEM.md or CYCLE_SYSTEM.md [10 min] ← Feature specifics
4. Code + verify                       [varies]
```

**Time to understanding**: ~30 minutes

---

### Path 3: Working with State/Stores

```
1. .github/copilot-instructions.md (Zustand example) [5 min]
2. ARCHITECTURE.md (stores section)    [10 min]
3. Read actual store files             [5 min]
```

**Time to understanding**: ~20 minutes

---

### Path 4: Working with LLM/Four Modes

```
1. .github/copilot-instructions.md (Four Modes + Photic examples) [5 min]
2. LLM_INTEGRATION.md                  [10 min]
3. src/services/llmService.js (code)   [10 min]
```

**Time to understanding**: ~25 minutes

---

## 🔍 Search Tips

**Looking for something specific?** Use these keywords:

| Topic | Search in |
|-------|-----------|
| Version increment, protected files, lint | `.github/copilot-instructions.md` |
| Task template, Reuse First planning | `AGENTS.md` |
| Store ownership, data flows, wiring | `ARCHITECTURE.md` |
| Setup, troubleshooting, dev commands | `DEVELOPMENT.md` |
| E-Prime, validation chain, Ollama setup | `LLM_INTEGRATION.md` |
| Avatar, 3D rendering, stages/paths | `AVATAR_SYSTEM.md` |
| Cycles, checkpoints, modes | `CYCLE_SYSTEM.md` |
| Recent work, blockers, priorities | `../WORKLOG.md` or `../PROJECT_STATUS.md` |

---

## 🎁 Quick Reference: Key Concepts

### Architecture in 30 Seconds

- **Frontend**: React 19 + Vite, local-first
- **State**: 26+ Zustand stores with localStorage
- **Sections**: HomeHub, PracticeSection, WisdomSection, ApplicationSection, NavigationSection
- **Key flows**: Session logging → progressStore, Curriculum → curriculumStore, Display modes → displayModeStore

### Development in 30 Seconds

- **Dev**: `npm run dev` (opens http://localhost:5175/Immanence/)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Version**: Always increment patch in `src/App.jsx`

### Four Modes in 30 Seconds

Flow: Mirror (E-Prime) → Prism (Interpretation) → Wave (Emotional) → Sword (Commitment)

All validated via Ollama local LLM (`http://localhost:11434`)

---

## ⚙️ Document Maintenance

**Who updates what:**

| Doc | Updated by | Frequency |
|-----|-----------|-----------|
| `.github/copilot-instructions.md` | Project lead | Quarterly or after major changes |
| `AGENTS.md` | Project lead | As authority/workflow changes |
| `ARCHITECTURE.md` | Senior dev | On major architecture changes |
| `../WORKLOG.md` | Current agent | Per work session |
| `../PROJECT_STATUS.md` | Project lead | Weekly |
| `../CHANGELOG.md` | Project lead | Per release |
| `TASK-*.md` | Assigned agent | During task |

---

## 🚨 Getting Help

- **Questions about this doc**: See [DOC_ORGANIZATION_STANDARD.md](DOC_ORGANIZATION_STANDARD.md)
- **Questions about your task**: See [AGENTS.md](AGENTS.md)
- **Questions about code**: See [ARCHITECTURE.md](ARCHITECTURE.md) then code files
- **Questions about setup**: See [DEVELOPMENT.md](DEVELOPMENT.md)
- **Questions about LLM**: See [LLM_INTEGRATION.md](LLM_INTEGRATION.md)

---

## 📌 Important Notes

### Protected Files (Show Diff First, Wait for Approval)

- `src/components/Avatar.jsx`
- `src/components/MoonOrbit.jsx`
- `src/components/MoonGlowLayer.jsx`

### Critical Rules

1. **Always increment version** after ANY code change (`.src/App.jsx`, patch digit)
2. **Single-line edits only** (3–5 lines context before/after)
3. **Follow task spec format** (see AGENTS.md)
4. **Reuse before creating new** (see "Planning Constraint" in AGENTS.md)

---

## 📊 File Statistics

| Tier | Files | Status |
|------|-------|--------|
| Tier 1 (Entry) | 4 | ✅ Ready |
| Tier 2 (Architecture) | 5 | ✅ Ready |
| Tier 3 (Features) | 5 | ✅ Ready |
| Tier 4 (Logs) | ~10 | ✅ Ready |
| Archive | Various | 📦 Historical |

**Total active docs**: ~24 files  
**Total documentation**: ~5,000+ lines  
**Onboarding time**: ~15 minutes

---

## 🎉 Ready to Start?

1. ✅ Read [.github/copilot-instructions.md](../.github/copilot-instructions.md) (5 min)
2. ✅ Understand your task (AGENTS.md)
3. ✅ Reference docs as needed
4. ✅ Ship great code!

---

**Last Updated**: 2026-01-10  
**Status**: Active & Maintained  
**Questions?** Reference the docs above or ask the project lead.
