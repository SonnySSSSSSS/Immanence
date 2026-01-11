# Immanence OS Development Workflow

**Last Updated:** January 5, 2026
**Dual-AI Development Model:** Claude (Backend) + Gemini/Antigravity (Frontend)

---

## ⚠️ CRITICAL: Working Directory

**ALL AI assistants (Claude Code, Gemini/Antigravity, Codex CLI, and any other LLMs) MUST work directly in:**

```
D:\Unity Apps\immanence-os
```

**DO NOT use git worktrees.** All development happens in the main repository directory.

**Why:**
- This is the main repository with all backup systems configured
- Git worktrees have been deprecated to maintain compatibility with existing backup workflows
- The `work-manager.bat` backup system requires work in the main directory

---

## DEVELOPMENT PARTITION

### Claude's Responsibility
- **State Management:** Zustand stores, state logic, persistence
- **Data Structures:** Practice definitions, curriculum paths, ritual data
- **Business Logic:** Cycle tracking, consistency metrics, progression calculations
- **Component Logic:** Event handlers, conditionals, data transformations
- **Backend Integration:** LLM calls, API integration, file operations
- **File:** All `.js` files in `src/state/`, `src/services/`, `src/data/`
- **File:** Component `.jsx` logic (handlers, state hooks, data processing)

### Gemini/Antigravity's Responsibility
- **UI/UX Design:** Component layout, visual hierarchy, user interactions
- **Styling:** Tailwind classes, CSS animations, visual effects
- **Typography:** Font selection, sizing, spacing, readability
- **Visual Polish:** Colors (from theme), gradients, transitions, effects
- **Accessibility:** ARIA labels, keyboard navigation, focus states
- **File:** Component `.jsx` markup (className, structure, JSX rendering)
- **File:** All `.css` files in `src/styles/`

### Shared/Coordination
- **App.jsx routing:** Claude structures routing logic, Gemini styles layout
- **Navigation:** Claude manages navigation state, Gemini designs UI
- **Component Files:** Claude creates structure with placeholder classNames, Gemini fills in Tailwind
- **Data Display:** Claude prepares data, Gemini presents it visually

---

## PLANNING CONSTRAINT — REUSE FIRST

**Applies to:** All planning agents (Claude Code, Codex CLI, Gemini/Antigravity when creating specs, any LLM writing task specs)

Before proposing any NEW component, hook, store, or utility, you MUST:

1. **Explicitly list existing components or systems** that may already serve this role
2. **State whether each can be:**
   - Reused AS-IS
   - Reused with minor extension
   - Unsuitable (with specific reason)
3. **Only propose a new component** if reuse would cause more complexity than it removes

**If reuse is possible, the plan MUST prefer reuse.**

See `docs/AGENTS.md` for detailed examples of good vs. bad component analysis.

---

## HANDOFF PROCESS

1. **Claude creates component skeleton:**
   ```jsx
   export function ExampleComponent() {
     const { data } = useStore();
     const handleClick = () => { /* logic */ };

     return (
       <div className="placeholder">
         <h1>{data.title}</h1>
         {/* Structure here */}
       </div>
     );
   }
   ```

2. **Gemini receives component, enhances UI:**
   ```jsx
   <div className="fixed inset-0 bg-gradient-to-b from-slate-900 to-slate-950">
     <h1 className="text-3xl font-cinzel text-gold-400">{data.title}</h1>
     {/* Styled structure */}
   </div>
   ```

3. **Claude tests logic in Antigravity dev environment**

4. **Gemini ensures visual consistency with design system**

---

## NO-TOUCH ZONES

### Claude MUST NOT:
- Modify Tailwind classNames (Gemini owns styling)
- Change HTML structure for visual reasons (Gemini decides layout)
- Add CSS animations (Gemini handles motion)
- Adjust colors/theme values (follows stageColors.js, Gemini applies)

### Gemini MUST NOT:
- Modify state logic or hooks
- Change business logic conditionals
- Alter data transformations
- Modify store structures or persistence

---

## CURRENT PROJECT STATE

### Completed Systems
âœ… **Avatar System** - 5-stage progression with visual effects, rune rings, particles  
âœ… **Practice System** - Breathing, Vipassana (Cognitive/Somatic), Cymatics, Sound Bath, Visualization  
âœ… **Four Modes System** - Mirror, Prism, Wave, Sword (awareness tracking & response)  
âœ… **Circuit Training** - Multi-exercise sequences with tracking  
âœ… **Practice Journal** - Post-session reflection with assessments  
âœ… **Consistency Tracking** - Cycle management (21/42 day modes)  
âœ… **Wisdom Section** - Treatise library, recommendations, video integration  
âœ… **State Management** - 15+ Zustand stores with localStorage persistence  

### In Development
ðŸ”¨ **Ritual Curriculum** - 14-day structured ritual onboarding & practice (Current focus)

### Planned
ðŸ“‹ **Mobile App** - React Native version  
ðŸ“‹ **Server Sync** - Cloud backup & sync  
ðŸ“‹ **AI Recommendations** - Practice suggestions based on journal data  

---

## RITUAL CURRICULUM (CURRENT SPRINT)

### Scope
Build a 2-week guided ritual practice with:
- First-time onboarding (~10 min)
- Daily practice scheduling (user picks 2 time slots)
- 14-day curriculum with tracking
- Daily progress stats
- 2-week completion report

### Phases

#### Phase 1: Foundation (Days 1-2)
- [x] Curriculum data structure (14-day paths)
- [x] Zustand curriculum store
- [x] Onboarding flow component skeleton
- [ ] **TODO (Claude):** Time selection logic & validation
- [ ] **TODO (Gemini):** Onboarding UI polish & animations

#### Phase 2: Daily Practice (Days 3-9)
- [x] Curriculum hub display component
- [x] Daily practice card logic
- [ ] **TODO (Claude):** Practice session integration with curriculum context
- [ ] **TODO (Claude):** Auto-journal opening after session
- [ ] **TODO (Gemini):** Hub card visual updates for daily stats

#### Phase 3: Tracking & Reporting (Days 10-14)
- [ ] **TODO (Claude):** Progress dashboard data aggregation
- [ ] **TODO (Claude):** Completion report generation
- [ ] **TODO (Gemini):** Dashboard visualization (charts, progress bars)
- [ ] **TODO (Gemini):** Report layout & presentation

#### Phase 4: Integration & Polish (Days 15+)
- [ ] **TODO (Claude):** Navigation routing for curriculum
- [ ] **TODO (Claude):** Bug fixes & edge cases
- [ ] **TODO (Gemini):** Visual consistency & refinement
- [ ] **TODO (Gemini):** Mobile responsiveness

---

## FILE ORGANIZATION

### Current Structure
```
docs/
â”œâ”€â”€ ARCHITECTURE.md          # System design overview
â”œâ”€â”€ PROJECT_STATUS.md        # Feature completion status
â”œâ”€â”€ DEVELOPMENT.md           # Dev setup & guidelines
â”œâ”€â”€ WORKFLOW.md              # THIS FILE - collaboration model
â”œâ”€â”€ [Other specialty docs]   # Specific system docs
```

### Docs That Need Renaming/Reorganization
- `4 Modes User Manual.md` â†’ `FOUR_MODES_GUIDE.md` (user-facing)
- `AVATAR_JEWEL_SPEC.md` â†’ `AVATAR_SYSTEM_JEWELS.md` (clarify it's part of avatar)
- `AVATAR_RETROFIT.md` â†’ `AVATAR_RETROFIT_NOTES.md` (clarify it's notes/exploration)
- `BASELINE_INSPECTION.md` â†’ `ATTENTION_BASELINE_INSPECTION.md` (clarify purpose)
- `BASELINE_SELECTION.md` â†’ `ATTENTION_BASELINE_SELECTION.md` (clarify purpose)
- `CYCLE_SYSTEM.md` â†’ Keep (clear)
- `INTEGRATION.md` â†’ `LLM_INTEGRATION_GUIDE.md` (merge with or reference LLM_INTEGRATION.md)
- `HOW-TO-USE-SAFELY.md` â†’ `USER_SAFETY_GUIDE.md` (clarify audience)
- `PHILOSOPHY.md` â†’ Keep (clear)
- `LLM_INTEGRATION.md` â†’ Keep (clear)
- `attention-axis-logic.md` â†’ `ATTENTION_AXIS_LOGIC.md` (capitalize)
- `research on 4 modes.md` â†’ `RESEARCH_FOUR_MODES_NOTES.md` (clarify it's research)

---

## GIT WORKFLOW

- **Main branch:** Production-ready code
- **Feature branches:** `ritual-curriculum`, `avatar-polish`, etc.
- **Commits:** Include file changes + reason
- **Coordination:** Review partner's changes before major integrations

---

## COMMUNICATION PROTOCOL

### Daily Standups
- Status of current phase
- Blockers or dependencies
- Hand-offs between Claude & Gemini

### When Requesting Changes
**Claude to Gemini:**
```
Component: CurriculumOnboarding
Files: src/components/CurriculumOnboarding.jsx
Changes Made: Added time selection logic, state management
Needed: Style the time slot selector, add animations to step transitions
```

**Gemini to Claude:**
```
Component: DailyPracticeCard
Issue: Card needs to show "next practice in X hours" countdown
Needed: Add time calculation logic to store, expose remaining minutes
```

---

## TESTING PROTOCOL

1. **Claude** tests logic locally (console, state inspection)
2. **Gemini** tests UI in Antigravity (visual feedback)
3. **Sonny** (you) perform integration testing in dev environment
4. **Final QA:** Full workflow test (onboarding â†’ practice â†’ report)

---

## NOTES FOR BOTH AIs

- **Immanence OS Philosophy:** Participation as honest reflection. Measure behavior, don't prescribe.
- **Design Principle:** "Ancient modern synthesis" - temple-like spiritual tech, not sterile or superficial
- **User Base:** Intellectuals, seekers, wanderers wanting rigorous spiritual work
- **Time Scale:** Real change takes 3 months internal, 6 months visible, 1 year transformation
- **Accuracy over Gamification:** Track consistency & honesty, not mood/motivation

---

## CHANGE LOG

### January 3, 2026
- Created WORKFLOW.md to formalize dual-AI development model
- Established clear partition: Claude (backend/logic), Gemini (frontend/UI)
- Documented handoff process and no-touch zones
- Reorganized docs folder structure for clarity

