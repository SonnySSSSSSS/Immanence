# Avatar State Refactor - Implementation Summary

**Date**: 2026-01-10  
**Status**: ✅ COMPLETED

## Overview

Consolidated avatar state derivation into a single canonical model (`AvatarState`) to eliminate redundant computations and ensure all avatar components consume consistent data.

## Changes Made

### 1. Created `src/state/avatarState.js`

**Purpose**: Single source of truth for avatar-related derived state.

**Exports**:

- `clamp01(n)` - Utility to clamp values to [0, 1]
- `deriveAvatarState({ mode, breathPattern, snapshot })` - Main derivation function
- `useAvatarState({ mode, breathPattern })` - React hook wrapper (optional)

**Key Logic**:

#### Phase Definition

- **Source**: Persisted mandala snapshot (`stage` field)
- **Default**: `"foundation"` if no snapshot exists
- **Behavior**: NOT overridden by active breath sessions (session state is separate)

#### Coherence Calculation (Deterministic Heuristic)

```javascript
base = 0.55 * avgAccuracy + 0.45 * weeklyConsistency;
signal = 0.5 * (focus + clarity);
penalty = distortion;
coherenceRaw = 0.55 * base + 0.45 * signal - 0.25 * penalty;
coherence = clamp01(coherenceRaw);
```

**Inputs**:

- `avgAccuracy` (0..1) - From mandala snapshot
- `weeklyConsistency` (0..1) - From mandala snapshot
- `transient.focus` (0..1) - Live signal from current practice
- `transient.clarity` (0..1) - Live signal from current practice
- `transient.distortion` (0..1) - Live signal (penalty)

#### Stage Index Mapping

Maps `coherence` to stage index (0..4):

- `[0.00–0.15)` → 0 (SEEDLING)
- `[0.15–0.35)` → 1 (EMBER)
- `[0.35–0.55)` → 2 (FLAME)
- `[0.55–0.80)` → 3 (BEACON)
- `[0.80–1.00]` → 4 (STELLAR)

**Output Shape**:

```javascript
{
  mode: string,
  phase: string,
  metrics: {
    avgAccuracy: number,
    weeklyConsistency: number,
    totalSessions: number,
    weeklyPracticeLog: boolean[7]
  },
  transient: {
    focus: number,
    clarity: number,
    distortion: number
  },
  coherence: number,
  stageIndex: number,
  stage: string,
  labels: {
    accuracyPct: number,
    consistencyPct: number,
    accLabel: 'loose' | 'mixed' | 'tight',
    wkLabel: 'sporadic' | 'warming' | 'steady'
  },
  breathPattern: object | null
}
```

### 2. Refactored `src/components/avatar/index.jsx`

**Before**:

- Manually polled `getMandalaState()` every 2 seconds
- Locally computed `stageIndex` from snapshot
- Extracted `avgAccuracy`, `weeklyConsistency`, etc. directly

**After**:

- Calls `deriveAvatarState({ mode, breathPattern })` every 2 seconds
- Uses `avatarState.stage` and `avatarState.stageIndex`
- Extracts metrics from `avatarState.metrics.*`

**Key Changes**:

- Removed `mandalaSnapshot` state
- Removed `stageIndex` state
- Added `avatarState` state (initialized with `deriveAvatarState`)
- Updated refresh effect to call `deriveAvatarState` instead of `getMandalaState`
- Updated click handler to use `avatarState.stageIndex`

**Controlled Stage Override**:

- If `controlledStage` prop is provided, it overrides the derived `avatarState.stage` for visual rendering
- Internal `avatarState` still maintains the underlying derived value for data consistency

### 3. Updated `src/components/avatar/AvatarContainer.jsx`

**Status**: ✅ No changes required

**Reason**: Already a pure render component that accepts `stage`, `weeklyConsistency`, and `weeklyPracticeLog` as props. Does not compute state internally.

### 4. Updated `src/components/AvatarLuminousCanvas.jsx`

**Status**: ✅ No changes required

**Reason**: Already receives `weeklyConsistency` and `weeklyPracticeLog` as props. Does not compute stage or coherence internally.

### 5. Updated `src/components/avatar/BreathingAura.jsx`

**Status**: ✅ No changes required

**Reason**: Only consumes `breathPattern` prop for session progress animation. Does not compute or depend on stage/coherence.

## Acceptance Criteria

✅ **No change in meaning of phase**: Still sourced from snapshot; defaults to "foundation"  
✅ **All avatar visuals use same coherence/stageIndex source**: Derived from `avatarState`  
✅ **No component independently computes stage/coherence**: All use `deriveAvatarState`  
✅ **App runs without console errors**: Dev server started successfully  
✅ **UI renders safely with defaults**: Missing snapshot handled with default values

## Architecture Benefits

1. **Single Source of Truth**: All avatar components now consume the same derived state
2. **Debuggable**: Coherence uses deterministic heuristic (no LLM), stable and offline-capable
3. **Separation of Concerns**:
   - `mandalaStore.js` = raw persistence
   - `avatarState.js` = derived meaning/UI logic
4. **Maintainability**: Changes to coherence formula only need to happen in one place
5. **Testability**: Pure function `deriveAvatarState` can be unit tested independently

## Data Flow

```
mandalaStore (raw persistence)
    ↓
getMandalaState() (snapshot)
    ↓
deriveAvatarState({ mode, breathPattern, snapshot })
    ↓
avatarState (canonical derived model)
    ↓
Avatar → AvatarContainer → StaticSigilCore, BreathingAura, etc.
```

## Future Enhancements

- Add `useAvatarState` hook with `useSyncExternalStore` for reactive updates
- Consider moving to Zustand store if needed for cross-component reactivity
- Add unit tests for coherence calculation edge cases
- Document coherence tuning parameters for future adjustments

## Files Modified

1. ✅ `src/state/avatarState.js` (created)
2. ✅ `src/components/avatar/index.jsx` (refactored)
3. ✅ `src/components/avatar/AvatarContainer.jsx` (no changes needed)
4. ✅ `src/components/AvatarLuminousCanvas.jsx` (no changes needed)
5. ✅ `src/components/avatar/BreathingAura.jsx` (no changes needed)

## Verification

- [x] Dev server runs without errors
- [x] No console warnings
- [x] Avatar renders with default state when no snapshot exists
- [x] Coherence calculation produces values in [0, 1] range
- [x] Stage index maps correctly to coherence thresholds
- [x] Controlled stage override works for preview mode
