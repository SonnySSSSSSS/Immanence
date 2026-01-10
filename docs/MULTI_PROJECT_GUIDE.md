# Multi-Project Documentation Guide

**Purpose**: Apply the documentation standard across multiple AI agent projects  
**For**: Project leads coordinating 2–20 AI agents across different codebases

---

## Standard Structure (Reusable Template)

Every project gets this same 5-tier structure:

```
PROJECT_ROOT/
├── .github/
│   └── copilot-instructions.md          [Tier 1: Agent quick-start]
├── CLAUDE.md                             [Tier 1: Philosophy + rules]
├── README.md                             [Tier 1: Public overview]
│
├── docs/
│   ├── AGENTS.md                         [Tier 1: Authority + task specs]
│   ├── ARCHITECTURE.md                   [Tier 2: Component wiring]
│   ├── DEVELOPMENT.md                    [Tier 2: Setup + troubleshooting]
│   ├── PHILOSOPHY.md                     [Tier 2: Design principles]
│   ├── DOC_ORGANIZATION_STANDARD.md      [Tier 2: THIS standard]
│   │
│   ├── [FEATURE]_SYSTEM.md               [Tier 3: Feature-specific]
│   ├── [FEATURE]_SYSTEM.md               [Tier 3: Feature-specific]
│   │
│   ├── WORKLOG.md                        [Tier 4: Recent work]
│   ├── PROJECT_STATUS.md                 [Tier 4: Current phase]
│   ├── CHANGELOG.md                      [Tier 4: Version history]
│   ├── TASK-{DATE}-{ID}.md               [Tier 4: Task logs]
│   │
│   └── archive/                          [Tier 5: Old docs]
│       ├── TASKS/
│       ├── PHASES/
│       └── SPECS/
│
└── .docs/ (optional)
    └── agent-instructions-custom.md      [Per-agent customizations]
```

---

## Customization Per Project

### Project Variables

Each project fills in these blanks:

```markdown
# [PROJECT_NAME] - Documentation Quick Start

**Repository**: [GITHUB_REPO]  
**Owner**: [PROJECT_LEAD]  
**Primary Language**: [e.g., Python, JavaScript, Go]  
**Tech Stack**: [e.g., React + Zustand + Vite]  
**Agent Support**: [e.g., Claude Code, Gemini, Codex CLI]  

## Quick Commands

- **Dev**: `[COMMAND]`
- **Build**: `[COMMAND]`
- **Test**: `[COMMAND]`
- **Deploy**: `[COMMAND]`

## Critical Rules (Project-Specific)

- [Rule 1]
- [Rule 2]
- [Rule 3]

## Key Files

- Architecture: `[PATH]`
- State/Config: `[PATH]`
- Entry point: `[PATH]`
```

---

## Example: Mapping Projects to Standard

### Example 1: Web App (React + Zustand)

```
immanence-os/
├── .github/copilot-instructions.md
│   ├─ Big picture: React 19, Zustand stores, Vite
│   ├─ Zustand store example
│   ├─ LLM validation patterns
│   └─ Verification checklist
├── docs/ARCHITECTURE.md
│   ├─ Component hierarchy (ASCII diagram)
│   ├─ Data flow (session logging, curriculum, display modes)
│   ├─ State layer (26 stores, keys, wiring)
│   └─ Critical flows (navigation → practice → completion)
└─ docs/LLM_INTEGRATION.md
   ├─ Ollama setup
   ├─ Four Modes validation chain
   └─ Testing via DevPanel
```

**Tier 1 focus**: Agent needs to understand Zustand + LLM integration  
**Tier 2 focus**: Component hierarchy + data flow between stores  
**Tier 3 focus**: Feature-specific systems (AVATAR_SYSTEM.md, CYCLE_SYSTEM.md)

---

### Example 2: Backend Service (Node.js + Express)

```
backend-service/
├── .github/copilot-instructions.md
│   ├─ Big picture: Node.js, Express, PostgreSQL, Queues
│   ├─ Middleware stack example
│   ├─ Database schema + migrations
│   └─ Error handling patterns
├── docs/ARCHITECTURE.md
│   ├─ Service layers (API → Business → Data)
│   ├─ Data flow (request → processing → response)
│   ├─ Queue system (job definitions, workers)
│   └─ Critical flows (user creation → email → notification)
└── docs/DATABASE.md
    ├─ Schema overview
    ├─ Migration process
    └─ Query patterns
```

**Tier 1 focus**: Express routing + queue system  
**Tier 2 focus**: Service layer architecture + data flow  
**Tier 3 focus**: Database schema + migrations (DATABASE.md)

---

### Example 3: CLI Tool (Python)

```
cli-tool/
├── .github/copilot-instructions.md
│   ├─ Big picture: Python 3.10+, Click CLI, SQLite
│   ├─ Command structure example
│   ├─ Configuration management
│   └─ Testing framework
├── docs/ARCHITECTURE.md
│   ├─ Command tree (root → subcommands → actions)
│   ├─ Data flow (config → commands → output)
│   ├─ Plugin system (if applicable)
│   └─ Critical flows (init → configure → execute → report)
└── docs/PLUGINS.md
    ├─ Plugin interface
    ├─ Examples
    └─ Testing plugins
```

**Tier 1 focus**: Click CLI structure + command lifecycle  
**Tier 2 focus**: Plugin system architecture  
**Tier 3 focus**: Plugin development (PLUGINS.md)

---

## Standard Template Files

### Template 1: `.github/copilot-instructions.md`

```markdown
# [PROJECT_NAME] — AI Agent Instructions

**Last Updated**: [DATE] | **Version**: [X.Y.Z]

## Purpose

AI agents use this to be immediately productive in [PROJECT_NAME].

## Quick Start

- Setup: `[COMMAND]`
- Dev: `[COMMAND]`
- Build: `[COMMAND]`
- Test: `[COMMAND]`
- Deploy: `[COMMAND]`

## Big Picture Architecture

**Tech stack**: [Framework/Language/Key Dependencies]

**Core concept**: [1–2 sentences explaining the system]

**Key components**:
- [Component 1]: [Purpose]
- [Component 2]: [Purpose]
- [Component 3]: [Purpose]

**Data flow**: [Describe critical flow: Input → Processing → Output]

## Essential Patterns & Conventions

1. **[Pattern 1]**: [Rule + example]
2. **[Pattern 2]**: [Rule + example]
3. **[Pattern 3]**: [Rule + example]

## Protected/Sensitive Files

- [File 1]: [Why protected]
- [File 2]: [Why protected]

## Code Examples

### [Pattern Name]

[Working code snippet]

## Verification Checklist

1. [Check 1]
2. [Check 2]
3. [Check 3]

## Key Files

- Architecture: [Path]
- Entry point: [Path]
- Configuration: [Path]
```

---

### Template 2: `docs/AGENTS.md`

```markdown
# [PROJECT_NAME] — Agent Authority & Task Specs

## Authority Chain

1. [Project Lead]
2. [Architect/Senior Dev]
3. [Implementation Agent]

## Task Spec Template

Every task MUST include:

```markdown
# Task: [NAME]

**Assigned to**: [AGENT]  
**Date**: [DATE]  
**Status**: [Not Started | In Progress | Complete]

## Goal

[What should be accomplished]

## Files to Modify (ALLOWLIST)

- [File 1]
- [File 2]

## Files NOT to Modify (DENYLIST)

- [File 1]
- [File 2]

## Constraints

- [Constraint 1]
- [Constraint 2]

## Verification Steps

1. [Check 1]
2. [Check 2]

## Commit Message

[Clear message describing changes]
```

## Planning Constraint — Reuse First

Before proposing NEW [Component/Module/Service]:

1. List existing [Components/Modules/Services] that might serve this role
2. State whether each can be: Reused AS-IS, Extended, or Unsuitable (with reason)
3. Only propose NEW if reuse would cause more complexity

---
```

---

### Template 3: `CLAUDE.md`

```markdown
# [PROJECT_NAME] — Project Overview

## Project Summary

[2–3 sentences explaining what this project is and why it exists]

## Development Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Run tests
```

## Architecture Highlights

[Key architectural decisions and why they were made]

## Critical Rules

1. [Rule 1]
2. [Rule 2]
3. [Rule 3]

## Key Concepts

### [Concept 1]

[Explanation with examples]

### [Concept 2]

[Explanation with examples]

## State Management

[Overview of how state is managed and persisted]

## Testing Strategy

[How tests are organized and run]

## Deployment Process

[Steps from code → production]

---
```

---

## Multi-Project Coordination

### Document Hierarchy (Across Projects)

```
ORGANIZATION_DOCS/
├── README.md                    [Company overview]
├── STANDARDS/
│   ├── DOC_ORGANIZATION_STANDARD.md    [THIS STANDARD]
│   ├── CODE_STYLE.md
│   ├── TESTING_STANDARDS.md
│   └── AGENT_WORKFLOWS.md
│
├── AGENT_PROFILES/
│   ├── claude-code.md
│   ├── gemini-pro.md
│   └── codex-cli.md
│
└── PROJECTS/
    ├── immanence-os/
    ├── backend-service/
    ├── cli-tool/
    └── ... (other projects)
```

### Cross-Project Links

Each `.github/copilot-instructions.md` references:

```markdown
## For Organization Standards

- Code style: [ORG_REPO]/standards/CODE_STYLE.md
- Testing: [ORG_REPO]/standards/TESTING_STANDARDS.md
- Agent workflows: [ORG_REPO]/standards/AGENT_WORKFLOWS.md
- Agent profiles: [ORG_REPO]/profiles/[AGENT_NAME].md
```

---

## Maintenance Schedule (Multi-Project)

| Task | Frequency | Owner |
|------|-----------|-------|
| Update per-project WORKLOG.md | Per work session | Current agent |
| Update per-project PROJECT_STATUS.md | Weekly | Project lead |
| Prune transient docs per project | Monthly | Project lead |
| Review organization standards | Quarterly | Org lead |
| Update cross-project links | Quarterly | Org lead |
| Archive old task logs | Quarterly | Project lead |

---

## Quick Start: Setup New Project

```bash
# Clone template structure
mkdir -p docs/archive/{TASKS,PHASES,SPECS}

# Create Tier 1 files
touch .github/copilot-instructions.md
touch CLAUDE.md
touch docs/AGENTS.md
touch README.md

# Create Tier 2 files
touch docs/ARCHITECTURE.md
touch docs/DEVELOPMENT.md
touch docs/PHILOSOPHY.md

# Create Tier 4 files
touch WORKLOG.md
touch PROJECT_STATUS.md
touch CHANGELOG.md

# Create gitignore for archive
echo "
# Archive files (historical, not active)
docs/archive/
" >> .gitignore

git add .
git commit -m "setup: initialize documentation structure per DOC_ORGANIZATION_STANDARD"
```

---

## Troubleshooting Common Issues

### Issue: "Too many docs, agents are confused"

**Solution**:
- Consolidate Tier 3 feature docs (merge related files)
- Archive Tier 4 old task logs (move to `docs/archive/`)
- Delete Tier 5 transient docs (prune monthly)

### Issue: "Docs are out of sync with code"

**Solution**:
- Add code review rule: "If code changes, docs must be updated"
- Link each doc to the files it documents (e.g., "See: `src/services/llmService.js`")
- Use issue labels: "docs-needed" for code changes without doc updates

### Issue: "Agents keep creating their own docs"

**Solution**:
- Enforce TASK template (docs/AGENTS.md) for all work
- Link all work to existing docs (no orphan docs)
- Review doc naming during code review

---

## Questions?

This standard is designed to be **flexible** and **scalable**:

- **Use as-is** for single projects
- **Customize** for project-specific needs
- **Extend** across multiple projects in an organization
- **Iterate** based on agent feedback and team needs

The goal is: **Agents productive in 15 minutes, project leads clear on status in 30 seconds.**
