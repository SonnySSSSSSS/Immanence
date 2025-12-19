# Cycle & Consistency System

## Overview

The Cycle & Consistency System is a structured progression framework that replaces simple streak tracking with **cycle-based practice commitment**. It measures participation patterns, tracks self-reported benchmarks, and gates avatar advancement behind demonstrated consistency and capacity.

### Core Philosophy

> "The practice IS the path. Showing up consistently changes you regardless of what your 'attention quality' is on any given day."

The system measures **participation**, not internal states. It recognizes that:
- Sustained practice creates transformation
- Consistency matters more than intensity
- Different people have different capacity for structure
- Regression is real and should be acknowledged

---

## System Components

### 1. Cycle Types

Three cycle types with increasing duration:

| Cycle | Duration | Purpose |
|-------|----------|---------|
| **Foundation** | 14 days | Establish baseline consistency |
| **Transformation** | 90 days | Deepen practice, build capacity |
| **Integration** | 180 days | Sustain long-term commitment |

### 2. Cycle Modes

Two modes reflecting different approaches to consistency:

| Mode | Baseline | Meaning |
|------|----------|---------|
| **Consecutive** | 100% | Unbroken daily practice required |
| **Flexible** | 67% | 14 of 21 days (allows life interruptions) |

**Key insight**: Modes are not "easy" vs "hard"—they reflect current capacity. Flexible mode still requires discipline, just acknowledges that life happens.

### 3. Checkpoint System

Every **14 days**, the system:
- Reviews progress metrics
- Allows mode switching (if desired)
- Recalibrates timeline using smoothing formula
- Locks new mode choice for 2 weeks

This prevents oscillation while allowing adaptation.

---

## Data Architecture

### State Management

```
cycleStore.js          → Current cycle state, checkpoints, history
progressStore.js       → Benchmarks, practice history, consistency metrics
curriculumStore.js     → Circuits, path curricula (stub)
```

### Key Data Structures

**Current Cycle:**
```javascript
{
  type: 'foundation' | 'transformation' | 'integration',
  mode: 'consecutive' | 'flexible',
  startDate: timestamp,
  targetDays: 14 | 90 | 180,
  practiceDays: [timestamp1, timestamp2, ...], // dates with 10+ min
  elapsedDays: number,
  consistencyRate: number, // actual practice rate
  effectiveDays: number,   // weighted by mode baseline
  status: 'active' | 'paused' | 'completed' | 'failed',
  checkpoints: [{ day: 14, reached: false, modeSwitchAvailable: false }]
}
```

**Benchmarks:**
```javascript
benchmarks: {
  breath: {
    holdDuration: [{ date, value, cycleDay, cycleType }],
    cycleConsistency: [],
    lastMeasured: timestamp
  },
  focus: { flameDuration: [], distractionCount: [] },
  body: { scanCompletionTime: [], awarenessResolution: [] }
}
```

**Practice History:**
```javascript
practiceHistory: [{
  date: timestamp,
  type: 'breath' | 'flame' | 'body' | 'circuit',
  duration: number, // minutes
  timeOfDay: 'HH:MM',
  exercises: [],
  contributions: { breath: 5, flame: 5, body: 5 }
}]
```

---

## Logic Systems

### cycleManager.js

**Responsibilities:**
- Log practice sessions (10+ min triggers cycle day)
- Calculate effective progress (mode-weighted)
- Handle mode switches with recalibration
- Calculate consistency metrics (time-of-day, duration, frequency)

**Key Formula: Effective Progress**
```javascript
effectiveDays = practiceDays.length * (actualRate / modeBaseline)

// Example:
// Flexible mode (baseline 0.67), 30 practice days over 40 elapsed
// actualRate = 30/40 = 0.75
// effectiveDays = 30 * (0.75 / 0.67) = 33.6 days
```

**Mode Switch Recalibration:**
```javascript
// When switching from Flexible → Consecutive:
// Same 30 practice days, but higher bar (1.0 instead of 0.67)
// effectiveDays = 30 * (0.75 / 1.0) = 22.5 days
// Timeline extends because bar is higher
```

This ensures **fairness**: your practice days don't disappear, but the effective progress recalculates based on the new standard.

### benchmarkManager.js

**Responsibilities:**
- Log self-reported metrics (breath hold, focus duration, etc.)
- Track trends (improving/stable/declining)
- Check stage advancement requirements
- Detect capacity regression (20%+ drop)

**Stage Requirements:**
```javascript
Seedling → Ember:   1 cycle, 75% consistency, any path progress
Ember → Flame:      3 cycles, 80% consistency, 2 paths
Flame → Beacon:     6 cycles, 85% consistency, 3 paths
Beacon → Stellar:   10 cycles, 90% consistency, mastery in all paths
```

**Regression Detection:**
- Compares recent 5 data points to historical best
- If recent average < 80% of best → regression detected
- Recommendation: stage demotion or refocus on that path

### circuitManager.js

**Responsibilities:**
- Manage multi-path training sessions
- Calculate exercise transitions
- Split contributions across paths

**Example: Foundation Circuit**
```javascript
{
  exercises: [
    { type: 'breath', duration: 5 },
    { type: 'focus', duration: 5 },
    { type: 'body', duration: 5 }
  ],
  totalDuration: 15,
  contributions: { breath: 5, focus: 5, body: 5 }
}
```

---

## Data Flow

### Practice Session Flow

```
User completes 10+ min practice
    ↓
cycleManager.logPractice({ type, duration, timeOfDay })
    ↓
Add to progressStore.practiceHistory
    ↓
cycleStore.logPracticeDay(date)
    ↓
Update consistencyRate, effectiveDays
    ↓
Check checkpoint reached?
    ↓
Check cycle completion?
```

### Checkpoint Flow

```
Every 14 days elapsed
    ↓
cycleStore.checkCheckpoint()
    ↓
Mark checkpoint reached
    ↓
Set canSwitchMode = true
    ↓
Trigger CheckpointReview UI
    ↓
User chooses: Continue or Switch Mode
    ↓
If switch: recalibrateOnModeSwitch()
    ↓
Lock mode for next 2 weeks
```

### Cycle Completion Flow

```
effectiveDays >= targetDays
    ↓
cycleStore.completeCycle()
    ↓
Move to completedCycles[]
    ↓
benchmarkManager.gatherMetrics()
    ↓
benchmarkManager.metricsCheckForStage(nextStage)
    ↓
If sufficient: Advance avatar stage
    ↓
Offer next cycle type (foundation → transformation → integration)
```

---

## Integration Points

### Existing Practice Components

**BreathingPractice.jsx, FlamePractice.jsx, BodyScanPractice.jsx:**
- After session completes → call `cycleManager.logPractice()`
- Trigger benchmark input at checkpoints

### Navigation Component

**Add:**
- `ConsistencyFoundation.jsx` as first item (always visible)
- `CircuitTrainer.jsx` as new section

### Avatar Progression

**Modified logic:**
- Stage advancement now requires:
  - Cycle completion count (from `cycleStore.totalCyclesCompleted`)
  - Benchmark metrics (from `benchmarkManager.metricsCheckForStage()`)
- Regression check:
  - Periodic check via `benchmarkManager.checkCapacityRegression()`
  - If regressed → consider stage demotion

---

## Design Decisions

### Why 10+ Minutes?

Practice sessions under 10 minutes don't count toward cycle days. Rationale:
- Prevents gaming the system with 1-minute "check-ins"
- Ensures meaningful engagement
- Aligns with minimum effective practice duration

### Why 67% for Flexible Mode?

14 of 21 days = 67%. This allows:
- 1 day off per week (7 days)
- Life happens (illness, travel, emergencies)
- Still requires discipline (not "whenever you feel like it")

### Why Checkpoints Every 2 Weeks?

- Frequent enough to allow course correction
- Infrequent enough to prevent constant mode-switching
- Aligns with common planning cycles (bi-weekly reviews)

### Why Lock Mode for 2 Weeks?

Prevents oscillation. Without locking:
- User switches to Consecutive on good week
- Switches back to Flexible when it gets hard
- System becomes meaningless

### Why Smoothing Formula?

When switching modes, we don't want to:
- **Punish** users who switch to harder mode (lose all progress)
- **Reward** users who switch to easier mode (instant completion)

The formula preserves practice days but recalculates effective progress based on new baseline. This is **fair**.

### Why Self-Reported Benchmarks?

The phone cannot measure:
- Breath hold duration (requires user honesty)
- Subjective awareness quality
- Somatic resolution

Self-reporting is honest about limitations. We trust users to report accurately because:
- No external rewards (no leaderboards, no social sharing)
- Only consequence is avatar stage (which is personal)
- Lying to yourself defeats the purpose

---

## Edge Cases

### 1. Practice After Midnight

**Problem**: User practices at 11:50 PM, session ends at 12:10 AM. Which day?

**Solution**: Use session **start time** to determine date. If started before midnight, counts for that day.

### 2. Multiple Sessions Per Day

**Problem**: User does 2 sessions in one day (morning + evening).

**Solution**: Count as **1 practice day**. Cycle system measures consistency (showing up), not volume.

### 3. Mode Switch at Checkpoint

**Problem**: User switches mode multiple times at different checkpoints.

**Solution**: Track mode history in cycle object. Each switch is logged with timestamp.

### 4. Circuit with Uninitiated Path

**Problem**: User starts Foundation Circuit but has never done body scan before.

**Solution**: Circuit introduces the path. No prior initialization required. Contributions still split correctly.

### 5. Missing Benchmark Reports

**Problem**: User doesn't self-report benchmarks at checkpoints.

**Solution**: Benchmarks are **optional** for cycle completion, but **required** for avatar stage advancement. User can complete cycles without benchmarks, but won't advance stages.

### 6. Cycle Failure & Restart

**Problem**: User fails a cycle (stops practicing). What happens on restart?

**Solution**: 
- Failed cycle archived with `failed: true`
- User can start new cycle immediately
- Failed cycles don't count toward `totalCyclesCompleted`
- Benchmarks are preserved (not reset)

### 7. Time Zones / Travel

**Problem**: User travels across time zones. How to handle date boundaries?

**Solution**: Use **local time** for all date calculations. When user travels, their practice day is based on local midnight, not UTC.

---

## Future Enhancements

### Path-Specific Cycles

Currently: Cycles aggregate across all practices.

Future: Allow path-specific cycles (e.g., "90-day Breath Path Transformation").

### Adaptive Baselines

Currently: Baselines are fixed (1.0 for consecutive, 0.67 for flexible).

Future: Baselines could adapt based on historical performance.

### Social Accountability (Optional)

Currently: Fully private.

Future: Optional accountability partner feature (share cycle progress with one person).

### Curriculum Integration

Currently: Circuits are stub data.

Future: Full curriculum with progressive exercises, unlocks, and path-specific training.

---

## Testing Checklist

- [ ] Foundation cycle (consecutive): 14 days → completion
- [ ] Foundation cycle (flexible): 14/21 days → completion
- [ ] Mode switch recalculates timeline correctly
- [ ] Checkpoint triggers every 2 weeks
- [ ] Practice logging updates consistency rate
- [ ] Circuit contributions split correctly
- [ ] Avatar advances after cycle + metrics
- [ ] Avatar regresses on capacity loss
- [ ] Smoothing formula preserves fairness
- [ ] Cycle failure stops tracking properly
- [ ] Benchmark history persists
- [ ] UI reflects real-time progress

---

## Summary

The Cycle & Consistency System replaces simple streaks with **structured commitment cycles**. It:

- Measures **participation** (what's observable)
- Respects **different capacities** (consecutive vs flexible)
- Allows **adaptation** (checkpoints, mode switching)
- Prevents **gaming** (10+ min threshold, mode locking)
- Gates **progression** (avatar stages require cycles + benchmarks)
- Acknowledges **regression** (capacity loss detection)

It is honest, fair, and respects that practice is not linear.
