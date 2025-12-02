**IMMANENCE OS - BREATHING PRACTICE STATUS UPDATE**
**Date: November 29, 2025**

---

## CURRENT STATE
Breathing practice UI is functional but **tap timing calculation is completely broken**.

Screenshot shows: `1200000000001 ms early` - impossibly large error value (appears to be timestamp contamination, not time difference).

---

## WHAT WORKS
- Breathing ring visible and scales properly through inhale/exhale/hold phases
- Ring is clickable - `onClick` handler fires on tap
- Ring displays phase text (Inhale/Hold/Exhale/Hold)
- Tap ripple animation triggers with color feedback (gold/emerald/orange/cyan)
- Stop button works, timer displays below it
- Accuracy pulse/petal visuals render

---

## CRITICAL BUG: TAP TIMING
**Location:** `src/components/BreathingRing.jsx`, function `handleRingClick()` (~lines 145-165)

**Problem:** Error calculation produces impossible values (billions of milliseconds instead of ±500ms range).

**Current Logic:**
```javascript
const closestPeak = /* find nearest peak (tInhale or tExhale) */
const cycleMs = total * 1000;
const expectedMs = closestPeak.phase * cycleMs;
const actualMs = progress * cycleMs;
const errorMs = actualMs - expectedMs;
```

**What's wrong:** Either:
1. `progress` is being calculated as timestamp instead of 0-1 fraction
2. `closestPeak.phase` is wrong
3. Error value is being contaminated with Date.now() somewhere

**Expected behavior:** Tapping should return ±200ms range (perfect = 0, late = positive, early = negative).

---

## FILES MODIFIED
1. `src/components/PracticeSection.jsx` - Removed tap button, breathing ring is now tap target
2. `src/components/BreathingRing.jsx` - Added `onClick` handler with error calculation

Both files in: `/mnt/user-data/outputs/` (ready to copy)

---

## NEXT STEPS
1. **Debug error calculation** in BreathingRing.jsx handleRingClick()
2. Add console.log statements to check: `progress`, `closestPeak.phase`, `cycleMs`, `actualMs`, `expectedMs`
3. Verify progress is indeed 0-1 fraction, not timestamp
4. Once fixed, all tap feedback (ripples, colors, stats) should work automatically

---

## KEY VARIABLES
- `progress`: 0-1 fraction through breath cycle (from requestAnimationFrame loop)
- `total`: sum of inhale + holdTop + exhale + holdBottom (seconds)
- `tInhale`, `tExhale`: phase boundaries as fractions (0.25, 0.5, etc)
- `cycleMs`: total * 1000 (milliseconds in full cycle)