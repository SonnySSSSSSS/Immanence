# 📚 Documentation Navigation Map

**Quick visual guide to the documentation system**

---

## Where to Start

### 🤖 If you're an AI agent:

```
START HERE: .github/copilot-instructions.md
            ↓
          5 min?
            ↓
        YOU'RE PRODUCTIVE
    (Reference ARCHITECTURE.md as needed)
```

### 👤 If you're a project lead:

```
START HERE: docs/DOC_INVENTORY.md
            ↓
       Check status
            ↓
    Assign next task (using AGENTS.md)
         ↓           ↓
    Code changes  Doc updates
         ↓           ↓
    Update Deprecated / Historical + CHANGELOG.md
```

### 🏢 If you're an organization:

```
START HERE: docs/DOC_ORGANIZATION_STANDARD.md
            ↓
    Apply to all projects
            ↓
    Use docs/MULTI_PROJECT_GUIDE.md
     to set up each project
```

---

## Document Map

### Tier 1: Entry Points (Read these first)

```
.github/copilot-instructions.md    [Agents: Quick-start + examples]
CLAUDE.md                          [Everyone: Philosophy + rules]
docs/AGENTS.md                     [Everyone: Task specs + authority]
README.md                          [Public: Overview + features]
```

### Tier 2: Deep Reference

```
docs/ARCHITECTURE.md               [Component wiring + data flows]
docs/DEVELOPMENT.md                [Setup + troubleshooting]
docs/LLM_INTEGRATION.md            [Ollama + validation]
docs/PHILOSOPHY.md                 [Design principles]
docs/DOC_ORGANIZATION_STANDARD.md  [THIS standard (reusable)]
```

### Tier 3: Feature Specifics

```
docs/AVATAR_SYSTEM.md              [Avatar rendering]
docs/CYCLE_SYSTEM.md               [Consistency cycles]
docs/4 Modes User Manual.md        [User guide]
docs/HOW-TO-USE-SAFELY.md          [Safety guidelines]
docs/INTEGRATION.md                [Multi-AI workflow]
```

### Tier 4: Task Logs & Status

```
Deprecated / Historical                         [Recent work]
PROJECT_STATUS.md                  [Current phase]
CHANGELOG.md                       [Version history]
TASK-{DATE}-{ID}.md                [Specific task logs]
```

### Tier 5: Navigation & Organization

```
docs/DOC_INVENTORY.md              [Current status + cleanup roadmap]
docs/IMPLEMENTATION_SUMMARY.md     [What was created + how to use]
docs/MULTI_PROJECT_GUIDE.md        [Multi-project coordination]
DOCUMENTATION_COMPLETE.md          [This summary]
```

---

## Quick Lookup: "Where to find X?"

| I need to... | Read this file | Time |
|---|---|---|
| Start productivity | `.github/copilot-instructions.md` | 5 min |
| Understand architecture | `docs/ARCHITECTURE.md` | 15 min |
| Modify a store | `.github/copilot-instructions.md` (example) + `docs/ARCHITECTURE.md` | 10 min |
| Validate LLM prompts | `.github/copilot-instructions.md` (Four Modes example) + `docs/LLM_INTEGRATION.md` | 10 min |
| Check project status | `docs/DOC_INVENTORY.md` + `PROJECT_STATUS.md` | 5 min |
| Create new docs | `docs/DOC_ORGANIZATION_STANDARD.md` (template) | 10 min |
| Set up new project | `docs/MULTI_PROJECT_GUIDE.md` | 20 min |
| Find a specific feature | `docs/DOC_INVENTORY.md` (lookup table) | 2 min |
| Understand task format | `docs/AGENTS.md` | 5 min |

---

## What You Get

### ✅ For Agents

- **5-min onboarding**: Read copilot-instructions.md
- **Code examples**: Zustand stores, LLM prompts, component patterns
- **Clear conventions**: Single-line edits, version increment, protected files
- **Quick reference**: "Where to make changes" section with file paths

### ✅ For Project Leads

- **Current status**: DOC_INVENTORY.md shows what's done/needs cleanup
- **Cleanup roadmap**: Consolidation opportunities identified
- **Ownership map**: Who maintains which docs
- **Maintenance schedule**: What to update, when, who

### ✅ For Organizations

- **Standard template**: Reusable for all projects
- **Multi-project guide**: How to scale from 1 → 20 projects
- **Cross-linking**: How projects reference each other
- **Coordination patterns**: Multi-team workflows

---

## File Sizes (For Reference)

| File | Size | Type |
|------|------|------|
| `.github/copilot-instructions.md` | 221 lines | Reference (agent quick-start) |
| `docs/DOC_ORGANIZATION_STANDARD.md` | 333 lines | Standard (reusable template) |
| `docs/DOC_INVENTORY.md` | 185 lines | Inventory (status + roadmap) |
| `docs/IMPLEMENTATION_SUMMARY.md` | 229 lines | Guide (what was created) |
| `docs/MULTI_PROJECT_GUIDE.md` | 338 lines | Guide (multi-project setup) |
| `DOCUMENTATION_COMPLETE.md` | ~400 lines | Summary (this completion doc) |

**Total new documentation**: ~1,700 lines structured for agent productivity

---

## How Docs Link Together

```
Agent starts here:
.github/copilot-instructions.md
    ↓
    References ARCHITECTURE.md for deep dives
    ↓
    References specific Tier 3 docs (AVATAR_SYSTEM.md, etc.)
    ↓
    References AGENTS.md for task specs
    ↓
    References DOC_ORGANIZATION_STANDARD.md when creating docs
    ↓
    Updates Deprecated / Historical with progress
    ↓
    Project lead reviews PROJECT_STATUS.md
    ↓
    Completes task by committing + updating CHANGELOG.md
```

---

## Quick Commands (Copy/Paste)

### Setup archive folders
```bash
mkdir -p docs/archive/{TASKS,PHASES,SPECS}
```

### Archive old task logs (when done)
```bash
mv docs/TASK-*.md docs/archive/TASKS/ 2>/dev/null || true
git add docs/archive/
git commit -m "chore: archive old task logs per DOC_ORGANIZATION_STANDARD"
```

### Verify documentation structure
```bash
ls -la .github/copilot-instructions.md
ls -la docs/{AGENTS,ARCHITECTURE,DEVELOPMENT,DOC_ORGANIZATION_STANDARD,DOC_INVENTORY}.md
```

---

## Maintenance Calendar

| Frequency | Task | Owner |
|-----------|------|-------|
| Per work session | Update Deprecated / Historical | Current agent |
| Weekly | Update PROJECT_STATUS.md | Project lead |
| Per change | Update CHANGELOG.md | Current agent |
| Monthly | Prune transient docs | Project lead |
| Quarterly | Review Tier 1–2 docs | Project lead |
| Quarterly | Archive old task logs | Project lead |

---

## Common Questions

### Q: "Where do I start if I'm new?"
A: Read `.github/copilot-instructions.md` (5 min) → you're productive

### Q: "How do I understand the full architecture?"
A: Read `docs/ARCHITECTURE.md` (15 min) for complete wiring

### Q: "What needs to be cleaned up?"
A: Check `docs/DOC_INVENTORY.md` for "Consolidation Opportunities" section

### Q: "How do I create new docs?"
A: Use template in `docs/DOC_ORGANIZATION_STANDARD.md`

### Q: "How do I scale this to multiple projects?"
A: Follow `docs/MULTI_PROJECT_GUIDE.md` for setup instructions

### Q: "Can I customize this system?"
A: Yes! Edit Tier 1 docs with project-specific rules, modify the standard as needed

---

## Success Metrics

You'll know this system is working when:

✅ New agents are productive within 15 minutes  
✅ Project leads understand status within 30 seconds  
✅ Docs stay current (clear ownership)  
✅ No orphan docs (everything fits in 5 tiers)  
✅ Transient docs disappear (monthly cleanup)  
✅ Agents find what they need (good naming + links)  
✅ Standards are reused across projects (consistency)

---

## One More Thing

This documentation system was designed with **you** in mind:

- It reflects how **you** actually work (not generic best practices)
- It scales with **your** team (1 agent → 20 agents)
- It's **customizable** to your workflow
- It treats agents as **first-class citizens** (not afterthoughts)

**The goal**: Get agents productive fast. Ship better code. Scale sustainably.

---

## Need Help?

### For questions about:
- **This system**: See `docs/DOC_ORGANIZATION_STANDARD.md`
- **Your project**: See `.github/copilot-instructions.md` + `docs/ARCHITECTURE.md`
- **Implementation**: See `docs/IMPLEMENTATION_SUMMARY.md`
- **Multi-project setup**: See `docs/MULTI_PROJECT_GUIDE.md`

---

**Last Updated**: 2026-01-10  
**Status**: ✅ Ready for production  
**Questions?** Reference the appropriate doc above.

