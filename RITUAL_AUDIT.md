# Ritual System Audit

## Overview
The ritual system has multiple disconnected parts that are not working correctly. This audit documents the entire flow and identifies the issues.

---

## 1. Component Hierarchy

```
App.jsx
  └── PracticeSection.jsx (practice.id = "integration")
      └── NavigationRitualLibrary.jsx
          ├── RitualSelectionDeck.jsx (when no ritual selected)
          └── RitualSession.jsx (when activeRitual exists)
              └── COMPLETE Button
```

---

## 2. Key State Variables in PracticeSection

### Location: `src/components/PracticeSection.jsx`

| State | Line | Type | Purpose |
|-------|------|------|---------|
| `practiceId` | 585 | string | Current practice ID ("integration" for rituals) |
| `activeRitual` | 739 | object\|null | Selected ritual object with id, name, steps[] |
| `isRunning` | 698 | boolean | Whether practice session is active |
| `practice` | 633 | string | Label of current practice ("Rituals" for integration) |

### Initialization
- `initialPracticeId = savedPrefs.practiceId || 'breath'` (line 576)
- `activeRitual = null` by default (line 739)

---

## 3. Navigation Flow When "BEGIN PRACTICE" is Clicked

### Current Broken Flow:

1. **User clicks "BEGIN PRACTICE" button** in PracticeMenu
2. **Calls `onStart`** → which is `handleStart()` (line 2157 in PracticeSection)
3. **handleStart()** (lines 1453-1497):
   - ✅ Validates photic practice
   - ✅ NOW validates ritual selection (NEW CODE at line 1464)
   - ❌ BUT: The validation check should trigger BEFORE `setIsRunning(true)`
   - ⚠️ **ISSUE**: `alert()` might not be showing because it's called AFTER state changes

### Validation Code Location
```javascript
// Line 1464-1469 in PracticeSection.jsx
if (practiceId === "integration" && !activeRitual) {
  console.warn("[PracticeSection] Cannot start ritual practice - no ritual selected");
  alert("Please select a ritual before beginning practice.");
  return; // ← Should stop execution here
}
```

**PROBLEM**: This check happens AFTER other initialization. Need to verify the order.

---

## 4. COMPLETE Button Connection Chain

### Step 1: RitualSession.jsx (lines 217-262)
**File**: `src/components/RitualSession.jsx`
**Component**: RitualSession
**Props Received**:
```javascript
const RitualSession = ({ ritual, onComplete, onExit, isLight = false })
```

**When COMPLETE button clicked** (line 218):
```javascript
onClick={(e) => {
  // ... validation logs ...
  if (onComplete && typeof onComplete === 'function') {
    onComplete(); // ← CALLS: handleReturnToDeck in NavigationRitualLibrary
  }
}
```

### Step 2: NavigationRitualLibrary.jsx (lines 59-64)
**File**: `src/components/NavigationRitualLibrary.jsx`
**Component**: NavigationRitualLibrary
**Props Received**:
```javascript
export function NavigationRitualLibrary({
  onComplete,           // handleStop from PracticeSection
  onNavigate,           // from parent
  selectedRitual,       // activeRitual from PracticeSection
  onSelectRitual,       // handleSelectRitual from PracticeSection
  onRitualReturn        // handleRitualReturn from PracticeSection ← KEY CALLBACK
})
```

**Passes to RitualSession**:
```javascript
<RitualSession
  ritual={selectedRitual}
  onComplete={handleReturnToDeck}  // ← Line 61
  onExit={handleReturnToDeck}      // ← Line 62
  isLight={isLight}
/>
```

**handleReturnToDeck()** (lines 19-59):
```javascript
const handleReturnToDeck = () => {
  if (onRitualReturn && typeof onRitualReturn === 'function') {
    onRitualReturn();  // ← CALLS: handleRitualReturn in PracticeSection
  }
  // ... fallback logic ...
}
```

### Step 3: PracticeSection.jsx - handleRitualReturn (lines 1513-1523)
**File**: `src/components/PracticeSection.jsx`
**Function**: handleRitualReturn
```javascript
const handleRitualReturn = () => {
  console.log("[PRACTICE SECTION] handleRitualReturn called");
  setActiveRitual(null);  // ← SHOULD return to RitualSelectionDeck
}
```

**Problem**:
- ❓ Does React re-render NavigationRitualLibrary when `selectedRitual` becomes null?
- ❓ Does NavigationRitualLibrary check `if (selectedRitual)` to show RitualSelectionDeck?

---

## 5. NavigationRitualLibrary Rendering Logic

### Location: `src/components/NavigationRitualLibrary.jsx` (lines 57-119)

```javascript
if (selectedRitual) {
  // SHOW RITUAL SESSION
  return (
    <RitualSession
      ritual={selectedRitual}
      onComplete={handleReturnToDeck}
      onExit={handleReturnToDeck}
      isLight={isLight}
    />
  );
}

// SHOW SELECTION DECK (when selectedRitual is null)
return (
  <div className="w-full max-w-2xl mx-auto px-4 py-8">
    {/* Ritual Library header and deck */}
    <RitualSelectionDeck ... />
  </div>
);
```

**Expected Behavior**:
1. User finishes ritual, presses COMPLETE
2. onComplete → handleReturnToDeck
3. handleReturnToDeck → onRitualReturn
4. onRitualReturn → setActiveRitual(null)
5. activeRitual becomes null in PracticeSection state
6. NavigationRitualLibrary re-renders
7. `if (selectedRitual)` is FALSE
8. RitualSelectionDeck is shown ✅

**Actual Result**: ❌ Nothing happens

---

## 6. Possible Root Causes

### Issue A: handleSelectRitual Not Called
**Location**: `src/components/PracticeSection.jsx` (lines 1501-1510)

```javascript
const handleSelectRitual = (ritual) => {
  localStorage.setItem('immanenceOS.rituals.defaultRitualId', ritual.id);
  setActiveRitual(ritual);
  setCurrentStepIndex(0);
  const totalSeconds = ritual.steps?.reduce((sum, s) => sum + (s.duration || 60), 0) || 600;
  setDuration(Math.ceil(totalSeconds / 60));
  setTimeLeft(totalSeconds);
  handleStart();  // ← IMMEDIATELY STARTS
}
```

**ISSUE**: When user selects a ritual from deck, it immediately calls `handleStart()`. This bypasses the normal "isRunning" state setup for ritual mode.

### Issue B: Practice Type Label Mismatch
- **practiceId**: "integration"
- **practice label**: "Rituals"
- **Check line 1637**: `if (practice === "Rituals")`

**Question**: Is the label correctly set to "Rituals" for integration practice?
**Answer**: Yes (see `src/components/PracticeSection/constants.js` line 16):
```javascript
integration: {
  id: "integration",
  label: "Rituals",  // ← Correct
}
```

### Issue C: Alert Not Showing
**Location**: `src/components/PracticeSection.jsx` (line 1467)

```javascript
if (practiceId === "integration" && !activeRitual) {
  alert("Please select a ritual before beginning practice.");
  return;
}
```

**Why it might not work**:
1. React may not render the DOM when alert() is called
2. The check might be in the wrong place in the execution order
3. Need to verify this runs BEFORE `setIsRunning(true)`

---

## 7. Data Flow for Ritual Selection

### RitualSelectionDeck.jsx
**Location**: `src/components/RitualSelectionDeck.jsx`
**Props**: `onSelectRitual`, `selectedRitualId`

When user clicks a ritual card:
```javascript
onSelectRitual(selectedRitual)  // ← Calls handleSelectRitual in PracticeSection
```

This triggers:
1. setActiveRitual(ritual) ← Updates PracticeSection state
2. handleStart() ← Starts the ritual session
3. setIsRunning(true) ← Shows RitualSession

---

## 8. Props Chain for COMPLETE Button

| Component | Props Passed | To | For |
|-----------|--------------|----|----|
| PracticeSection | onComplete={handleStop} | NavigationRitualLibrary | Exit ritual mode |
| PracticeSection | onRitualReturn={handleRitualReturn} | NavigationRitualLibrary | Return to deck |
| NavigationRitualLibrary | onComplete={handleReturnToDeck} | RitualSession | COMPLETE button |
| RitualSession | clicks COMPLETE | calls onComplete() | = handleReturnToDeck() |

---

## 9. Alert Validation Check - Detailed Flow

### Check Location
**File**: `src/components/PracticeSection.jsx`
**Lines**: 1464-1469
**Trigger**: When `handleStart()` is called

### Current Code
```javascript
const handleStart = (durationOverrideSec = null) => {
  const actualPracticeId = getActualPracticeId(practiceId);

  if (practiceId === "photic" || actualPracticeId === "photic") {
    onOpenPhotic?.();
    return;
  }

  // NEW VALIDATION (Line 1464)
  if (practiceId === "integration" && !activeRitual) {
    console.warn("[PracticeSection] Cannot start ritual practice - no ritual selected");
    alert("Please select a ritual before beginning practice.");
    return;  // ← SHOULD STOP HERE
  }

  setIsStarting(true);  // Line 1468+
  // ... rest of initialization
}
```

### Problem Areas
1. **Alert might not work in development mode** - React might suppress it
2. **Timing issue**: If `handleStart` is called during render, alert might not fire
3. **State sync issue**: `activeRitual` might not be updated yet when `handleStart` is called

---

## 10. Critical Questions to Resolve

### For the Next LLM:

1. **Does the alert show when no ritual is selected?**
   - If NO: The validation logic is broken
   - If YES: But you still see the deck: The issue is elsewhere

2. **Can you click a ritual and start it?**
   - If YES: `handleSelectRitual` works correctly
   - If NO: RitualSelectionDeck isn't calling the callback

3. **When you complete a ritual, what screen do you see?**
   - Blank screen: `selectedRitual` isn't being cleared
   - Ritual deck again: Everything works
   - Stuck on completion screen: `handleReturnToDeck` isn't calling `onRitualReturn`

4. **Check browser console for these logs**:
   - `[RITUAL] COMPLETE button clicked at` - Verify button is clickable
   - `[RITUAL LIBRARY] handleReturnToDeck called` - Verify callback chain starts
   - `[PRACTICE SECTION] handleRitualReturn called` - Verify parent state update
   - `setActiveRitual(null) executed` - Verify state actually changes

---

## 11. Files to Review

### Core Ritual Files:
1. `src/components/PracticeSection.jsx` - Main orchestrator
   - Line 585: practiceId state
   - Line 739: activeRitual state
   - Line 1464: Alert validation
   - Line 1501: handleSelectRitual
   - Line 1513: handleRitualReturn
   - Line 1637: Ritual render check

2. `src/components/NavigationRitualLibrary.jsx` - Navigation controller
   - Line 57: selectedRitual check for render
   - Line 59-65: RitualSession render
   - Line 69-119: RitualSelectionDeck render
   - Line 19-59: handleReturnToDeck logic

3. `src/components/RitualSession.jsx` - Completion screen
   - Line 217-262: COMPLETE button
   - Line 228: localStorage save
   - Line 240: onComplete() call

4. `src/components/RitualSelectionDeck.jsx` - Ritual selection
   - Ritual card click handlers
   - onSelectRitual callback

5. `src/components/PracticeSection/constants.js` - Constants
   - Line 14-23: Integration practice config
   - Label should be "Rituals"

---

## 12. Known Working Code Patterns

### Similar pattern that DOES work: Circuit Mode
```javascript
// Compare how circuit mode handles completion
// and see if ritual mode should follow the same pattern
```

### Other state cleanup patterns
Look for examples of how other practices clear their state when returning to menu.

---

## Summary

**The Complete Button Issue** appears to be a callback chain problem:
- COMPLETE button → RitualSession → NavigationRitualLibrary → PracticeSection
- Somewhere in this chain, the callback isn't firing properly
- Console logs should reveal exactly where it breaks

**The Alert Issue** is likely:
- Alert() might not work in React dev environment
- Or the check isn't being reached at all
- Or activeRitual state isn't synced properly at check time

