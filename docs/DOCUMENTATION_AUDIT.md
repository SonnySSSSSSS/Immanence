# Documentation Inventory & Reorganization Guide

**Last Updated:** January 3, 2026

---

## CURRENT DOCS (What's There & What It Is)

### Core System Documentation

| File | Purpose | Audience | Status |
|------|---------|----------|--------|
| **ARCHITECTURE.md** | System design, state management, component structure | Developers | âœ… Current |
| **PROJECT_STATUS.md** | Feature completion status, recent changes, next steps | Team/Stakeholders | âœ… Current |
| **DEVELOPMENT.md** | Dev setup, dependencies, local environment | Developers | Check |
| **WORKFLOW.md** | Dual-AI development model, collaboration rules | Claude + Deprecated / Historical | âœ… NEW |
| **PHILOSOPHY.md** | Immanence OS core philosophy, design principles | Everyone | âœ… Current |

### System-Specific Documentation

| File | Purpose | Audience | Rename To | Status |
|------|---------|----------|-----------|--------|
| **AVATAR_SYSTEM.md** | Avatar architecture, progression, visual system | Developers | Keep | âœ… Current |
| **AVATAR_JEWEL_SPEC.md** | Jewel visualization specs for avatars | Designers/Devs | `AVATAR_SYSTEM_JEWELS.md` | ðŸ“‹ Rename |
| **AVATAR_RETROFIT.md** | Exploration/notes on avatar changes | Internal | `AVATAR_RETROFIT_NOTES.md` | ðŸ“‹ Rename |
| **CYCLE_SYSTEM.md** | 21/42 day consistency tracking system | Developers | Keep | âœ… Current |
| **attention-axis-logic.md** | Attention path inference algorithm | Developers | `ATTENTION_AXIS_LOGIC.md` | ðŸ“‹ Rename |
| **BASELINE_INSPECTION.md** | Attention baseline measurement process | Developers | `ATTENTION_BASELINE_INSPECTION.md` | ðŸ“‹ Rename |
| **BASELINE_SELECTION.md** | User baseline selection UI/UX | Developers | `ATTENTION_BASELINE_SELECTION.md` | ðŸ“‹ Rename |

### Integration & Advanced Features

| File | Purpose | Audience | Status |
|------|---------|----------|--------|
| **LLM_INTEGRATION.md** | Claude API calls, validation logic, prompts | Developers | âœ… Current |
| **INTEGRATION.md** | System integration points (overlaps with LLM?) | Internal | ðŸ“‹ Review/Merge |
| **4 Modes User Manual.md** | Mirror/Prism/Wave/Sword guided practices | Users/Practitioners | âœ… Current (rename?) |

### User Guides & Safety

| File | Purpose | Audience | Rename To | Status |
|------|---------|----------|-----------|--------|
| **HOW-TO-USE-SAFELY.md** | Safety considerations for practice | Users | `USER_SAFETY_GUIDE.md` | ðŸ“‹ Rename |
| **research on 4 modes.md** | Research notes on Four Modes practices | Internal | `RESEARCH_FOUR_MODES_NOTES.md` | ðŸ“‹ Rename |

---

## RECOMMENDED REORGANIZATION

### New Folder Structure

```
docs/
â”œâ”€â”€ CORE/
â”‚   â”œâ”€â”€ ARCHITECTURE.md          # System design
â”‚   â”œâ”€â”€ WORKFLOW.md              # Development workflow
â”‚   â”œâ”€â”€ PHILOSOPHY.md            # Core philosophy
â”‚   â”œâ”€â”€ PROJECT_STATUS.md        # Status & roadmap
â”‚   â””â”€â”€ DEVELOPMENT.md           # Dev setup
â”‚
â”œâ”€â”€ SYSTEMS/
â”‚   â”œâ”€â”€ AVATAR_SYSTEM.md         # Avatar progression
â”‚   â”œâ”€â”€ AVATAR_SYSTEM_JEWELS.md  # Avatar visual details (renamed)
â”‚   â”œâ”€â”€ CYCLE_SYSTEM.md          # Consistency tracking
â”‚   â”œâ”€â”€ ATTENTION_AXIS_LOGIC.md  # Attention path (renamed)
â”‚   â”œâ”€â”€ ATTENTION_BASELINE_INSPECTION.md
â”‚   â”œâ”€â”€ ATTENTION_BASELINE_SELECTION.md
â”‚   â””â”€â”€ FOUR_MODES_SYSTEM.md     # Mirror/Prism/Wave/Sword
â”‚
â”œâ”€â”€ INTEGRATION/
â”‚   â”œâ”€â”€ LLM_INTEGRATION.md       # Claude API integration
â”‚   â”œâ”€â”€ RITUAL_CURRICULUM.md     # Ritual onboarding system (NEW)
â”‚   â””â”€â”€ CIRCUIT_TRAINING.md      # Circuit mode (NEW doc)
â”‚
â”œâ”€â”€ GUIDES/
â”‚   â”œâ”€â”€ FOUR_MODES_USER_GUIDE.md # User manual (renamed)
â”‚   â”œâ”€â”€ USER_SAFETY_GUIDE.md     # Safety considerations (renamed)
â”‚   â””â”€â”€ GETTING_STARTED.md       # Quick start guide (NEW)
â”‚
â””â”€â”€ RESEARCH/
    â”œâ”€â”€ AVATAR_RETROFIT_NOTES.md # Avatar exploration (renamed)
    â””â”€â”€ RESEARCH_FOUR_MODES_NOTES.md # Four modes research (renamed)
```

---

## CHANGES MADE (January 3, 2026)

### New Files Created
- âœ… `docs/WORKFLOW.md` - Dual-AI development model & collaboration rules

### Files to Rename
- [ ] `4 Modes User Manual.md` â†’ `GUIDES/FOUR_MODES_USER_GUIDE.md`
- [ ] `AVATAR_JEWEL_SPEC.md` â†’ `SYSTEMS/AVATAR_SYSTEM_JEWELS.md`
- [ ] `AVATAR_RETROFIT.md` â†’ `RESEARCH/AVATAR_RETROFIT_NOTES.md`
- [ ] `attention-axis-logic.md` â†’ `SYSTEMS/ATTENTION_AXIS_LOGIC.md`
- [ ] `BASELINE_INSPECTION.md` â†’ `SYSTEMS/ATTENTION_BASELINE_INSPECTION.md`
- [ ] `BASELINE_SELECTION.md` â†’ `SYSTEMS/ATTENTION_BASELINE_SELECTION.md`
- [ ] `HOW-TO-USE-SAFELY.md` â†’ `GUIDES/USER_SAFETY_GUIDE.md`
- [ ] `research on 4 modes.md` â†’ `RESEARCH/RESEARCH_FOUR_MODES_NOTES.md`

### Files to Review/Merge
- [ ] `INTEGRATION.md` - Check if should merge with LLM_INTEGRATION.md

### New Docs to Create
- [ ] `GUIDES/GETTING_STARTED.md` - Quick start for new users
- [ ] `INTEGRATION/RITUAL_CURRICULUM.md` - Ritual system design (when built)
- [ ] `INTEGRATION/CIRCUIT_TRAINING.md` - Circuit training system design

---

## NEXT STEPS

1. **Immediate:** Confirm file reorganization plan with Sonny
2. **Short-term:** Execute renames & folder restructuring
3. **Ongoing:** Update internal links in docs as structure changes
4. **Maintenance:** Update docs as features are added

---

## NOTES

- All `.md` files should use **UPPERCASE_SNAKE_CASE** for clarity
- File names should answer: "What is this?" in 3-5 words
- Avoid abbreviations unless well-established (LLM, AI, etc.)
- Each file should have "Last Updated" date and purpose statement


