# Breathing Benchmark Implementation — Current State Summary

## Overview
The breathing benchmark system measures maximum breath capacity across 4 phases and applies progressive scaling during practice sessions. The progression pattern uses **cycle-based thirds** (first third: 75%, middle third: 85%, final third: 100% of benchmark).

---

## 1. MAX BREATH CAPACITY DEFINITION & STORAGE

### Location: [src/state/breathBenchmarkStore.js](src/state/breathBenchmarkStore.js#L1)

### Data Structure
```javascript
benchmark: {
  inhale: number,      // seconds (max capacity measured)
  hold1: number,       // seconds (top of breath hold)
  exhale: number,      // seconds (max exhalation)
  hold2: number,       // seconds (bottom of breath hold)
  measuredAt: timestamp // Date when benchmark was measured
}
```

### Benchmark Values Are: **Per-Phase**
- Each of the 4 breathing phases has its own independent maximum duration in seconds
- Stored as raw seconds from user measurement (not percentages)
- Example: `{ inhale: 8, hold1: 12, exhale: 10, hold2: 6 }` means max 8s inhale, 12s top hold, etc.

### Storage
- **Store**: Zustand persist middleware (`'immanence-breath-benchmark'`)
- **Key field**: `benchmark` (null if not yet measured)
- **Persistence**: Browser localStorage via Zustand's persist middleware

---

## 2. BENCHMARK MEASUREMENT PROCESS

### Location: [src/components/BreathBenchmark.jsx](src/components/BreathBenchmark.jsx)

### Flow: INTRO → MEASURING → RESULTS

**Phase Definition** (4 total phases):
```javascript
const PHASES = [
    { key: 'inhale', label: 'INHALE', minSeconds: 2 },
    { key: 'hold1', label: 'HOLD', minSeconds: 1 },
    { key: 'exhale', label: 'EXHALE', minSeconds: 2 },
    { key: 'hold2', label: 'HOLD', minSeconds: 1 },
];
```

**Measurement Process**:
1. User enters intro screen
2. Taps to begin measuring `inhale` phase
3. Holds breath/phase until limit, then taps
4. Duration measured in **milliseconds** then converted to **seconds** (rounded)
5. Repeats for hold1, exhale, hold2
6. Results shown with 75% starting pattern preview
7. User accepts or retries

**Timer Implementation**:
- Uses `requestAnimationFrame` for precise high-frequency updates
- `startTimeRef` / `stopPhase()` measure elapsed milliseconds
- Converted to seconds: `Math.round(elapsed / 1000)`

### Results Preview (Displayed in Modal)
After measurement, user sees:
- Bar chart of all 4 phase measurements
- Minimum thresholds (2s inhale/exhale, 1s holds)
- **"STARTING PATTERN (75%)"** preview
- Retry or Accept button

---

## 3. HOW BENCHMARK VALUES ARE APPLIED DURING PRACTICE

### Location: [src/components/PracticeSection.jsx](src/components/PracticeSection.jsx#L1900-L1932)

### Initialization (When Practice Starts)
1. **User sets duration** (e.g., 10 minutes)
2. **Calculate total cycles**:
   ```javascript
   const totalCycles = calculateTotalCycles(duration, pattern);
   // = Math.floor((durationMinutes * 60) / cycleDuration)
   // Example: 10 min with 8-second cycle = 75 total cycles
   ```

3. **Set starting pattern** to 75% of benchmark:
   ```javascript
   const startingPattern = getStartingPattern()
   // Returns: {
   //   inhale: Math.round(benchmark.inhale * 0.75),
   //   hold1: Math.round(benchmark.hold1 * 0.75),
   //   exhale: Math.round(benchmark.exhale * 0.75),
   //   hold2: Math.round(benchmark.hold2 * 0.75),
   // }
   ```

### During Practice (Per Breath Cycle)
Each time a full breath cycle completes:
- `BreathingRing` fires `onCycleComplete` callback
- This increments `breathCount` by 1
- `breathingPatternForRing` useMemo re-computes with updated `breathCount`

**Progressive Pattern Selection** (per cycle):
```javascript
const totalCycles = calculateTotalCycles(duration, pattern);
const progressivePattern = getPatternForCycle(breathCount + 1, totalCycles);
```

---

## 4. PERCENTAGE RAMP & MULTIPLIER APPLICATION

### Location: [src/state/breathBenchmarkStore.js](src/state/breathBenchmarkStore.js#L51-L76)

### Key Function: `getPatternForCycle(cycleNumber, totalCycles)`

**Input**:
- `cycleNumber`: Current breath cycle (1-indexed: breathCount + 1)
- `totalCycles`: Total cycles in session (computed from duration + pattern)

**Ramp Logic** (Segmented by **Breath Count Thirds**):

```javascript
const third = Math.max(1, totalCycles / 3);
let multiplier;

if (cycleNumber <= third) {
    multiplier = 0.75;  // First third of cycles: warm-up
} else if (cycleNumber <= third * 2) {
    multiplier = 0.85;  // Middle third of cycles: building
} else {
    multiplier = 1.0;   // Final third of cycles: full capacity
}

return {
    inhale: Math.round(benchmark.inhale * multiplier),
    hold1: Math.round(benchmark.hold1 * multiplier),
    exhale: Math.round(benchmark.exhale * multiplier),
    hold2: Math.round(benchmark.hold2 * multiplier),
};
```

### Example
If benchmark = `{ inhale: 8, hold1: 12, exhale: 10, hold2: 6 }` and session has 75 total cycles:
- **Cycles 1–25** (first 6.7 min): `{ inhale: 6, hold1: 9, exhale: 7, hold2: 4 }` (75%)
- **Cycles 26–50** (next 6.7 min): `{ inhale: 6.8, hold1: 10.2, exhale: 8.5, hold2: 5.1 }` (85%) → rounded
- **Cycles 51–75** (final 6.7 min): `{ inhale: 8, hold1: 12, exhale: 10, hold2: 6 }` (100%)

**Ramp is segmented by**: **BREATH CYCLES** (not time, not sessions)

---

## 5. VARIABLES & FUNCTIONS INVOLVED

### Store: [src/state/breathBenchmarkStore.js](src/state/breathBenchmarkStore.js)

| Variable | Type | Purpose |
|----------|------|---------|
| `benchmark` | object \| null | Stores max capacity: `{ inhale, hold1, exhale, hold2, measuredAt }` |
| `name` | string (const) | Zustand persist key: `'immanence-breath-benchmark'` |

| Function | Signature | Purpose |
|----------|-----------|---------|
| `setBenchmark(results)` | `(results) => set({ benchmark: {...} })` | Store measurement after 4-phase test |
| `clearBenchmark()` | `() => set({ benchmark: null })` | Clear stored benchmark |
| `hasBenchmark()` | `() => boolean` | Check if benchmark exists |
| `daysSinceBenchmark()` | `() => number \| Infinity` | Days since last measurement |
| `needsRebenchmark()` | `() => boolean` | True if ≥7 days since last benchmark |
| `getStartingPattern()` | `() => pattern \| null` | Returns 75% of benchmark (for session start) |
| `getPatternForCycle(cycleNumber, totalCycles)` | `(number, number) => pattern \| null` | Returns progressive pattern (75%/85%/100%) for given cycle |
| `calculateTotalCycles(durationMinutes, pattern)` | `(number, pattern) => number` | Total breath cycles in session |

### Component Hooks: [src/components/PracticeSection.jsx](src/components/PracticeSection.jsx#L1070-L1071)

```javascript
const hasBenchmark = useBreathBenchmarkStore(s => s.hasBenchmark());
const getPatternForCycle = useBreathBenchmarkStore(s => s.getPatternForCycle);
const calculateTotalCycles = useBreathBenchmarkStore(s => s.calculateTotalCycles);
```

### Measurement Component: [src/components/BreathBenchmark.jsx](src/components/BreathBenchmark.jsx#L1-15)

| Variable | Type | Purpose |
|----------|------|---------|
| `PHASES` | array | 4-phase metadata (inhale, hold1, exhale, hold2) with min thresholds |
| `results` | object | User-measured durations for each phase (in seconds) |
| `stage` | string | 'intro' \| 'measuring' \| 'results' |
| `currentPhaseIndex` | number | 0–3 (tracks which phase user is measuring) |
| `elapsedMs` | number | Current phase elapsed milliseconds |

| Function | Purpose |
|----------|---------|
| `startPhase()` | Begin measuring current phase (set startTimeRef, start RAF loop) |
| `stopPhase()` | End measuring, record elapsed seconds, return duration |
| `handleTap()` | Advance through flow: intro→measuring→results |
| `handleAccept()` | Call `setBenchmark(results)` and close modal |

### Config Component: [src/components/BreathConfig.jsx](src/components/BreathConfig.jsx#L30-L46)

```javascript
const getStartingPattern = useBreathBenchmarkStore(s => s.getStartingPattern);
// After benchmark completion, call:
// const startingPattern = getStartingPattern();
// setPattern(startingPattern); // Updates UI controls to 75% values
```

---

## 6. DATA FLOW (Plain-Language Summary)

### INPUT
1. **User measures benchmark**:
   - Opens BreathBenchmark modal
   - Measures max capacity for each of 4 phases
   - Results stored: `{ inhale: X, hold1: Y, exhale: Z, hold2: W, measuredAt: now }`
   - Stored in `breathBenchmarkStore` (localStorage)

### TRANSFORMATION
2. **User starts practice session**:
   - Selects duration (e.g., 10 minutes)
   - **Starting pattern set to 75%** of benchmark
   - **Total cycles calculated**: `floor((durationMinutes * 60) / (inhale + hold1 + exhale + hold2))`
   - Example: 10 min ÷ 8-second cycle = 75 cycles total

3. **Each breath cycle completes**:
   - `onCycleComplete` callback fires
   - `breathCount` increments
   - **New pattern computed** via `getPatternForCycle(breathCount + 1, totalCycles)`
   - Multiplier selected based on which third: 
     - Cycles 1 to `totalCycles/3`: 0.75 (75%)
     - Cycles `totalCycles/3` to `totalCycles/1.5`: 0.85 (85%)
     - Cycles `totalCycles/1.5` to end: 1.0 (100%)

### OUTPUT
- **Phase durations applied to breathing ring**:
  ```javascript
  {
    inhale: pattern.inhale * multiplier,
    holdTop: pattern.hold1 * multiplier,
    exhale: pattern.exhale * multiplier,
    holdBottom: pattern.hold2 * multiplier,
  }
  ```
- Values passed to `BreathingRing` component for visual animation timing
- Ring adapts breath cycle duration each cycle based on progression

### Example Timeline (10-minute session, 75 cycles)
```
Cycle 1–25 (0:00–6:40):   75% of benchmark
Cycle 26–50 (6:40–13:20): 85% of benchmark  
Cycle 51–75 (13:20–20:00): 100% of benchmark
```

---

## 7. KEY CHARACTERISTICS

| Property | Value |
|----------|-------|
| **Benchmark scope** | Per-phase (4 independent measurements) |
| **Benchmark unit** | Seconds (raw measurement) |
| **Ramp segmentation** | By breath cycles (1st/3rd vs 2nd/3rd vs 3rd/3rd) |
| **Percentage tiers** | 75% → 85% → 100% |
| **Applied at** | Per-cycle (re-computed each cycle completion) |
| **Rounding** | `Math.round()` applied to all calculated durations |
| **Storage** | Zustand persist (localStorage key: `immanence-breath-benchmark`) |
| **Re-benchmark interval** | 7 days (checked via `needsRebenchmark()`) |

---

## 8. INTERACTION POINTS

### Where Benchmark is Initiated
- **BreathConfig button**: "Benchmark" button opens BreathBenchmark modal
- Shows when `hasBenchmark() === false` or `needsRebenchmark() === true`

### Where Benchmark is Applied
- **BreathConfig**: After test, UI sliders reset to `getStartingPattern()` (75%)
- **PracticeSection**: During practice, uses `getPatternForCycle()` to scale each cycle

### Where Benchmark Data is Read
- Store selectors in `PracticeSection` (line 1070–1071)
- Store selectors in `BreathConfig` (line 30)
- Fallback: if no benchmark, use static user-configured pattern

---

## NO CHANGES MADE
This is a comprehensive extraction and summary only. No code modifications, refactors, or new features have been implemented.
