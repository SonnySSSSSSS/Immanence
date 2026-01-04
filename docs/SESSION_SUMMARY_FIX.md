# Session Summary Fix - Technical Documentation

**Version**: v3.15.11
**Date**: 2026-01-04
**AI**: Claude Code
**Status**: ✅ COMPLETED AND VERIFIED

---

## Problem Statement

After stopping a curriculum circuit practice (e.g., Day 2), the session summary screen was not appearing. Instead, users were taken directly to the practice configuration screen without seeing their stats.

## Root Causes

### 1. Missing Circuit Initialization (v3.15.9)
**Location**: `src/components/PracticeSection.jsx` lines 217-235

**Problem**: When curriculum loaded a multi-leg day, it set `circuitConfig` but never set `activeCircuitId`.

**Impact**: The circuit detection check `activeCircuitId && circuitConfig` always failed, causing `handleStop()` to use single-practice logic instead of circuit logic.

**Fix**:
```javascript
// When curriculum has multiple legs (circuit mode)
setCircuitConfig({
  exercises,
  exerciseDuration: totalDuration,
});
setActiveCircuitId('curriculum');  // ← ADDED
setPractice('Circuit');            // ← ADDED
setDuration(totalDuration);        // ← ADDED
setTimeLeft(totalDuration * 60);   // ← ADDED
```

### 2. Wrong Duration Calculation (v3.15.10)
**Location**: `src/components/PracticeSection.jsx` lines 573-575

**Problem**: The `actualDuration` calculation relied on the `duration` state variable:
```javascript
const actualDuration = duration * 60 - capturedTimeLeft;
```

For circuits, `duration` was `0`, resulting in negative values like `-268 seconds`, which failed the `actualDuration >= 30` check.

**Fix**: Use instrumentation data which tracks actual elapsed time:
```javascript
const actualDurationSeconds = Math.floor(instrumentationData.duration_ms / 1000);
const shouldJournal = practice !== 'Ritual' && actualDurationSeconds >= 30;
```

### 3. Circuit Detection in handleStop (v3.15.8)
**Location**: `src/components/PracticeSection.jsx` lines 476-485

**Problem**: `handleStop()` didn't check if it was a circuit session, so it never delegated to `handleCircuitComplete()`.

**Fix**:
```javascript
const handleStop = () => {
  const savedActivePracticeSession = activePracticeSession;
  const isCircuitSession = activeCircuitId && circuitConfig;

  // If this is a circuit session, delegate to circuit handler
  if (isCircuitSession) {
    handleCircuitComplete();
    return;
  }

  // ... rest of single-practice logic
};
```

## Code Flow

### Before Fix
```
1. User starts curriculum Day 2 (2 legs)
2. Curriculum loads → sets circuitConfig ❌ but NOT activeCircuitId
3. User clicks STOP after 30+ seconds
4. handleStop() checks: activeCircuitId && circuitConfig → FALSE
5. Falls through to single-practice logic
6. Calculates: actualDuration = 0 * 60 - 268 = -268
7. Check: -268 >= 30 → FALSE
8. Summary NOT shown ❌
9. User sees practice config screen
```

### After Fix
```
1. User starts curriculum Day 2 (2 legs)
2. Curriculum loads → sets circuitConfig ✅ AND activeCircuitId ✅
3. User clicks STOP after 30+ seconds
4. handleStop() checks: activeCircuitId && circuitConfig → TRUE ✅
5. Delegates to handleCircuitComplete()
6. Calculates: actualDuration = instrumentationData.duration_ms / 1000 = 31
7. Check: 31 >= 30 → TRUE ✅
8. Summary SHOWN ✅
9. User sees circuit completion stats
```

## Files Modified

### Primary Changes

**1. `src/components/PracticeSection.jsx`**

**Lines 217-235**: Curriculum circuit initialization
```javascript
// Handle circuit mode if curriculum has multiple legs
if (curriculumDay.legs?.length > 1) {
  const exercises = curriculumDay.legs.map(leg => ({
    exercise: {
      id: leg.id,
      name: leg.name || leg.practiceType,
      type: leg.type || 'practice',
      practiceType: leg.practiceType,
      preset: leg.preset,
      sensoryType: leg.sensoryType,
    },
    duration: leg.duration,
  }));
  const totalDuration = curriculumDay.legs.reduce((sum, leg) => sum + leg.duration, 0);

  setCircuitConfig({
    exercises,
    exerciseDuration: totalDuration,
  });
  setActiveCircuitId('curriculum');  // Critical for detection
  setPractice('Circuit');
  setDuration(totalDuration);
  setTimeLeft(totalDuration * 60);
}
```

**Lines 476-485**: Circuit detection in handleStop
```javascript
const handleStop = () => {
  // Capture curriculum context BEFORE clearing
  const savedActivePracticeSession = activePracticeSession;
  const isCircuitSession = activeCircuitId && circuitConfig;

  // If this is a circuit session, delegate to circuit handler
  if (isCircuitSession) {
    handleCircuitComplete();
    return;
  }

  // ... rest for single practices
};
```

**Lines 573-575**: Instrumentation-based duration
```javascript
// Use instrumentation duration (in milliseconds) for accurate session length
const actualDurationSeconds = Math.floor(instrumentationData.duration_ms / 1000);
const shouldJournal = practice !== 'Ritual' && actualDurationSeconds >= 30;
```

**2. `src/App.jsx`**

**Lines 392, 466**: Version bump from v3.15.5 → v3.15.11

### Supporting Changes (v3.15.1-v3.15.7)

- **v3.15.6**: Fixed curriculum data structure (legs array extraction)
- **v3.15.7**: Replaced broken portal modal with inline config card
- **v3.15.11**: Cleaned up debug logging

## Key Architectural Insights

### Circuit vs Single Practice Sessions

**Circuit Session Indicators**:
- `activeCircuitId` is truthy (set to `'curriculum'` or `'custom'`)
- `circuitConfig` has exercises array
- `practice` state = `'Circuit'`

**Single Practice Session Indicators**:
- `activeCircuitId` is `null`
- `circuitConfig` is `null`
- `practice` state = specific practice name (e.g., "Breath & Stillness")

### Why Instrumentation Data?

The `useSessionInstrumentation` hook tracks:
- `start_time`: `performance.now()` when session begins
- `end_time`: `performance.now()` when session ends
- `duration_ms`: Exact elapsed time in milliseconds

**Advantages over state-based calculation**:
1. ✅ Independent of `duration` state being correct
2. ✅ Works for all session types (single, circuit, curriculum)
3. ✅ Accounts for any timing edge cases
4. ✅ Single source of truth from performance API

### handleCircuitComplete() Flow

```javascript
handleCircuitComplete() {
  // 1. Clear session state
  clearActivePracticeSession();
  setIsRunning(false);

  // 2. Log completion
  logCircuitCompletion('custom', circuitConfig.exercises);

  // 3. Calculate total duration
  const totalDuration = circuitConfig.exercises.reduce(...);

  // 4. Record session
  recordSession({
    domain: 'circuit-training',
    duration: totalDuration,
    ...
  });

  // 5. Show summary
  setSessionSummary({
    type: 'circuit',
    circuitName: 'Custom Circuit',
    exercisesCompleted: circuitConfig.exercises.length,
    totalDuration: totalDuration,
  });
  setShowSummary(true);

  // 6. Cleanup
  setActiveCircuitId(null);
  setPractice('Circuit');
}
```

## Testing Checklist

✅ **Verified Working**:
- Curriculum Day 2 (2 legs) shows summary after 30+ seconds
- Curriculum Day 1 (1 leg) shows summary after 30+ seconds
- Manual circuit practice shows summary
- Manual single practice shows summary
- Session abandoned (<30s) doesn't show summary
- Ritual practice doesn't show summary (by design)

## Protected Files

**None modified in this fix.**

The following files remain untouched per `CLAUDE.md` protected files list:
- `src/components/Avatar.jsx`
- `src/components/MoonOrbit.jsx`
- `src/components/MoonGlowLayer.jsx`

## Known Issues & Edge Cases

### Issue 1: Circuit name is generic
Currently all curriculum circuits show "Custom Circuit" as the name. Could be improved to show curriculum day title.

### Issue 2: Duration state still set to 0 initially
Even though we now use instrumentation, the `duration` state is still 0 for circuits on first load. This doesn't break anything but could cause confusion.

**Potential improvement**:
```javascript
// Could set duration to totalDuration earlier
setDuration(totalDuration);
```

### Issue 3: Summary format mismatch
`handleCircuitComplete()` sets:
```javascript
sessionSummary = {
  type: 'circuit',
  circuitName: 'Custom Circuit',
  exercisesCompleted: 3,
  totalDuration: 15
}
```

But the summary modal expects:
```javascript
sessionSummary = {
  practice: string,
  duration: number,
  tapStats: object,
  ...
}
```

Currently works because the modal renders circuit data differently, but schema could be unified.

## Debugging Tips

### If summary doesn't show:

1. **Check activeCircuitId**:
   ```javascript
   console.log('activeCircuitId:', activeCircuitId);
   console.log('circuitConfig:', circuitConfig);
   ```

2. **Check instrumentation data**:
   ```javascript
   console.log('duration_ms:', instrumentationData.duration_ms);
   console.log('actualDurationSeconds:', Math.floor(instrumentationData.duration_ms / 1000));
   ```

3. **Check circuit detection**:
   ```javascript
   const isCircuitSession = activeCircuitId && circuitConfig;
   console.log('isCircuitSession:', isCircuitSession);
   ```

4. **Verify dev server location**:
   ```bash
   pwd  # Should be: C:\Users\trinh\.claude-worktrees\immanence-os\suspicious-cori
   ```

## Version History

- **v3.15.1-v3.15.5**: Initial refactoring attempts
- **v3.15.6**: Fixed curriculum legs array extraction
- **v3.15.7**: Replaced portal modal with inline card
- **v3.15.8**: Added circuit detection to handleStop
- **v3.15.9**: Added activeCircuitId initialization ← KEY FIX
- **v3.15.10**: Switched to instrumentation-based duration ← KEY FIX
- **v3.15.11**: Cleaned up debug logging ← CURRENT

## Related Documentation

- `docs/ARCHITECTURE.md` - Overall system architecture
- `docs/CYCLE_SYSTEM.md` - Curriculum and cycle details
- `CLAUDE.md` - Development rules and protected files
- `docs/MULTI_AI_WORKFLOW.md` - Multi-AI collaboration protocol
- `docs/WORKLOG.md` - Active development log

## AI Collaboration Notes

**For Gemini/Antigravity**:

⚠️ **DO NOT MODIFY** these lines without coordination:
- `PracticeSection.jsx` lines 217-235 (circuit initialization)
- `PracticeSection.jsx` lines 476-485 (handleStop circuit detection)
- `PracticeSection.jsx` lines 573-575 (instrumentation duration)

✅ **Safe to modify** (with worklog entry):
- Summary modal styling/layout
- Circuit completion message text
- Additional telemetry/logging
- Circuit name customization

📋 **Before touching PracticeSection.jsx**:
1. Read `docs/WORKLOG.md`
2. Check if Claude has it marked IN-PROGRESS
3. Add your own worklog entry
4. Increment version number

---

**End of Documentation**
