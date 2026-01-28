# Ritual System - Code Locations Reference

## Quick Reference: Where Each Piece Lives

### 1. Alert Validation (No Ritual Selected)

**File**: `src/components/PracticeSection.jsx`
**Line**: 1464-1469
**Current Code**:
```javascript
if (practiceId === "integration" && !activeRitual) {
  console.warn("[PracticeSection] Cannot start ritual practice - no ritual selected");
  alert("Please select a ritual before beginning practice.");
  return;
}
```

**Status**: ❌ NOT WORKING - Alert not showing
**Why**: Unknown - might be:
- Called at wrong time
- activeRitual not synced
- alert() suppressed in dev

**Verification Needed**:
- Add `console.log("Checking ritual selection. practiceId:", practiceId, "activeRitual:", activeRitual)` at line 1463

---

### 2. COMPLETE Button Click Handler

**File**: `src/components/RitualSession.jsx`
**Line**: 217-262
**Current Code**:
```javascript
<button
  onClick={(e) => {
    console.log("[RITUAL] COMPLETE button clicked at", new Date().toISOString());
    e.stopPropagation();
    e.preventDefault();

    localStorage.setItem('immanenceOS.rituals.lastRitualId', ritual.id);
    localStorage.setItem('immanenceOS.rituals.lastRitualAt', new Date().toISOString());

    if (onComplete && typeof onComplete === 'function') {
      console.log("[RITUAL] 🎯 Executing onComplete callback...");
      try {
        onComplete();
        console.log("[RITUAL] ✓ onComplete executed successfully");
      } catch (error) {
        console.error("[RITUAL] ✗ Error executing onComplete:", error);
      }
    } else {
      console.error("[RITUAL] ✗ CRITICAL: onComplete is not a valid function!");
    }
  }}
>
  COMPLETE
</button>
```

**Status**: ⚠️ LOGS APPEAR BUT NO EFFECT
**Expected**: onComplete should call handleReturnToDeck
**Actual**: Button logs appear but nothing happens

**Verification**:
- Check console for `[RITUAL] COMPLETE button clicked` - if present, button is working
- Check console for `[RITUAL] 🎯 Executing onComplete callback...` - if present, callback exists
- If both appear, problem is in handleReturnToDeck

---

### 3. Return to Deck Handler

**File**: `src/components/NavigationRitualLibrary.jsx`
**Line**: 19-59
**Function**: `handleReturnToDeck()`
**Current Code**:
```javascript
const handleReturnToDeck = () => {
  console.log("[RITUAL LIBRARY] handleReturnToDeck called");

  if (onRitualReturn && typeof onRitualReturn === 'function') {
    console.log("[RITUAL LIBRARY] ✓ Calling onRitualReturn to clear activeRitual");
    try {
      onRitualReturn();
      console.log("[RITUAL LIBRARY] ✓ onRitualReturn executed");
    } catch (error) {
      console.error("[RITUAL LIBRARY] ✗ Error in onRitualReturn:", error);
    }
  } else {
    console.error("[RITUAL LIBRARY] ✗ CRITICAL: onRitualReturn is not available!");
    // Fallback to onComplete
    if (onComplete && typeof onComplete === 'function') {
      console.log("[RITUAL LIBRARY] ⚠ Falling back to onComplete");
      onComplete();
    }
  }
};
```

**Status**: ❌ NOT BEING CALLED - check console for `[RITUAL LIBRARY] handleReturnToDeck called`
**Expected**: Should call onRitualReturn
**Actual**: Either not being called, or onRitualReturn is undefined

**Verification**:
- Search console for `[RITUAL LIBRARY] handleReturnToDeck called`
- If NOT found: onComplete in RitualSession is not calling this function
- If found but no `onRitualReturn executed`: onRitualReturn is not a function
- If found `CRITICAL: onRitualReturn is not available`: Missing prop from PracticeSection

---

### 4. Parent State Update Handler

**File**: `src/components/PracticeSection.jsx`
**Line**: 1513-1523
**Function**: `handleRitualReturn()`
**Current Code**:
```javascript
const handleRitualReturn = () => {
  console.log("[PRACTICE SECTION] handleRitualReturn called");
  console.log("[PRACTICE SECTION] Current activeRitual:", activeRitual?.id || "null");

  try {
    setActiveRitual(null);
    console.log("[PRACTICE SECTION] ✓ setActiveRitual(null) executed");
  } catch (error) {
    console.error("[PRACTICE SECTION] ✗ Error setting activeRitual to null:", error);
  }
};
```

**Status**: ❌ NOT BEING CALLED - check console
**Expected**: Should set activeRitual to null
**Actual**: Unknown if being called at all

**Verification**:
- Search console for `[PRACTICE SECTION] handleRitualReturn called`
- If NOT found: handleReturnToDeck isn't calling onRitualReturn
- If found: This function is being called, next check if setActiveRitual is working

---

### 5. Props Passed from PracticeSection to NavigationRitualLibrary

**File**: `src/components/PracticeSection.jsx`
**Line**: 1640-1646
**Code**:
```javascript
<NavigationRitualLibrary
  onComplete={handleStop}
  onNavigate={onNavigate}
  selectedRitual={activeRitual}
  onSelectRitual={handleSelectRitual}
  onRitualReturn={handleRitualReturn}  // ← CRITICAL PROP
/>
```

**Status**: ⚠️ UNKNOWN - Need to verify these props are defined
**Critical Props**:
- `onComplete` = `handleStop` (should be defined at line ~1088)
- `onRitualReturn` = `handleRitualReturn` (should be defined at line ~1513)

**Verification**:
- Line 1637-1648: Check if practice === "Rituals"
- Verify onRitualReturn is passed as a prop

---

### 6. Rendering Logic - Conditional Display

**File**: `src/components/NavigationRitualLibrary.jsx`
**Line**: 57-119
**Code**:
```javascript
// When ritual IS selected
if (selectedRitual) {
  return (
    <RitualSession
      ritual={selectedRitual}
      onComplete={handleReturnToDeck}
      onExit={handleReturnToDeck}
      isLight={isLight}
    />
  );
}

// When ritual is NOT selected (null)
return (
  <div className="w-full max-w-2xl mx-auto px-4 py-8">
    {/* Ritual Library header */}
    <RitualSelectionDeck
      onSelectRitual={onSelectRitual}
      selectedRitualId={selectedRitual?.id}
    />
    {/* Return to Hub button */}
    <button onClick={onComplete}>Return to Hub</button>
  </div>
);
```

**Status**: ⚠️ Conditional render is correct, but setActiveRitual(null) might not trigger re-render
**Expected**: When activeRitual becomes null, show RitualSelectionDeck
**Actual**: Stays on completion screen

**Verification**:
- Check if React DevTools shows selectedRitual actually becoming null
- Monitor the if condition at line 57

---

### 7. Alert Fallback (Better UX)

**File**: `src/components/PracticeSection.jsx`
**Line**: 1464-1469
**Issue**: Native `alert()` might not work well
**Better Alternative**:
Instead of:
```javascript
alert("Please select a ritual before beginning practice.");
```

Use:
```javascript
// Option 1: Toast notification (if available)
// toast("Please select a ritual", "warning");

// Option 2: State-based modal
// setShowRitualRequiredError(true);

// Option 3: Console warning + console message
console.warn("NO RITUAL SELECTED - Ritual practice requires selection");
```

---

### 8. State Variables That Matter

**File**: `src/components/PracticeSection.jsx`

| Variable | Line | Type | Purpose |
|----------|------|------|---------|
| `practiceId` | 585 | string | "integration" for rituals |
| `activeRitual` | 739 | object\|null | Selected ritual |
| `isRunning` | 698 | boolean | Session active? |
| `practice` | 633 | string | Label of practiceId (should be "Rituals") |

**Initialization**:
```javascript
const initialPracticeId = savedPrefs.practiceId || 'breath';  // Line 576
const [practiceId, setPracticeId] = useState(initialPracticeId);  // Line 585
const [activeRitual, setActiveRitual] = useState(null);  // Line 739
```

---

### 9. Practice Registry Config

**File**: `src/components/PracticeSection/constants.js`
**Line**: 14-23
**Code**:
```javascript
integration: {
  id: "integration",
  label: "Rituals",  // ← This is what gets checked
  labelLine1: "INTEGRATION",
  labelLine2: "",
  icon: "◈",
  supportsDuration: false,
  configComponent: "RitualSelectionDeck",
  requiresFullscreen: false,
  alias: "ritual",
}
```

**Status**: ✅ CORRECT
**Verification**: This is not the issue

---

### 10. Ritual Selection Callback

**File**: `src/components/PracticeSection.jsx`
**Line**: 1501-1510
**Function**: `handleSelectRitual(ritual)`
**Code**:
```javascript
const handleSelectRitual = (ritual) => {
  localStorage.setItem('immanenceOS.rituals.defaultRitualId', ritual.id);
  setActiveRitual(ritual);
  setCurrentStepIndex(0);
  const totalSeconds = ritual.steps?.reduce((sum, s) => sum + (s.duration || 60), 0) || 600;
  setDuration(Math.ceil(totalSeconds / 60));
  setTimeLeft(totalSeconds);
  handleStart();  // ← IMMEDIATELY STARTS SESSION
};
```

**Status**: ✅ APPEARS TO WORK
**Note**: This immediately calls handleStart(), which is why validation needs to be early

---

## Console Log Trace Path

To debug, follow this path in console:

```
1. [RITUAL] COMPLETE button clicked at ___
   ↓ RitualSession.jsx line 219

2. [RITUAL] onComplete function check: exists: true, type: function
   ↓ RitualSession.jsx line 231

3. [RITUAL] 🎯 Executing onComplete callback...
   ↓ RitualSession.jsx line 237

4. [RITUAL] ✓ onComplete executed successfully
   ↓ RitualSession.jsx line 241

5. [RITUAL LIBRARY] handleReturnToDeck called
   ↓ NavigationRitualLibrary.jsx line 20

6. [RITUAL LIBRARY] onRitualReturn check: exists: true, type: function
   ↓ NavigationRitualLibrary.jsx line 23-25

7. [RITUAL LIBRARY] ✓ Calling onRitualReturn to clear activeRitual
   ↓ NavigationRitualLibrary.jsx line 28

8. [RITUAL LIBRARY] ✓ onRitualReturn executed
   ↓ NavigationRitualLibrary.jsx line 32

9. [PRACTICE SECTION] handleRitualReturn called
   ↓ PracticeSection.jsx line 1515

10. [PRACTICE SECTION] ✓ setActiveRitual(null) executed
    ↓ PracticeSection.jsx line 1521

11. React re-renders NavigationRitualLibrary
    selectedRitual is now null
    if (selectedRitual) at line 57 is FALSE

12. RitualSelectionDeck is displayed ✅
```

**If you don't see log #X**: That's where the problem is.

---

## Files Modified So Far

1. ✅ `src/components/PracticeSection.jsx` - Added alert validation
2. ✅ `src/components/RitualSession.jsx` - Added detailed logging
3. ✅ `src/components/NavigationRitualLibrary.jsx` - Added detailed logging
4. ✅ `src/App.jsx` - Version bumped to v3.25.62

---

## Summary for Next LLM

The ritual system has 3 main issues:

1. **Alert doesn't show** - Validation code exists but alert not visible
2. **COMPLETE button does nothing** - Callback chain breaks somewhere
3. **Need to find where callback fails** - Use console logs above

All the pieces are in place structurally. The issue is a broken callback or state update chain. The console logs will reveal exactly where.

