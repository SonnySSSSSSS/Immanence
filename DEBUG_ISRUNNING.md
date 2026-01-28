# Debug: Is isRunning Actually Being Changed?

## The Question

After applying the fix (`setIsRunning(false)` in `handleRitualReturn`), the COMPLETE button should:

1. Call handleReturnToDeck
2. Call handleRitualReturn
3. Set isRunning = false
4. Set activeRitual = null
5. PracticeSection re-renders
6. sessionView becomes null (since `isRunning ? ... : null`)
7. Practice menu appears

If this isn't happening, it's because either:
- **A**: isRunning never changes to false
- **B**: isRunning changes to false then immediately back to true
- **C**: A different state (like `showSummary` or something unknown) is hiding the menu

## How to Check

### Step 1: Open React DevTools
1. Press F12 to open browser console
2. Click "Components" tab in DevTools
3. Find `<PracticeSection>` component

### Step 2: Watch the State

Locate in the component tree:
- `isRunning` (should be true while in session)
- `activeRitual` (should be your ritual object)
- `showSummary` (should be false during ritual)
- `sessionSummary` (should be null during ritual)

### Step 3: Reproduce and Monitor

1. **Before pressing COMPLETE**: Note the state values
   - isRunning: true
   - activeRitual: {id: "...", ...}
   - showSummary: false
   - sessionSummary: null

2. **Click COMPLETE button**, watch the console:
   - Look for these logs in order:
     - `[RITUAL] COMPLETE button clicked`
     - `[RITUAL LIBRARY] handleReturnToDeck called`
     - `[PRACTICE SECTION] handleRitualReturn called`
     - `[PRACTICE SECTION] Exiting session surface by setting isRunning = false`

3. **After clicking**, check state changes in React DevTools:

   **Expected state changes (in order)**:
   ```
   Before:
   - isRunning: true
   - activeRitual: {id: "sankalpa", ...}
   - showSummary: false
   - sessionSummary: null

   ↓ (click COMPLETE)

   After:
   - isRunning: FALSE ✅ (changed!)
   - activeRitual: null ✅ (changed!)
   - showSummary: false (unchanged)
   - sessionSummary: null (unchanged)
   ```

   If this happens → **the fix works** and the issue is elsewhere

   If isRunning doesn't change → **the state update isn't firing**

   If isRunning changes then flips back → **an effect is re-triggering**

### Step 4: Check the UI

After state changes in DevTools:
- Do you see the practice menu (ritual cards)?
  - YES → **The fix works!** But something else is wrong in the render
  - NO → **Either isRunning didn't change, or another state is blocking the view**

## Possible Findings and Next Steps

### Finding A: isRunning never becomes false

**Symptom**: State doesn't update at all

**Cause**:
- `handleRitualReturn` isn't being called
- Or the state setter is broken
- Or React isn't re-rendering

**Check**:
1. Do you see log `[PRACTICE SECTION] handleRitualReturn called` in console?
   - NO → handleReturnToDeck didn't call onRitualReturn
   - YES → handleRitualReturn was called but setIsRunning(false) didn't work

2. If called but didn't work, check if there's an error:
   - Look for console errors during or after COMPLETE click
   - Check if setIsRunning is actually being called (add more logs if needed)

---

### Finding B: isRunning becomes false then true again

**Symptom**: State flips: `true → false → true`

**Cause**: An effect is listening to something and auto-resuming

**Most likely triggers**:
- An effect that watches `activeRitual` and auto-starts when it becomes null
- A localStorage auto-restore effect
- An effect that watches `practiceId` and re-starts sessions

**Where to look**:
```javascript
useEffect(() => {
  // If this effect runs when activeRitual becomes null, it might call handleStart()
  if (activeRitual) {
    // auto-start logic?
  }
}, [activeRitual])
```

**Fix**:
- Gate any "auto-resume" effects so they don't run during "user explicitly returned to deck"
- Example: `if (activeRitual && !isReturningToDeck) { handleStart() }`

---

### Finding C: isRunning changes correctly, but menu still doesn't appear

**Symptom**:
- Console shows all expected logs
- React DevTools shows isRunning = false
- But practice menu is still hidden

**Cause**: A different state is hiding the menu

Check these flags:
```javascript
showSummary = false?    // If true, summary modal is showing instead
sessionSummary = null?  // If not null, summary modal is showing
showSummaryModal = showSummary && sessionSummary  // Combined gate
// Line 2154: display: showSummaryModal || isRunning ? 'none' : 'flex'
```

**Most likely**: `showSummary = true` and `sessionSummary = {...}` → `showSummaryModal = true`

This would hide the menu even if `isRunning = false`

**Check**:
- In React DevTools, look for `showSummary` and `sessionSummary`
- If showSummary is true, where did it get set?
  - Ritual completion shouldn't call `setShowSummary(true)`
  - Only handleStop does that (if shouldJournal)
  - Did handleStop get called somehow?

**Fix**:
- In `handleRitualReturn`, also clear the summary:
  ```javascript
  setShowSummary(false);
  setSessionSummary(null);
  setIsRunning(false);
  setActiveRitual(null);
  ```

---

### Finding D: Practice menu appears but it's broken

**Symptom**: Menu appears but no ritual card, or can't click buttons

**Cause**: Some derived state or conditional rendering is wrong

**Check**:
- Is the ritual card showing in the practice menu?
- Can you select it?
- What do the logs show?

---

## Quick Reference: State Variables That Matter

```javascript
// Line 698
const [isRunning, setIsRunning] = useState(false);

// Line 678-679
const [showSummary, setShowSummary] = useState(false);
const [sessionSummary, setSessionSummary] = useState(null);

// Line 739
const [activeRitual, setActiveRitual] = useState(null);

// Line 633
const practice = selectedPractice.label; // Should be "Rituals"

// Line 1957
const showSummaryModal = showSummary && sessionSummary;

// Line 2154 - What actually hides/shows the practice menu
display: showSummaryModal || isRunning ? 'none' : 'flex'
```

---

## How to Report Findings

When you run this debug, report:

1. **Before COMPLETE click**:
   - What does the screen look like?
   - What's the state of isRunning, activeRitual, showSummary, sessionSummary?

2. **After COMPLETE click**:
   - Do you see the expected logs in console?
   - In React DevTools, what did isRunning change to?
   - What's the state of all four variables now?

3. **What happened to the screen**:
   - Did anything change?
   - If menu appeared, is it fully functional?

This will tell us exactly where the problem is.

