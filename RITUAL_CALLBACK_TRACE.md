# Ritual System - Complete Callback Trace

## Scenario 1: Selecting a Ritual (When Working)

```
RitualSelectionDeck.jsx
  └─ User clicks ritual card
      │
      └─→ onSelectRitual(ritual)
          │
          └─→ PracticeSection.handleSelectRitual(ritual)
              │
              ├─ setActiveRitual(ritual)  ✅
              ├─ setCurrentStepIndex(0)   ✅
              ├─ setDuration(...)         ✅
              ├─ setTimeLeft(...)         ✅
              │
              └─ handleStart()
                  │
                  └─→ if (practiceId === "integration" && !activeRitual)
                      │
                      └─ alert("Please select a ritual...")
                         return;  ← ISSUE: Already selected, so this doesn't trigger
                      │
                      └─ setIsRunning(true)
                          │
                          └─→ PracticeSection renders with isRunning=true
                              │
                              └─→ SessionView shows NavigationRitualLibrary
                                  │
                                  └─→ NavigationRitualLibrary
                                      │
                                      └─ if (selectedRitual)  ← TRUE
                                          │
                                          └─→ Shows RitualSession.jsx
                                              │
                                              └─→ User sees ritual completion screen ✅
```

---

## Scenario 2: Clicking COMPLETE Button (Currently Broken ❌)

```
RitualSession.jsx - COMPLETE Button
  │
  └─ User clicks COMPLETE button (line 218)
      │
      ├─ console.log("[RITUAL] COMPLETE button clicked...")  ✓ LOGS APPEAR
      ├─ localStorage.setItem(...)  ✓ WORKS
      │
      └─ if (onComplete && typeof onComplete === 'function')
          │
          ├─→ YES: onComplete() is handleReturnToDeck
          │   │
          │   └─→ NavigationRitualLibrary.handleReturnToDeck() (line 19)
          │       │
          │       ├─ console.log("[RITUAL LIBRARY] handleReturnToDeck called...")  ✓ CHECK LOGS
          │       │
          │       └─ if (onRitualReturn && typeof onRitualReturn === 'function')
          │           │
          │           ├─→ YES: onRitualReturn() is handleRitualReturn
          │           │   │
          │           │   └─→ PracticeSection.handleRitualReturn() (line 1513)
          │           │       │
          │           │       ├─ console.log("[PRACTICE SECTION] handleRitualReturn called...")  ✓ CHECK LOGS
          │           │       │
          │           │       └─ setActiveRitual(null)  ← STATE UPDATE
          │           │           │
          │           │           └─ React re-renders PracticeSection
          │           │               │
          │           │               └─→ activeRitual is now null
          │           │                   │
          │           │                   └─→ NavigationRitualLibrary re-renders with selectedRitual=null
          │           │                       │
          │           │                       └─ if (selectedRitual)  ← FALSE NOW!
          │           │                           │
          │           │                           └─→ Shows RitualSelectionDeck ✅ EXPECTED BEHAVIOR
          │           │
          │           └─→ NO: onRitualReturn is not a function ❌ CRITICAL
          │               │
          │               └─ console.error("[RITUAL LIBRARY] ✗ CRITICAL: onRitualReturn is not available!")
          │                   │
          │                   └─→ Fallback: Call onComplete() to exit entirely
          │
          └─→ NO: onComplete is not a function ❌ CRITICAL
              │
              └─ console.error("[RITUAL] ✗ CRITICAL: onComplete is not a valid function!")
                  │
                  └─ NOTHING HAPPENS - Screen stays frozen on completion page
```

---

## Scenario 3: No Ritual Selected, Click BEGIN (Alert Should Show)

```
PracticeMenu.jsx
  │
  └─ User clicks "BEGIN PRACTICE" button (no ritual selected)
      │
      └─→ onStart={handleStart}
          │
          └─→ PracticeSection.handleStart() (line 1453)
              │
              ├─ getActualPracticeId(practiceId)
              │  └─ practiceId = "integration"
              │
              ├─ if (practiceId === "photic" ...)
              │  └─ FALSE, skip
              │
              └─→ if (practiceId === "integration" && !activeRitual)  ← KEY CHECK (line 1464)
                  │
                  ├─→ TRUE: No ritual selected ✓
                  │   │
                  │   ├─ console.warn("[PracticeSection] Cannot start ritual practice...")
                  │   ├─ alert("Please select a ritual before beginning practice.");  ← SHOULD APPEAR
                  │   │
                  │   └─ return;  ← STOPS EXECUTION
                  │       │
                  │       └─ ✅ User sees alert, session doesn't start
                  │
                  └─→ FALSE: Ritual IS selected ✓
                      │
                      └─→ Continue to setIsRunning(true)
                          │
                          └─ Session starts normally
```

---

## Debug Checklist

### When COMPLETE button doesn't work:

```
□ Check browser console (F12) for these EXACT logs in order:
  1. [RITUAL] COMPLETE button clicked at [timestamp]
  2. [RITUAL] ✓ Completion data saved to localStorage
  3. [RITUAL] onComplete function check:
     - exists: true
     - type: function
     - isFunction: true
  4. [RITUAL] 🎯 Executing onComplete callback...
  5. [RITUAL] ✓ onComplete executed successfully

□ If you see logs 1-5: The problem is in NavigationRitualLibrary
  → Look for [RITUAL LIBRARY] logs

□ Expected continuation logs:
  1. [RITUAL LIBRARY] handleReturnToDeck called
  2. [RITUAL LIBRARY] Current selectedRitual: [ritual-id]
  3. [RITUAL LIBRARY] onRitualReturn check:
     - exists: true
     - type: function
     - isFunction: true
  4. [RITUAL LIBRARY] ✓ Calling onRitualReturn to clear activeRitual
  5. [RITUAL LIBRARY] ✓ onRitualReturn executed

□ If you DON'T see [RITUAL LIBRARY] logs:
  → The callback from RitualSession never reached NavigationRitualLibrary
  → onComplete is broken

□ If you see [RITUAL LIBRARY] but not step 5:
  → The try/catch caught an error
  → Look for [RITUAL LIBRARY] ✗ Error in onRitualReturn

□ If [RITUAL LIBRARY] ✗ CRITICAL: onRitualReturn is not available:
  → The prop wasn't passed correctly from PracticeSection
  → This is the root cause

□ Expected final logs:
  1. [PRACTICE SECTION] handleRitualReturn called
  2. [PRACTICE SECTION] Clearing activeRitual via setActiveRitual(null)...
  3. [PRACTICE SECTION] ✓ setActiveRitual(null) executed
  4. React re-renders NavigationRitualLibrary
  5. if (selectedRitual) is FALSE
  6. RitualSelectionDeck is shown ✅
```

---

### When alert for "no ritual selected" doesn't show:

```
□ Check if practiceId is actually "integration"
  → Add console.log(practiceId) at start of handleStart

□ Check if activeRitual is null
  → Add console.log("activeRitual:", activeRitual) before the if check

□ Verify the validation code is being reached
  → Add console.log at line 1464 BEFORE the if statement

□ Try using a different alert method if standard alert() doesn't work:
  → Instead of alert(), set a state variable to show a modal/toast

□ Check if handleStart is being called at all
  → Add console.log at the very first line of handleStart
```

---

## Props Chain Verification

### Verify these props are passed correctly:

#### In PracticeSection.jsx (lines 1640-1646):
```javascript
<NavigationRitualLibrary
  onComplete={handleStop}           // ← Should be defined
  onNavigate={onNavigate}           // ← Should be defined
  selectedRitual={activeRitual}     // ← Should be null or ritual object
  onSelectRitual={handleSelectRitual}  // ← Should be defined
  onRitualReturn={handleRitualReturn}  // ← CRITICAL - must be defined
/>
```

**Verification**: Add to PracticeSection right before this JSX:
```javascript
if (practice === "Rituals") {
  console.log("[PROPS CHECK] Passing props to NavigationRitualLibrary:");
  console.log("  onComplete:", typeof handleStop);      // should be "function"
  console.log("  onRitualReturn:", typeof handleRitualReturn);  // should be "function"
  console.log("  selectedRitual:", activeRitual?.id);   // should be null or ritual id
  console.log("  onSelectRitual:", typeof handleSelectRitual);  // should be "function"
}
```

#### In NavigationRitualLibrary.jsx (lines 59-65):
```javascript
<RitualSession
  ritual={selectedRitual}
  onComplete={handleReturnToDeck}  // ← This MUST be passed
  onExit={handleReturnToDeck}
  isLight={isLight}
/>
```

**Verification**: Add to NavigationRitualLibrary:
```javascript
if (selectedRitual) {
  console.log("[RITUAL LIBRARY] Passing to RitualSession:");
  console.log("  ritual.id:", selectedRitual.id);
  console.log("  onComplete:", typeof handleReturnToDeck);  // should be "function"
}
```

---

## Root Cause Most Likely:

Based on the structure, the most common failures are:

1. **onRitualReturn is undefined** (50% probability)
   - Not passed from PracticeSection
   - Or passed as null/undefined

2. **onComplete is undefined in RitualSession** (30% probability)
   - Not being called correctly
   - Or the reference is lost

3. **selectedRitual is not being cleared** (15% probability)
   - setActiveRitual(null) isn't being called
   - Or React isn't re-rendering

4. **Alert is suppressed** (5% probability)
   - React dev environment suppresses native alert
   - Need to use modal/toast instead

---

## Next Steps for LLM

1. Run the verification console.log checks above
2. Take a screenshot of the console output when:
   - Clicking BEGIN with no ritual selected
   - Completing a ritual
3. Share the console logs
4. I can then identify the exact failure point

