# Immanence OS: State Benchmark Report
**As of 2026-03-20**

---

## Executive Summary

Immanence OS is **production-ready at the framework and messaging layers**, with mature core architecture, stable state management, and evidence-grounded positioning. The app successfully embodies a state-training philosophy (not a meditation timer) and implements capacity-based curriculum gating with dual user modes (Student/Explorer). 

**Current state:** Core systems operational. Messaging aligned with evidence. Practices partially defined; curriculum templates ready but specific content incomplete. Ready for content expansion and user testing.

---

## 1. CODEBASE HEALTH & METRICS

### Build & Lint Status
- ✅ **Linting: PASS** (0 errors, 0 warnings)
- ✅ **Build: Success** (as of v3.27.285)
- 📊 **Code volume:**
  - **308 React components** (src/components/)
  - **45 Zustand stores** (src/state/)
  - **~500+ JS/JSX files** (src/ including data, hooks, utils, lib)
  - **32 data files** (src/data/ for practices, curriculum, tracking)

### Architecture Quality
- ✅ **Entry clean**: [src/main.jsx](src/main.jsx) is 45 lines, path-based routing only
- ✅ **Shell well-factored**: [src/App.jsx](src/App.jsx) (~600 lines) coordinates auth, section navigation, overlays, and dev gates — all conceptually distinct
- ✅ **State boundary defined**: [src/state/offlineFirstUserStateKeys.js](src/state/offlineFirstUserStateKeys.js) explicitly lists 10 core persisted keys (progress, sessions, curriculum, path, mode, settings, etc.)
- ✅ **Persistence contract honored**: Zustand stores use explicit `persist` middleware with unique storage keys
- ✅ **Auth gate**: Supabase auth active ([src/components/auth/AuthGate.jsx](src/components/auth/AuthGate.jsx)), login required, sign-in/sign-up/sign-out flows working

### Recent Commit Activity (Last 20)
- **d487af9** (HEAD): fix(date) — UTC date handling for streak and navigation date checks
- **752bef9**: fix(minor) — FeedbackModal safety, useWakeLock re-acquire, audioGuidance cleanup
- **76cbe37**: chore(cleanup) — removed stale logs/tmp/phase-docs; extended .gitignore
- **038a565**: fix(video) — YouTube script re-insertion guard; chain onYouTubeIframeAPIReady
- **6744e6b**: chore(agents) — allow unambiguous spec auto-fixes
- **47ea350**: chore(lint) — resolved 65 react-hooks/exhaustive-deps and no-unused-vars warnings
- **0482804**: feat(practice+application) — added audit fixes and sigil habit tracker
- **a05d5b9**: fix(ui) — practice menus audit fixes and home hub card centering
- **dfb7505** (on origin/main): docs(evidence) — added performance reliability framing and claim boundaries
- **ac7bc89**: docs(positioning) — added state-training doctrine and claims playbook

**Trajectory:** Bug fixes, lint cleanup, UI polish, and evidence-based messaging refinement. No architectural churn. Steady progress toward user-facing hardening.

---

## 2. SYSTEM ARCHITECTURE

### Technology Stack  
- **UI Framework**: React 18 with Vite (rolldown-vite@7.2.5)
- **State**: Zustand 5.0.8 with persist middleware
- **3D/Graphics**: React Three Fiber 8.17.0, Three.js 0.181.2, postprocessing, meshline
- **Styling**: Tailwind CSS 3.4 with PostCSS
- **Auth & Sync**: Supabase auth (user sessions) + offline-first localStorage sync
- **UI UX**: Framer Motion 12.23.24, Driver.js 1.4.0 (for tutorials), react-swipeable, react-collapse
- **Audio**: web-audio-beat-detector 8.2.33, local Ollama proxy (via Vite config)
- **Testing**: Playwright (smoke tests, including Supabase auth verification)

### Boot & Navigation Model
- **Single-entry**: all routes resolve to `App.jsx` 
- **Internal sections**: `null` (hub), `practice`, `wisdom`, `application`, `navigation`
- **No React Router**: section state owned by `navigationStore` and `uiStore`; faster handoff between sections
- **DevPanel & DevTools**: two separate gates (devpanelGate + uiDevtoolsGate) to prevent accidental exposure

### State Organization (45 Stores)
**Core User State** (persisted, per-user):
- `progressStore` — practice session history, metrics
- `navigationStore` — active paths, adherence, curriculum state
- `pathStore` — path completion history, emergence
- `curriculumStore` — program selection, day/leg state
- `breathBenchmarkStore` — baseline breath metrics
- `practiceStore` — practice session config, mode preferences
- `settingsStore` — user preferences (theme, audio, etc.)

**Session & Transient**:
- `uiStore` — UI overlays, modals, section state
- `devPanelStore` — dev tools UI state
- `tutorialStore` — tutorial progress and presentation state
- `avatarV3Store`, `sigilStore`, `mandalaStore` — visual identity
- `videoStore` — video playback, queue, recommendations
- `circuitJournalStore` — circuit training logs
- `tempoSyncStore` — audio tempo synchronization

**Inference & Computed** (no persistence):
- `navigationCurriculumInvariant` — computed path validity against curriculum
- `modeTrainingStore` — tracks training mode benefits
- `attentionStore` — attention metrics (draft)

### Auth & Access Control
- Supabase session → `useAuthUser` hook
- User ID bound to all core stores (`ownerUserId` field)
- RLS policies on `user_documents` table (owner delete, anon read for shared content)
- Offline-first: local changes sync on reconnect
- Smoke tests verify real signInWithPassword, session restore, and cross-user isolation

---

## 3. PRACTICE & CURRICULUM ARCHITECTURE

### Practice Family Model
Four attentional families (not modality or theme):
- **SETTLE**: single-anchor, stabilization (breath, visualization, concentration)
- **SCAN**: distributed/sequential attention (body scan, vipassana, sakshi)
- **RELATE**: attunement & emotional engagement (bhakti, devotional)
- **INQUIRE**: conceptual & insight (paradox, wisdom inquiry)

**Resolution order** (highest → lowest priority):
1. `sensoryType` (e.g., "bodyScan" → SCAN)
2. `ritualCategory` (e.g., "grounding" → SETTLE)
3. `domain` (e.g., "breathwork" → SETTLE)
4. default: SETTLE

**Advantage**: practice metadata maps deterministically to family, enabling curriculum matching and progression without heuristics.

### Curriculum Structure
**Three programs defined** in `src/data/programRegistry.js`:
1. **pilot-test-program** (14 days) — minimal: morning breath + evening circuit (breath/visualization/feeling)
2. **ritual-foundation-14** — foundation ritual with day-2 thought-detachment onboarding
3. **ritual-initiation-14-v2** — initiation pathway

**Program shape** (day → leg model):
- Each day has:
  - dayNumber, title, subtitle, description, intention
  - legs[] array where each leg is:
    - legNumber, label, practiceType, categoryId
    - matchPolicy (ANY_IN_CATEGORY | EXACT_PRACTICE_ID)
    - practiceConfig (breath pattern, duration, etc.)
    - focusArea (breath, awareness, integration, etc.)
    - guidanceAudio (path to audio guide)

**Leg overrides**: programs can apply day-specific overrides to legs (e.g., inject thought-detachment onboarding on day 2)

### Navigation Paths (Four Core)
Paths are attentional interfaces, not training sequences:

| Path ID | Name | Symbol | Interface | Attentional Domain |
|---------|------|--------|-----------|-------------------|
| Yantra | Ritual | △ | symbolic | symbol & meaning-driven |
| Kaya | Somatic | ◍ | somatic | somatic & perceptual |
| Chitra | Imaginal | ✶ | visual | visual & image-driven |
| Nada | Sonic | ≋ | sonic | sonic & rhythmic |

Stages progress: **seedling** → **ember** → **flame** → **beacon** → **stellar**

### Curriculum Gating (Student Mode)
- Breath benchmark required before accessing secondary practices
- Practices unlock based on path stage (not arbitrary gates)
- 14-day data window for focused onboarding (Explorer uses 90-day window)
- Active path is required before hub nav; hub becomes default once path exists

---

## 4. MESSAGING & POSITIONING

### Doctrine (Established)
[docs/STATE_TRAINING_DOCTRINE.md](docs/STATE_TRAINING_DOCTRINE.md)

**Core thesis:**
- Most people live in conditioned trigger-response loops.
- Training creates a workable gap between trigger and action.
- That gap enables values-aligned choice under pressure.
- Target: equanimity and agency, not temporary calm.

**Training sequence:**
```
Regulation (breath/arousal) → 
Attention (sustained focus) → 
Awareness (observe sensation, thought) → 
Reflection (choose response) → 
Integration (apply in real conditions)
```

### Positioning & Claims Policy (Established)
[docs/POSITIONING_AND_CLAIMS_PLAYBOOK.md](docs/POSITIONING_AND_CLAIMS_PLAYBOOK.md)

**Primary framing:**
- State training for agency under pressure
- NOT: relaxation app, abstract spiritual content, medical treatment

**One-liner:**
- "Immanence trains breath, attention, awareness, and reflection so users can interrupt reactive patterns and choose skillful action."

**Performance Reliability Model** (NEW):
- NOT a claim of "getting smarter"
- Frame as "accessing existing capacity more consistently"
- Emphasize reduced cognitive noise, reduced drift, faster return to task
- Analogy: good sleep vs. poor sleep before a difficult task

**Allowed claims:**
✅ Can improve self-regulation capacity with consistent practice  
✅ Can support attention stability and emotional composure  
✅ Trains skills associated with reduced reactivity and response flexibility  
✅ Intended as skill training, not clinical treatment  

**Restricted claims:**
❌ Cure, treat, or prevent medical/psychiatric disorders  
❌ Guaranteed outcomes  
❌ Permanent nervous-system change without direct evidence  
❌ Substitute for licensed care  
❌ "Rewires your brain" as product copy  
❌ App-level equivalence to therapy, medication, sleep  

**Required qualifiers:**
- Use: "can," "may," "associated with," "designed to support"
- Note individual variability and consistency dependence
- Distinguish skill training from clinical outcomes

### Evidence Base (Established)
[docs/EVIDENCE_BASE_SKILL_TRAINING.md](docs/EVIDENCE_BASE_SKILL_TRAINING.md)

**Best-supported framing:** meditation as trainable mental fitness (attention, awareness, emotional regulation)

**High-confidence claims** (safe for public):
1. Focused attention practice → improved concentration, reduced mind wandering
2. Open awareness practice → better meta-awareness, decentering
3. Mindfulness-style training → reduced stress/anxiety in healthy populations
4. Attention & emotional regulation are trainable skills
5. Different meditation families train different capacities

**Medium-confidence claims** (careful wording: "associated with," "may," "research suggests"):
1. Meditation is associated with brain changes in attention/regulation regions
2. Some benefits may persist outside practice sessions
3. Intensive training can preserve attentional performance under stress

**Claims to avoid:**
1. "Treats or cures depression, anxiety, PTSD," etc.
2. "Rewires your brain" (guaranteed outcome)
3. "Can replace therapy or medication"
4. "X minutes of meditation = Y hours of sleep"
5. "Boosts immunity" (broad guaranteed)
6. "Grows gray matter" (direct app-level)
7. Universal claims, guaranteed outcomes

**Key caveats:**
1. Effect sizes often smaller vs. active controls than vs. inactivity controls
2. Publication bias and selective reporting remain concerns
3. Long-term dose-response and maintenance under-studied
4. Open monitoring has less direct evidence than focused attention
5. Structural neuroplasticity from short interventions is contested

---

## 5. UI/UX & VISUAL SYSTEMS

### Component Library
- **308 components** organized by domain:
  - practice/ — practice session UIs, config, visualizations
  - navigation/ — path selection, curriculum onboarding, stage progression
  - avatar/ & avatarV3/ — identity rendering
  - wisdom/ — content cards, teachers, text rendering
  - application/ — ritual tracking, sigil system, habit assignment
  - audio/ — sound config, binaural/isochronic trainers
  - tracking/ — session logs, trends, historical review
  - dev/ & devpanel/ — dev tools and debugging overlays
  - ui/ — shared form components, modals, buttons

### Arwes-Style Shell Design
- Chamfered corner brackets, scan-line animations, luminous text effects
- Applied consistently to:
  - practice housing (practiceHousing.jsx)
  - wisdom cards (WisdomCardHousing.jsx)
  - navigation program grid (PathSelectionGrid.jsx)
  - application tracking cards

### Interactive Elements (Recent Audit)
- Navigation carousel: swipeable, dot selectors, per-stage program lane view
- Touch targets: minimum 44px height on buttons (D2, D3 fixes applied)
- Color rail distinctness: teal resonance, clear icon states, aria-expanded guidance
- Modal pre-selection: curriculum onboarding defaults to first program
- Scale hierarchy: 1.05 selected, 1.10 hover, 1.06 active (B1 audit fix)

### Accessibility
- aria-expanded on toggled sections (A3)
- Dialog role on modals
- Text shadows for legibility (navigation section legibility audit)
- title attributes on semantic headers (D3)

---

## 6. WHAT'S PRODUCTION READY

✅ **Framework & Architecture**
- Core shell, routing, state management stable
- Auth gate functional (Supabase sign-in/sign-out/session restore)
- Component library comprehensive and organized
- Build process clean (linting passes, no errors)

✅ **Messaging & Positioning**
- Doctrine established and published
- Claims policy evidence-grounded
- Positioning playbook documented
- Performance reliability framing integrated into all messaging layers

✅ **User Mode System**
- Student mode (gated, curriculum-first, 14-day window) functional
- Explorer mode (open, volume-first, 90-day window) functional
- Mode chooser and persistence working
- Path-based progression with stage lanes and unlocking logic

✅ **Curriculum Framework**
- Program registry and day/leg model operational
- Parametric leg overrides for dynamic curriculum customization
- Breath benchmark gate implemented
- Active path state tracking and navigation constraints working

✅ **Practice Infrastructure**
- Practice family system (SETTLE/SCAN/RELATE/INQUIRE) deterministic
- Sensory type → family mapping pure and documented
- Audio guidance paths in place (URI templates ready)
- Practice config (breath patterns, duration, modes) parametric

✅ **Tracking & Persistence**
- Session recording (normalized, de-duped)
- Streak and adherence tracking
- Offline-first sync with Supabase
- Local data export/import

✅ **Dev Tooling**
- DevPanel with LLM test suite, state inspection, performance metrics
- Debug flags and feature gates
- Tutorial/onboarding builder and preview
- Electric border overlays for component auditing

---

## 7. WHAT'S INCOMPLETE / PARTIAL

⏳ **Practice Content Library**
- **Status:** templates ready, specific sessions not finalized
- **What exists:** breathwork presets (Box, 4-7-8, Resonance, Pranayama), body scan prompts, vipassana themes, sakshi prompts
- **What's needed:** finalized practice content for each family; duration variants; specific guidance audio; prompt sequences
- **Expected scope:** ~40-60 practices across 4 families + 4 paths = 16-24 combinations minimum
- **Effort:** content creation & recording (weeks)

⏳ **Curriculum Content**
- **Status:** 3 programs defined (pilot, ritual-foundation, ritual-initiation); day/leg structure working; specific practice assignments TBD
- **What exists:** program shell (14-day programs with day/leg model); onboarding flow
- **What's needed:** finalize day-by-day practice assignments; create specific guidance audio; test progression pacing; refine difficulty curve
- **Expected scope:** ~40 practice sessions across 3 programs (14 days × 3 programs, overlapping)
- **Effort:** instructional design & recording (2-3 weeks)

⏳ **Video Content**
- **Status:** framework in place (videoStore, VideoLibrary component, tutorial video integration); video metadata in place; videos themselves not recorded
- **What exists:** video data schema; classroom-like video player; tutorials wired to Driver.js; video metadata per practice/program
- **What's needed:** shoot & edit video content; upload to hosting; verify playback in app
- **Expected scope:** ~5-10 intro videos + 1-2 per practice type = 20-30 videos
- **Effort:** production & post-production (4-6 weeks)

⏳ **Circuit Training Details**
- **Status:** infrastructure in place (circuitManager, circuitJournalStore); example circuit defined (evening-test-circuit: breath+visualization+feeling)
- **What exists:** circuit session record/playback, journal form
- **What's needed:** finalize circuit library; define exercise sequences; test timing and transitions
- **Expected scope:** ~8-12 circuits of varying duration (5-30 min)
- **Effort:** curriculum design & testing (1-2 weeks)

⏳ **Ritual & Application Tracking**  
- **Status:** partial — sigil system (3-stroke decoder) functional; habit assignment UI in place; ritual library framework present
- **What exists:** sigil display, legend popup, awareness-win wiring; habit tracker UI; post-session journal
- **What's needed:** finalize habit types; refine ritual definitions; test ritual → habit → tracking flow
- **Expected scope:** ~20-30 trackable rituals; 5-8 habit categories
- **Effort:** design & testing (1 week)

⏳ **Public Supabase Hardening** (Beta access currently gated)
- **Status:** RLS policies in place; smoke tests verify auth and isolation
- **What's needed (before public launch):**
  - Supabase Dashboard: redirect allowlist configuration
  - Rate limiting & CAPTCHA on auth endpoints
  - Email confirmation posture (send-on-signup vs. on-demand)
  - Admin audit logging
- **Effort:** ~1 day ops work

⏳ **User Testing & Iteration**
- **Status:** internal team testing only
- **What's needed:** beta user cohort (10-20); feedback collection; UI/flow refinement before public launch
- **Effort:** 3-4 weeks beta cycle

---

## 8. EXPECTED GROWTH TRAJECTORY (Based on Evidence)

### Near Term (1-2 Months): Content Completion
**Primary goal:** close practice and curriculum content gaps

1. **Practice Library (2-3 weeks)**
   - Finalize 40-50 practices across SETTLE/SCAN/RELATE/INQUIRE families
   - Record guidance audio for each (5-20 min per practice)
   - Test practice → session → tracking flow end-to-end
   
2. **Curriculum Release (2-3 weeks)**
   - Finalize day/leg assignments for 3 core programs
   - Record program-specific guidance audio
   - Test 14-day onboarding cohort for pacing and difficulty curve
   
3. **Video Content (4-6 weeks, parallel)**
   - Intro videos (what is Immanence, why practice, how mode selection works)
   - Practice type overviews (breath basics, body scan, vipassana, etc.)
   - Tutorial videos integrated into DevPanel preview
   
4. **Beta Launch Prep (1 week)**
   - Supabase hardening (email, rate limits, logging)
   - Smoke test suite expanded to cover all auth paths
   - Internal team 14-day pilot

### Medium Term (2-4 Months): User Testing & Refinement
1. **Beta Cohort** (10-20 users, 2-3 weeks)
   - Early access with feedback loops
   - Identify UX friction points
   - Gather evidence on practice effectiveness (consistency, compliance)

2. **Iteration Cycle** (1-2 weeks per round, 2-3 rounds)
   - UI/UX adjustments based on user behavior
   - Curriculum pacing refinement
   - Guided prompts and cues optimization

3. **Evidence Collection**
   - Pre/post consistency metrics (attention, reactivity, focus)
   - Qualitative user feedback (what worked, what felt confusing)
   - Adherence patterns (which practices sustained engagement)

### Medium-Long Term (4-6 Months): Public Launch
1. **Production Hardening**
   - Performance optimization (bundle size, time to interactive)
   - Mobile app packaging (PWA or native iOS/Android)
   - CDN optimization for audio and video assets

2. **Public Positioning Campaign**
   - Landing page with positioning frameworkand evidence summary
   - Blog/content: "how to build consistency," "what is skill training," "how meditation fits your life"
   - SEO optimization around "attention training," "meditation practice," "performance under pressure"

3. **Metrics & Analytics** (privacy-respecting)
   - Session completion rates per practice type
   - Adherence to programs (14-day completion rate)
   - Path progression speed and path popularity

### Long Term (6+ Months): Feature Expansion (Speculative)
Evidence supports these future directions:

1. **Teacher/Guide System** (social optional)
   - User can assign a "teacher" role (accountability partner)
   - Teacher sees adherence (not practice content or personal data)
   - Optional community messaging (on user opt-in)
   - Evidence: social accountability increases meditation consistency

2. **Intensity Progression** (difficulty scaling)
   - Practices auto-scale difficulty based on completion rate
   - Faster progression for high-consistency users
   - Extended challenge modes (longer sessions, harder family transitions)
   - Evidence: targeted difficulty sustains engagement in training contexts

3. **Ritual Library Expansion** (community practices)
   - User-created rituals (templates with guardrails)
   - Peer-reviewed or teacher-curated ritual sharing
   - Citation of source traditions (yoga, Buddhist, shamanic)
   - Evidence: personalized rituals increase sense of agency and spiritual engagement

4. **Outcome Measurement** (optional, anonymous)
   - Pre/mid/post questionnaires (attention, reactivity, choice-making in stress)
   - Integration with wearables (HRV, sleep) for correlational analysis
   - Anonymized aggregate reporting (performance reliability gains across cohort)
   - Evidence: transparent progress tracking sustains practice motivation

5. **Adaptive Curriculum** (ML-optional)
   - Predict which practice family best matches user's learning style
   - Suggest alternative practices when adherence drops
   - Personalized difficulty pacing (speed up or slow down based on benchmark growth)
   - Evidence: adaptive curricula improve long-term adherence

---

## 9. RISK ASSESSMENT & MITIGATION

### Risks (Likelihood × Impact)

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| **Audio guidance not recorded in time** | Medium | High | Start recording immediately; consider AI-narrated placeholders during beta |
| **Users expect "relaxation," app trains "capacity"** | High | Medium | Clear messaging in onboarding; "not a relax app" banner in mode chooser |
| **Curriculum pacing too fast/slow for average user** | Medium | High | Beta feedback; A/B test 2-3 pacing variants; track day-N dropout rates |
| **Supabase sync fails silently on poor connection** | Low | High | Enhanced sync diagnostics; offline-first fully tested; error visibility in UI |
| **Practice content feels repetitive after 14 days** | Medium | Medium | Expand practice library; randomize presentation; seasonal variations coming later |
| **Mobile viewport renders break under 375px** | Low | Medium | Test suite on 320px, 375px, 412px viewports; audit interaction audit (lively-dancing-teacup.md) |
| **Auth gate gates out legitimate users** | Low | High | Keep Supabase support channel open during beta; allow offline mode fallback (future) |

### Mitigation Strategies
1. **Content**: Have voice talent or AI narration ready to ship guidance audio by week 3
2. **Messaging**: A/B test onboarding message about "capacity vs. relaxation"; measure understanding
3. **Pacing**: Run internal 2-week pilot first (team uses app daily); track which day has highest dropout intent
4. **Testing**: Automated cross-browser testing for 320px, 375px, 412px; manual phone testing weekly
5. **Transparency**: Public roadmap visible in app; user can see what's coming (next quarter)

---

## 10. BENCHMARK CHECKLIST FOR SUCCESS

**Before Beta Launch (Week 4-5):**
- [ ] 40+ practices finalized with guidance audio recorded
- [ ] 3 core programs finalized with day/leg guidance audio
- [ ] 5 intro + 10-15 practice-specific videos recorded
- [ ] Internal 14-day team pilot completed; pacing feedback integrated
- [ ] Supabase hardening tasks completed
- [ ] Smoke test suite at 95%+ pass rate
- [ ] Mobile viewport audit (320px, 375px, 412px) shows no broken layouts

**Before Public Launch (Week 12-16):**
- [ ] Beta cohort (10-20 users) 14-day completion rate > 70%
- [ ] User feedback: < 3 critical UX issues per user report
- [ ] Performance metrics: Time-to-interactive < 2.5s on 4G connection
- [ ] Evidence claim audit: all messaging passes legal/marketing review
- [ ] Video CDN verified; playback tested across device/network conditions
- [ ] Public positioning + landing page live

---

## 11. CURRENT EVIDENCE-MESSAGING ALIGNMENT

### Strong Alignment ✅
- **Framing:** "builds consistency, not higher intelligence" — defensible against effect-size-collapse objections
- **Regulatory-first sequence:** "breath → attention → awareness" — well-supported in neuroscience
- **Skill-training model:** meditation as trainable capacity, not pharmaceutical effect — strong evidence base
- **Two-language model:** spiritual + scientific language preserves depth without overclaiming
- **Gating on consistency:** rewards daily practice, not raw volume — aligns with behavioral research on habit formation

### Caution Points ⚠️
- Effect sizes vs. active controls are smaller; messaging must emphasize "modest gains"
- Structural brain claims from short app doses are contested; avoid them (✓ already excluded)
- Long-term maintenance effects (6+ months off-app) are under-studied; don't guarantee permanence
- Open monitoring (vipassana-style) has less evidence than focused attention; prioritize breath + concentration initially

### Evidence Gaps (Address in Roadmap) 🔄
- **Phase 2 Beta (after launch):** collect user data on consistency improvements (return-to-task speed, attention drift under load)
- **Phase 3 Long-term (6 months post-launch):** track whether app users maintain consistency gains 3-6 months after active use
- **Phase 4 Community (12+ months):** anonymous aggregate reporting on user outcomes (performance reliability, stress reduction)

---

## 12. SUMMARY: WHERE WE ARE & WHERE WE'RE GOING

### Where We Are (March 20, 2026)
A **mature, evidence-grounded framework** for state training as a skill + a complete absence of practice/curriculum **content**.

- ✅ Core architecture: stable, audited, production-ready
- ✅ Messaging: aligned with evidence; conservative, defensible claims
- ✅ User experience: polished UI, mature component library, accessible
- ✅ Dev tooling: comprehensive (LLM test panel, state inspector, debug gates)
- ❌ Practice content: 0% finalized (templates ready; specific sessions not recorded)
- ❌ Curriculum content: 0% finalized (structure ready; day-by-day assignments TBD)
- ❌ Video content: 0% recorded (schema ready; videos TBD)

### Where We're Going (Next 6 Months)
1. **Sprint 1 (Weeks 1-4):** close content gaps (practices, curricula, guidance audio)
2. **Sprint 2 (Weeks 5-12):** beta testing, user feedback, iteration
3. **Sprint 3 (Weeks 13+):** public launch prep, performance hardening, marketing campaign

**Growth model:** content-driven expansion (add practices, programs, paths) + evidence-driven iteration (measure consistency gains, optimize pacing, refine family matching)

---

## 13. NEXT STEPS

### Immediate (This Week)
1. Triage practice content: list all 40-50 target practices + estimate recording time
2. Schedule voice talent or AI narration start date
3. Map video content shoot dates
4. Confirm beta cohort (who, when, how to recruit)

### Short-term (Weeks 2-4)
1. Record practice guidance audio (batch by family)
2. Finalize curriculum day/leg assignments
3. Record intro + practice-specific videos
4. Run internal 14-day pilot; collect pacing feedback

### Medium-term (Weeks 5-12)
1. Beta cohort launch; monitor daily
2. Collect user feedback on clarity, difficulty, engagement
3. Iterate UI/UX based on usage patterns
4. Expand practice library based on hints (which families are sticking)

### Long-term (Post-Public Launch)
1. Evidence collection: pre/post consistency metrics
2. Adherence analysis: which practices, programs, paths sustain engagement
3. Path expansion: add 2-3 new paths based on user demand + evidence
4. Community features (optional) if user feedback calls for peer connection

---

**Document prepared by:** Immanence OS team  
**Last updated:** 2026-03-20  
**Next review:** 2026-04-17 (post-beta launch)
