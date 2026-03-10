# PracticeSection Lifecycle Warning Audit

## Deferred warnings reviewed

1. **PracticeSection.jsx:2137** - `executeStart` useCallback
   - Warning: Unnecessary dependency `setLastPracticeStartProbe`
   - Severity: Low (unnecessary inclusion, not missing)

2. **PracticeSection.jsx:2307** - Countdown timer effect
   - Warning: Missing dependencies `advanceCircuitExercise`, `circuitConfig`, `countdownValue`, `handleStop`, `setTimeLeft`
   - Severity: HIGH (effect reads state but doesn't declare dependencies)

3. **PracticeOptionsCard.jsx:59** - Scroll-reveal effect
   - Warning: Missing dependency `setHasExpandedOnce`
   - Severity: Medium (setter called in effect but not declared)

4. **ScrollingWheel.jsx:16** - Value-sync effect
   - Warning: Synchronous setState within effect causing cascading renders
   - Severity: HIGH (performance/correctness issue)

5. **PracticeSection.jsx (re-export)** - Fast refresh only-exports
   - Error: File exports constants alongside components
   - Severity: Low (lint/tooling, not runtime)

---

## Runtime ownership map

### Warning #1: `executeStart` callback - setLastPracticeStartProbe (line 2137)
**Runtime responsibility:** Session initialization orchestration for all practice types (breath, awareness, circuit, ritual, photic, visualization).

**Owned behaviors:**
- Circuit validation and state setup (lines 2035-2055)
- Awareness/vipassana direct start with sensory config (lines 2058-2076)
- Standard practice launch with domain mapping (lines 2078-2135)
- Tempo sync audio trigger for breath + tempo-enabled (lines 2089-2120)
- Session domain determination and `startSession()` call (lines 2122-2136)

**Dependency analysis:** `setLastPracticeStartProbe` appears in the dependency array but a search of the callback body (lines 1980-2136) shows it is **never called**. This is likely a copy-paste artifact from an earlier probe version that was removed from the callback body but left in the dependency array.

**Classification:** **Likely intentional omission removal** (probe code was deleted but dependency forgotten)

---

### Warning #2: Countdown timer effect - missing dependencies (line 2307)
**Runtime responsibility:** Countdown timer loop, circuit exercise advancement, and session completion detection.

**Owned behaviors:**
- 1-second decrement loop while `isRunning && !isSessionPaused && practice !== "Rituals"` (lines 2292-2294)
- **Critical decision point at `timeLeft === 0`:** Routes to either:
  - `advanceCircuitExercise()` if circuit is active (line 2297)
  - `handleStop({ completed: true })` if no circuit (line 2299)
- Conditional on `countdownValue === null` (line 2295) to avoid double-advance
- Cleanup: interval teardown (lines 2304-2306)

**Dependency analysis:**
- **`advanceCircuitExercise` (MISSING):** Called on line 2297; used to step to next exercise in circuit. Dependency on this callback is critical—if it changes identity without effect re-running, stale closure risk exists.
- **`circuitConfig` (MISSING):** Evaluated on line 2296 in condition `if (activeCircuitId && circuitConfig)`. Changes to circuit structure should re-run the effect.
- **`countdownValue` (MISSING):** Read on line 2295 in condition `countdownValue === null`. If countdown external state changes, this gate must re-evaluate.
- **`handleStop` (MISSING):** Called on line 2299 to end session. Changes to stop logic require effect re-run.
- **`setTimeLeft` (MISSING):** Used on line 2293 inside interval callback. Changes to this state setter (rare but possible in hot reload) should re-run.

**Current dependencies `[isRunning, isSessionPaused, timeLeft, practice, activeCircuitId]`:**
- `isRunning`: ✅ covers "is timer running"
- `isSessionPaused`: ✅ covers "is pause active"
- `timeLeft`: ✅ covers "countdown value"
- `practice`: ✅ covers "practice type" (Rituals exclusion)
- `activeCircuitId`: ⚠️ partial—detects circuit active, but `circuitConfig` changes are not seen

**Risk if left unfixed:**
- If `advanceCircuitExercise` is re-created (e.g., due to upstream dependency change) but `countdownValue` stays the same, the effect closure captures the old `advanceCircuitExercise`, leading to wrong circuit progression
- If `circuitConfig` changes (user edits exercises), the effect doesn't re-run, so the decision logic still uses old structure
- If `countdownValue` becomes non-null externally, the condition gate is never seen by the effect

**Classification:** **Accidental omission—unsafe without neighbors**. This effect is tightly coupled to circuit lifecycle; any fix must account for all 5 missing deps together or risk subtle double-trigger or stale-closure bugs.

---

### Warning #3: Scroll-reveal effect - missing setHasExpandedOnce (line 59, PracticeOptionsCard)
**Runtime responsibility:** One-time scroll-into-view reveal when a practice card expands.

**Owned behaviors:**
- Gate: `if (practiceId && !hasExpandedOnce && cardRef.current)` (line 52)
- Timer: 400ms delay for CSS transition settle (line 56)
- Action: `setHasExpandedOnce(true)` + `scrollIntoView()` (lines 54-55)
- Cleanup: clear timeout on unmount or dependency change (line 57)

**Dependency analysis:** `setHasExpandedOnce` is called on line 54 but not in the dependency array. Current array is `[practiceId, hasExpandedOnce]`.

**Probe result (2026-03-10):** The visible probe banner **never appeared** during testing. Root cause confirmed:
- Parent initializes `hasExpandedOnce` as `useState(!!initialPracticeId)` (PracticeSection.jsx:537)
- `initialPracticeId` comes from saved preferences, which persist across sessions
- Any returning user boots with `hasExpandedOnce = true` — the effect condition `!hasExpandedOnce` is already false on mount
- The scroll-reveal effect is **dead code in the common user flow**
- The effect can only fire on a truly fresh session with no saved practice preferences

**Classification:** **Warning is moot in practice.** The effect body runs at most once per device lifetime (on a user's very first session with no saved state). The missing `setHasExpandedOnce` dep poses zero stale-closure risk because the effect never re-runs. The dep array fix remains correct for lint hygiene but has zero runtime impact in the common flow.

---

### Warning #4: Value-sync effect - cascading renders (line 16, ScrollingWheel)
**Runtime responsibility:** Keep the scrolling wheel scroll offset in sync with the selected `value` prop.

**Owned behaviors:**
- Find index of current `value` in `options` array (line 14)
- Synchronously call `setScrollOffset(index * itemHeight)` (line 16)

**The problem:** Calling `setState` directly inside a `useEffect` body (not in a callback) triggers a render mid-effect, which can cause cascading re-renders if the component that provides the `value` prop also renders as a result.

**Current dependencies `[value, options, itemHeight]`:** All needed, but the setState pattern is wrong.

**Classification:** **Architectural pattern error—low risk but bad practice**. This should either:
1. Use `useLayoutEffect` if the offset needs to sync before browser paint, or
2. Use a callback ref to avoid the extra render

---

## Coupling analysis

### Cluster A: Session Start (executeStart + validation effect)
**Members:**
- `executeStart` callback (line 1980-2137)
- Circuit validation effect (line 2140-2144)

**Coupling:** Both participate in session launch pipeline. `executeStart` validates and initializes circuit state; the validation effect clears errors if circuit config changes during config. These are **loosely coupled** (validation effect is a guard, not critical to start).

**Correction strategy:** Can be handled separately or together, but `executeStart` is lower-risk because `setLastPracticeStartProbe` is just a removed probe artifact.

---

### Cluster B: Countdown + Circuit Advancement Loop
**Members:**
- Countdown timer effect (line 2287-2307)
- (Implied) `advanceCircuitExercise` callback definition
- (Implied) `handleStop` callback

**Coupling:** **TIGHTLY COUPLED**. The countdown effect is the only place that decides whether to advance the circuit or stop the session. The missing dependencies create a closure lock where stale versions of `advanceCircuitExercise` and `handleStop` could be captured.

**Correction strategy:** **Must fix all 5 missing dependencies together**. Cannot split this effect without risking double-trigger, stale closures, or race conditions in circuit progression.

---

### Cluster C: UI Reveal (PracticeOptionsCard scroll effect)
**Members:**
- Scroll-reveal effect (line 51-59 in PracticeOptionsCard)

**Coupling:** **Isolated**. The effect only manages one-time reveal on card expand. Parent must provide `setHasExpandedOnce` as a stable function (from `useState`).

**Correction strategy:** Low-risk standalone fix. Can be corrected independently.

---

### Cluster D: Scroll Wheel Value Sync
**Members:**
- Value-sync effect (line 13-18 in ScrollingWheel)

**Coupling:** **Isolated**. Pure input→state sync. No interaction with broader component lifecycle.

**Correction strategy:** Can be fixed standalone by switching to `useLayoutEffect` or using a callback ref pattern.

---

## Safest first correction target

**Selection: Cluster C - PracticeOptionsCard scroll-reveal effect (line 59)**

**Rationale:**
1. **Isolated runtime responsibility:** Only controls card visibility scroll behavior, no cascade to other features
2. **Stable dependency:** `setHasExpandedOnce` comes from `useState` in parent, is inherently stable
3. **No stale closure risk:** Adding the setter to deps won't change behavior (setter never changes), just satisfies linter
4. **Zero regression surface:** Scroll-into-view is UI polish; doesn't affect session start, practice flow, or ring lifecycle
5. **Verification is simple:** Open a practice card, observe smooth scroll-into-view; no audio/timing/state edge cases

**Why NOT Cluster B (Countdown)?** Too many missing dependencies creating high stale-closure risk; needs heavyweight verification (circuit progression, session boundaries, pause/resume).

**Why NOT Cluster A (executeStart)?** Depends on understanding what `setLastPracticeStartProbe` was. Safer to audit that first.

**Why NOT Cluster D (ScrollWheel)?** Good candidate, but less impactful than Cluster C; scroll wheel is a sub-component in duration/value config, not in critical path.

---

## Must-move probe plan

**Probe objective:** Verify that adding `setHasExpandedOnce` to the dependency array does NOT change the scroll-reveal behavior.

**Unmistakable signal:** Add a console log that fires when the effect actually scrolls.

**Implementation steps:**

1. Open `src/components/PracticeSection/PracticeOptionsCard.jsx`
2. Add a debug log inside the setTimeout callback (before `setHasExpandedOnce`):
   ```javascript
   const timer = setTimeout(() => {
     console.log('[SCROLL-REVEAL-PROBE] Card expanded, scrolling into view for:', practiceId);
     setHasExpandedOnce(true);
     cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
   }, 400);
   ```
3. Update dependency array from `[practiceId, hasExpandedOnce]` to `[practiceId, hasExpandedOnce, setHasExpandedOnce]`
4. Run dev server: `npm run dev`
5. **Test sequence:**
   - Open Practice Section
   - Click a practice card (e.g., "Breath") → watch console for `[SCROLL-REVEAL-PROBE]` log
   - Scroll up, click same practice again → NO log (because `hasExpandedOnce` is now true)
   - Scroll up, click DIFFERENT practice → log fires again
   - Verify smooth scroll-into-view animation happens **exactly once per practice type**
6. Verify no console warnings about `setHasExpandedOnce` being missing
7. Remove the debug log
8. Commit the one-line dependency fix

**Expected outcome:**
- Console shows probe fires when intended
- No cascading renders or double-scroll
- Lint warning disappears
- Behavior unchanged (one-time reveal per practice)

---

## Human verification checklist

After applying the eventual correction to Cluster C, verify:

- [ ] Open Practice Section, no practices selected → UI shows "Select a practice..."
- [ ] Click "Breath" card → card expands smoothly, content fades in, card scrolls into view (if needed)
- [ ] Scroll up, click "Breath" again → NO scroll-into-view this time (state preserved)
- [ ] Click "Stillness" → card expands, scrolls into view (new practice type)
- [ ] Scroll up, click "Stillness" again → NO scroll
- [ ] Click "Breath" again → NO scroll (hasExpandedOnce remains true per practice)
- [ ] Expand Breath > Breath Expansion, toggle to Traditional Ratios → no unexpected scroll
- [ ] Close DevTools, refresh page → reveal resets, clicking first practice scrolls again ✅
- [ ] **Ring/session behavior:** Start a breath practice → ring appears, no scroll interference
- [ ] **No lint warnings:** Run `npm run lint` → `PracticeOptionsCard.jsx:59` warning is gone

---

## Stop recommendation

Cluster C: CLOSED (2026-03-10)

Probe confirmed effect is dead in the common flow. Dep array hygiene fix applied and warning resolved. No further work needed on Cluster C.

Next step: Scope Cluster B (countdown timer — HIGH risk)

### Cluster B probe (2026-03-10) — COMPLETED, probe removed

Owning file confirmed: `src/components/PracticeSection.jsx` (lines 2287–2307).

**Probe verified findings:**

1. **Countdown tick path: CONFIRMED owned by this effect.** Green badge appeared on session start for Breath practice. Run count incremented once per second, `t` value decremented in sync. Effect re-runs on every `timeLeft` change (because `timeLeft` is in dep array) — new setInterval created and old one torn down each second.

2. **Manual stop path: NOT owned by this effect.** Pressing Stop calls `handleStop` directly via button handler, setting `isRunning=false` synchronously. By the time the effect re-runs, `isRunning` is already false — overlay disappears before red branch can render. The red `stop` branch in the effect body is only reachable via **natural countdown completion** (`timeLeft` reaches 0).

3. **Ritual pause: NOT connected to `isSessionPaused`.** `InsightMeditationPortal` manages pause internally. `handleTogglePause` (which sets `isSessionPaused`) is wired to the guidance audio widget, not to the ritual portal's pause UI. Pressing pause inside the ritual portal does not change `isSessionPaused`, so the effect's pause branch is never triggered for ritual.

4. **`practice === "Rituals"` gate:** The outer condition `isRunning && !isSessionPaused && practice !== "Rituals"` permanently excludes ritual from the countdown loop. Ritual practices never use `timeLeft` for progression — they exit via `InsightMeditationPortal.onExit` → `handleStop` or `handleCircuitComplete`.

**Ownership map confirmed:**

| Sub-path | Owned by this effect | Stale closure risk |
|----------|---------------------|-------------------|
| Countdown tick (setInterval) | YES | `setTimeLeft` — functional update, safe in practice; linter flags anyway |
| Natural completion → stop | YES | `handleStop` — stale closure risk at `timeLeft===0` |
| Circuit advance at zero | YES | `advanceCircuitExercise` — stale closure risk at `timeLeft===0` |
| `countdownValue` zero-gate | YES | `countdownValue` read directly — stale means gate fails silently |
| `circuitConfig` branch guard | YES | `circuitConfig` read directly — stale means null check wrong |
| Manual stop via button | NO | Button calls `handleStop` directly, bypasses effect |
| Ritual pause | NO | Portal manages internally; `isSessionPaused` not involved |
| Pause for countdown practices | Partial — effect respects it | `isSessionPaused` already in dep array — correct |

**Probe removed.** Effect restored to pre-probe state.

### Cluster B correction (2026-03-10) — APPLIED

**Helper stabilization required:** Yes, for both `handleStop` and `advanceCircuitExercise`.

Both are plain functions (not `useCallback`) that close over many render-cycle values. Adding them directly to the dep array would cause the effect to re-run on every render (new function identity each render), creating interval churn and breaking the 1-second cadence. Conversion to `useCallback` was rejected because `handleStop` alone captures 20+ closure values — that dep list would be larger than the effect itself and risk new stale closures in the helper.

**Solution applied:** Ref-pattern stabilization. Two refs added immediately before the effect, with inline current-sync assignment on each render:

```javascript
const handleStopRef = useRef(handleStop);
handleStopRef.current = handleStop;
const advanceCircuitExerciseRef = useRef(advanceCircuitExercise);
advanceCircuitExerciseRef.current = advanceCircuitExercise;
```

Calls inside the effect body updated to use `handleStopRef.current(...)` and `advanceCircuitExerciseRef.current()`. Effect dep array corrected from:

```
[isRunning, isSessionPaused, timeLeft, practice, activeCircuitId]
```

to:

```
[isRunning, isSessionPaused, timeLeft, practice, activeCircuitId, countdownValue, circuitConfig, setTimeLeft]
```

**`setTimeLeft`:** State setter — stable reference. Added to satisfy linter (functional update pattern is technically safe without it, but inclusion is correct hygiene).

**`countdownValue`:** Primitive state — direct read in zero-branch gate. Safe dep. When countdownValue changes from non-null to null, effect re-runs and the zero-boundary decision is re-evaluated correctly.

**`circuitConfig`:** Object state from `useBreathSessionManager`. Direct read in zero-branch guard. Stable across active sessions (circuit config only changes during pre-session configuration). Safe dep.

**Residual risk:** None known. The ref pattern ensures `handleStop` and `advanceCircuitExercise` always call the latest render's version. Interval churn avoided. Countdown semantics unchanged.

**Build status:** ✅ Clean build, no new lint warnings introduced.

**Cluster B status:** CLOSED pending human verification of countdown tick cadence and natural completion path.

---

## Files inspected

1. `src/components/PracticeSection.jsx` — lines 1975-2360
2. `src/components/PracticeSection/PracticeOptionsCard.jsx` — lines 32-633
3. `src/components/PracticeSection/ScrollingWheel.jsx` — lines 1-133

---

## Summary of findings

| Warning | File | Line | Cluster | Risk | Action |
|---------|------|------|---------|------|--------|
| Unnecessary dep `setLastPracticeStartProbe` | PracticeSection.jsx | 2137 | A | Low | Remove from array |
| Missing deps (5x) in countdown timer | PracticeSection.jsx | 2307 | B | HIGH | Hold for heavyweight audit |
| Missing dep `setHasExpandedOnce` | PracticeOptionsCard.jsx | 59 | C | Moot | ✅ CLOSED — effect dead in common flow; dep added for hygiene |
| Cascading setState in effect | ScrollingWheel.jsx | 16 | D | Medium | Switch to useLayoutEffect |
| Fast refresh exports | PracticeSection.jsx | 3 | (N/A) | Low | Move constants to separate file |

---

**Audit date:** 2026-03-10
**Auditor:** Claude Code
**Status:** Ready for Cluster C probe-only pass
