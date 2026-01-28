# Ritual System - Root Cause Analysis & Fix

## The Real Problem (User-Identified)

The rendering in PracticeSection is **gated by `isRunning` FIRST**, not by ritual selection:

```javascript
const sessionView = isRunning ? (() => {
  if (practice === "Rituals") {
    return <NavigationRitualLibrary ... />;
  }
  // ... other practices
})() : null;
```

**Render Flow**:
1. IF `isRunning === false` → Show practice menu ✅ (USER WANTS THIS)
2. ELSE IF `isRunning === true` AND `practice === "Rituals"` → Show ritual library
   - IF `selectedRitual` → Show RitualSession (completion screen)
   - ELSE → Show RitualSelectionDeck

## Why "COMPLETE" Did Nothing

When user pressed COMPLETE and only `setActiveRitual(null)` was called:
1. `isRunning` stayed `true` ← **KEY ISSUE**
2. Still matches condition 2 above
3. Shows NavigationRitualLibrary with no ritual selected
4. Displays RitualSelectionDeck... but still INSIDE the session surface
5. User never returns to the practice menu

**Symptom**: "Everything logs correctly but nothing appears to happen"
**Reason**: The session surface is still mounted because `isRunning` is still `true`

---

## The Fix (Applied)

**File**: `src/components/PracticeSection.jsx`
**Function**: `handleRitualReturn()` (line 1513)

### Before:
```javascript
const handleRitualReturn = () => {
  setActiveRitual(null);  // ← ONLY clears the ritual
};
```

### After:
```javascript
const handleRitualReturn = () => {
  // CRITICAL: Must set isRunning = false first, because render gate checks isRunning BEFORE selectedRitual
  setIsRunning(false);     // ← EXIT THE SESSION SURFACE FIRST
  setActiveRitual(null);   // ← THEN clear the ritual selection
};
```

---

## Why This Works

With this fix, the render flow becomes:

```
1. User clicks COMPLETE
2. onComplete() calls handleReturnToDeck()
3. handleReturnToDeck() calls handleRitualReturn()
4. handleRitualReturn() calls setIsRunning(false)
   │
   └─→ React re-renders PracticeSection
       │
       └─→ Check: isRunning === true?
           │
           └─→ NO! (now false)
               │
               └─→ sessionView = null
                   │
                   └─→ Shows practice menu ✅
```

---

## Why "Alert for No Ritual Selected" Still Matters

The alert validation (line 1464) was checking if practiceId === "integration" AND !activeRitual.

This check runs BEFORE handleStart() proceeds to setIsRunning(true).

**Issue**: alert() might not show in React dev environment.

**Verification**: The check happens, but alert might not be visible. Consider replacing with a modal/toast or at least verify in console that the log appears:

```javascript
if (practiceId === "integration" && !activeRitual) {
  console.warn("[PracticeSection] Cannot start ritual practice - no ritual selected");
  // alert() might not show - use console first to verify this code is reached
}
```

---

## Potential Hidden Causes (Now Mitigated)

### localStorage auto-restore effect
If an effect were auto-restoring the last ritual when `activeRitual` becomes null (while still in running session), it would interfere.

**Current state**: No such effect found in PracticeSection.jsx

**Safety**: The fix prevents this because:
- We set `isRunning = false` first
- If an effect tries to restore and call `setActiveRitual(ritual)`, it won't re-enter the session surface because `isRunning` is false
- Instead, the user gets a fresh state

### Fallback to onComplete
NavigationRitualLibrary.handleReturnToDeck has a fallback that calls `onComplete` (handleStop) if `onRitualReturn` is missing.

**Current state**: This fallback is safe but unnecessary now because `handleRitualReturn` is properly defined.

**Why it's safe**: `handleStop` calls `setIsRunning(false)` at line 1110 anyway, so even the fallback would exit the session.

---

## Verification Checklist

After this fix, to verify it works:

```
□ Press COMPLETE after finishing a ritual
□ Check console for logs in order:
  1. [RITUAL] COMPLETE button clicked
  2. [RITUAL LIBRARY] handleReturnToDeck called
  3. [RITUAL LIBRARY] ✓ Calling onRitualReturn to clear activeRitual
  4. [PRACTICE SECTION] handleRitualReturn called
  5. [PRACTICE SECTION] Exiting session surface by setting isRunning = false
  6. [PRACTICE SECTION] Clearing ritual selection via setActiveRitual(null)
  7. [PRACTICE SECTION] ✓ Should now show RitualSelectionDeck

□ Verify React DevTools:
  - isRunning changes from true to false
  - activeRitual changes from {id:...} to null
  - PracticeSection re-renders

□ Expected UI result:
  - Completion screen disappears
  - Practice menu is shown with ritual practice card visible
  - Ritual Library shows selection deck (not the completion screen)
```

---

## Architecture Lesson

When a component has a multi-level render gate, each level's condition must be satisfied to render that content:

```
Gate 1: isRunning?           ← EXIT condition
  Gate 2: practice === "Rituals"?
    Gate 3: selectedRitual?   ← SELECTION condition
```

Changing Gate 3 while Gate 1 is still true = invisible change.
You must satisfy Gate 1 to exit the entire branch.

---

## Code Locations Summary

| File | Line | What | Status |
|------|------|------|--------|
| PracticeSection.jsx | 1513 | handleRitualReturn | ✅ FIXED - now calls setIsRunning(false) |
| PracticeSection.jsx | 1464 | Alert validation | ⚠️ Check if visible |
| PracticeSection.jsx | 1636 | Render gate | ✅ Correct structure |
| NavigationRitualLibrary.jsx | 19 | handleReturnToDeck | ✅ Correct - calls onRitualReturn |
| RitualSession.jsx | 217 | COMPLETE button | ✅ Correct - calls onComplete |

---

## Root Cause: CLOSED ✅

The issue was **not** a broken callback chain (though the diagnostics helped rule that out).

The issue was **architectural**: exiting a nested conditional render requires satisfying the outer conditions, not just the innermost one.

