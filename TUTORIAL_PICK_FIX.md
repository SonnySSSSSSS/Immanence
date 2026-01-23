# Tutorial Pick Fix - Implementation Summary

## Problem
The Tutorial Pick feature in CoordinateHelper was always returning the tutorial scrim overlay instead of the underlying UI elements with `data-tutorial` attributes.

## Root Cause
While the CSS rule `html.tutorial-pick-mode [data-pick-ignore="true"]` was setting `pointer-events: none` on overlay elements, `document.elementsFromPoint()` still returns elements with `pointer-events: none` in the DOM stack.

## Solution Implemented

### 1. Stack-Scanning Algorithm (`CoordinateHelper.jsx`)
**Key Insight**: Instead of picking the first non-overlay element and then walking up for `data-tutorial`, we **scan the entire `elementsFromPoint()` stack** to find the first element that has a `data-tutorial` ancestor.

**Algorithm**:
1. Get all elements at click point via `document.elementsFromPoint(x, y)`
2. For each element in the stack (top to bottom):
   - Skip the pick overlay itself and marked overlay elements
   - Check if element or any ancestor has `data-tutorial` attribute
   - If found, return that element and its anchor
   - If not found, continue to next element in stack
3. Fallback: Return first non-overlay element even if no anchor found

**Why This Works**:
- Even if 2-3 overlays are stacked on top, underlying UI elements are still in the stack
- Naturally skips all overlays without complex filtering heuristics
- Resilient to DOM changes and new overlay types

### 2. Global Pick Mode Flag
Exposed `window.__TUTORIAL_PICK_ON__` flag:
- Set to `true` when Tutorial Pick mode is enabled
- Set to `false` when disabled
- Used by TutorialOverlay to disable pointer-events

### 3. TutorialOverlay Integration (`TutorialOverlay.jsx`)
- Added polling mechanism to detect `window.__TUTORIAL_PICK_ON__` changes
- Applied `pointerEvents: 'none'` style to scrim when pick mode is active
- Added `data-tutorial-overlay="true"` attribute for explicit filtering

### 4. Debug Instrumentation
Added detailed console logging when Tutorial Pick is active:
- Logs full element stack from `document.elementsFromPoint()`
- Shows tag, className, data attributes, position, and dimensions
- Helps verify what elements are being detected and skipped

## Files Modified

1. **[src/components/dev/CoordinateHelper.jsx](src/components/dev/CoordinateHelper.jsx)**
   - Replaced flawed "pick-then-walk" algorithm with stack-scanning approach
   - Added `findAnchor()` helper to check if element has `data-tutorial` ancestor
   - Enhanced with debug logging showing full element stack
   - Exposed `window.__TUTORIAL_PICK_ON__` global flag

2. **[src/components/tutorial/TutorialOverlay.jsx](src/components/tutorial/TutorialOverlay.jsx)**
   - Added `pickModeActive` state with polling
   - Applied dynamic `pointerEvents` style to scrim
   - Added `data-tutorial-overlay="true"` attribute

3. **[src/App.jsx](src/App.jsx)**
   - Incremented version to v3.25.28

## How to Test

### Test Case 1: Pick Without Tutorial Overlay
1. Open DevPanel (Ctrl+Shift+D or 🎨 button)
2. Enable "Tutorial Pick" checkbox
3. Click on an element with `data-tutorial` attribute (e.g., practice selector)
4. **Expected**: Console shows element stack, pick returns correct `anchorId`

### Test Case 2: Pick Through Tutorial Overlay
1. Start a tutorial (should show tutorial scrim overlay)
2. Open DevPanel and enable "Tutorial Pick"
3. Click on a UI element behind the scrim
4. **Expected**:
   - Console shows tutorial-scrim elements are being skipped
   - Pick returns the underlying element with `data-tutorial` attribute
   - HUD shows correct anchor ID and coordinates

### Test Case 3: Verify Debug Output
1. Enable Tutorial Pick mode
2. Click anywhere on the screen
3. Open browser console
4. **Expected**: See `[TutorialPick] elementsFromPoint` and `[TutorialPick] Stack:` logs
5. Verify that scrim elements are present in stack but filtered out

### Elements with data-tutorial Attributes
Known test targets:
- `[data-tutorial="practice-selector"]` - [PracticeSelector.jsx](src/components/PracticeSection/PracticeSelector.jsx)
- `[data-tutorial="tempo-sync-panel"]` - [TempoSyncPanel.jsx](src/components/TempoSyncPanel.jsx)

## Verification Commands

```bash
# Run linter (should pass)
npm run lint

# Build project (should succeed)
npm run build

# Start dev server
npm run dev
```

## Technical Details

### Algorithm Design: Stack Scanning vs Element Filtering
**Previous flawed approach**: Pick first non-overlay element → walk up for `data-tutorial`
- Problem: If that element doesn't have a `data-tutorial` ancestor, returns `null`
- Fails even when tutorial anchors exist deeper in the stack

**Correct approach**: Scan entire stack → find first element with `data-tutorial` ancestor
- Resilient: Works even if multiple overlays are stacked
- Natural: No complex heuristics needed for overlay detection
- Deterministic: Always finds the topmost tutorial anchor at click point

### Pointer Events vs DOM Stack
CSS `pointer-events: none` prevents click interactions but does NOT remove elements from `document.elementsFromPoint()` results. This is why stack scanning is required.

### Polling vs Event-Based
TutorialOverlay uses polling (100ms interval) to detect pick mode changes because:
- The flag is set on a different component (CoordinateHelper)
- Avoids complex cross-component event system
- 100ms latency is acceptable for dev tool UX

### Overlay Detection
The algorithm uses simple checks to skip known overlay elements:
- `[data-pick-ignore="true"]` - Explicit ignore markers
- `[data-tutorial-overlay="true"]` - Tutorial system overlays
- `.tutorial-scrim` - Tutorial scrim class
- Pick overlay itself (via ref check)

No complex heuristics needed - the stack-scanning approach naturally handles any overlay type.

## Future Improvements (Optional)
1. Replace polling with a shared Zustand store for pick mode state
2. Add visual indicator showing which element will be picked (hover preview)
3. Export pick history for easier tutorial authoring
4. Add keyboard shortcut to toggle pick mode (e.g., Ctrl+Shift+P)
