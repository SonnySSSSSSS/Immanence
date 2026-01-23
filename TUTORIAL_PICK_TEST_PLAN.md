# Tutorial Pick - Testing & Verification Plan

## Pre-Test Setup

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open browser**: Navigate to http://localhost:5175/Immanence/

3. **Open DevTools Console**: Press F12 → Console tab (to view debug logs)

## Test Sequence

### Test 1: Basic Pick Without Tutorial Overlay ✓

**Goal**: Verify pick works on bare UI elements

**Steps**:
1. Press `Ctrl+Shift+D` or click 🎨 button to open DevPanel
2. Check the "Tutorial Pick" checkbox (should appear in bottom-right)
3. Cursor should change to crosshair
4. Click on the Practice Selector component

**Expected Results**:
- Console shows `[TutorialPick] elementsFromPoint at {x: ..., y: ...}`
- Console shows `[TutorialPick] Stack:` with array of elements
- Console shows `[TutorialPick]` with final pick object
- HUD tooltip appears at click point showing:
  - `x: ..., y: ...`
  - `anchor: practice-selector`
- Bottom-right panel shows "✓ Anchor: practice-selector"

**Pass Criteria**: `anchorId` is `"practice-selector"`, not `null`

---

### Test 2: Pick Through Tutorial Scrim (Main Fix) ✓

**Goal**: Verify pick can see through the tutorial overlay

**Steps**:
1. Close DevPanel if open
2. Navigate to a section with a tutorial (check if any tutorials exist)
3. Open a tutorial (if available) - should show dark scrim overlay
4. Press `Ctrl+Shift+D` to open DevPanel
5. Enable "Tutorial Pick"
6. Click on UI element visible behind the scrim (e.g., practice card)

**Expected Results**:
- Console `[TutorialPick] Stack:` shows tutorial-scrim elements in the stack
- Stack log shows `hasPickIgnore: "true"` for scrim elements
- Scrim elements are skipped, pick returns underlying element
- If underlying element has `data-tutorial`, `anchorId` is populated
- If no `data-tutorial` on underlying element, `anchorId` is null but `hit` shows the correct element (not the scrim)

**Pass Criteria**:
- `hit.className` does NOT contain "tutorial-scrim"
- `hit.className` does NOT contain "bg-black/60"
- Pick returns actual UI element behind scrim

---

### Test 3: Debug Instrumentation ✓

**Goal**: Verify debug logging provides useful information

**Steps**:
1. Enable Tutorial Pick
2. Click anywhere on screen
3. Open browser console
4. Examine `[TutorialPick] Stack:` output

**Expected Results**:
```javascript
[TutorialPick] elementsFromPoint at {x: 640, y: 360}
[TutorialPick] Stack: [
  {
    index: 0,
    tag: "DIV",
    className: "fixed inset-0 z-[999999] ...",
    id: null,
    hasPickIgnore: null,
    hasTutorial: null,
    computedPosition: "fixed",
    rect: { width: 1920, height: 1080 }
  },
  {
    index: 1,
    tag: "DIV",
    className: "tutorial-scrim",
    id: null,
    hasPickIgnore: "true",
    hasTutorial: null,
    computedPosition: "fixed",
    rect: { width: 1920, height: 1080 }
  },
  {
    index: 2,
    tag: "DIV",
    className: "practice-card ...",
    id: null,
    hasPickIgnore: null,
    hasTutorial: "practice-selector",
    computedPosition: "relative",
    rect: { width: 320, height: 240 }
  },
  // ... more elements
]
```

**Pass Criteria**:
- Stack shows all elements in correct z-order
- Attributes (`hasPickIgnore`, `hasTutorial`) are correctly logged
- Position and dimensions are shown for each element

---

### Test 4: Copy Pick JSON ✓

**Goal**: Verify pick data can be copied for tutorial authoring

**Steps**:
1. Enable Tutorial Pick
2. Click on element with `data-tutorial` attribute
3. Click "Copy pick JSON" button in bottom-right panel
4. Paste into text editor (Ctrl+V)

**Expected Results**:
```json
{
  "ts": 1737582400000,
  "coordSpace": "viewport",
  "x": 640,
  "y": 360,
  "anchorId": "practice-selector",
  "hit": {
    "tag": "DIV",
    "id": null,
    "className": "practice-card ..."
  },
  "anchorRect": {
    "left": 500,
    "top": 300,
    "width": 320,
    "height": 240
  }
}
```

**Pass Criteria**: Valid JSON with all expected fields

---

### Test 5: Multiple Filtering Strategies ✓

**Goal**: Verify all 5 filtering strategies work

**Test 5a: data-pick-ignore attribute**
- Element with `data-pick-ignore="true"` should be skipped
- Check: Tutorial scrim has this attribute

**Test 5b: .tutorial-scrim class**
- Element with class `tutorial-scrim` should be skipped
- Check: Tutorial overlay div has this class

**Test 5c: data-tutorial-overlay attribute**
- Element with `data-tutorial-overlay="true"` should be skipped
- Check: Tutorial scrim has this attribute (newly added)

**Test 5d: Full-screen heuristic**
- Fixed position element covering >90% of viewport should be skipped
- Check: Tutorial scrim is 100vw x 100vh, should trigger this rule

**Test 5e: Pick overlay itself**
- The CoordinateHelper's own overlay should be skipped
- Check: Pick overlay ref is correctly filtered out

**Pass Criteria**: All overlays are correctly skipped in all scenarios

---

### Test 6: Pointer Events Behavior ✓

**Goal**: Verify pointer-events toggling works correctly

**Steps**:
1. Open a tutorial (scrim visible)
2. Try clicking on UI behind scrim - should close tutorial
3. Enable Tutorial Pick
4. Try clicking on UI behind scrim - should NOT close tutorial, should pick element

**Expected Results**:
- **Pick OFF**: Scrim is clickable, closes tutorial
- **Pick ON**: Scrim has `pointer-events: none`, click passes through

**Pass Criteria**:
- Tutorial does not close when pick mode is active
- Pick successfully captures underlying element

---

### Test 7: Known Tutorial Anchors ✓

**Goal**: Verify all known `data-tutorial` elements can be picked

**Known anchors**:
- `data-tutorial="practice-selector"` in PracticeSelector.jsx
- `data-tutorial="tempo-sync-panel"` in TempoSyncPanel.jsx

**Steps**:
1. Enable Tutorial Pick
2. Click each element above
3. Verify `anchorId` matches expected value

**Pass Criteria**: Each anchor returns correct `anchorId`

---

### Test 8: Edge Cases ✓

**Test 8a: No data-tutorial attribute**
- Click element without `data-tutorial`
- Expected: `anchorId: null`, but `hit` shows the element

**Test 8b: Nested data-tutorial**
- Click child of element with `data-tutorial`
- Expected: Walk up tree to find nearest `data-tutorial` anchor

**Test 8c: Multiple overlays**
- Stack multiple overlays (tutorial + pick overlay + dev panel)
- Expected: All filtered correctly, returns bottom-most non-overlay element

**Test 8d: Pick mode toggle**
- Toggle pick mode on/off multiple times
- Expected: Global flag and pointer-events update correctly

---

## Console Verification Script

Paste this into browser console to manually test element stack:

```javascript
// Simulate pick at center of screen
const x = window.innerWidth / 2;
const y = window.innerHeight / 2;
const stack = document.elementsFromPoint(x, y);

console.log('Elements at center:', stack.map((n, idx) => ({
  index: idx,
  tag: n.tagName,
  className: typeof n.className === 'string' ? n.className : '',
  pickIgnore: n.getAttribute?.('data-pick-ignore'),
  tutorial: n.getAttribute?.('data-tutorial'),
  position: window.getComputedStyle(n).position,
  size: {
    w: Math.round(n.getBoundingClientRect().width),
    h: Math.round(n.getBoundingClientRect().height)
  }
})));

// Check global flag
console.log('Pick mode active:', window.__TUTORIAL_PICK_ON__);

// Check last pick result
console.log('Last pick:', window.__IMMANENCE_TUTORIAL_PICK__);
```

---

## Expected Before/After Comparison

### Before Fix ❌
```json
{
  "anchorId": null,
  "hit": {
    "className": "absolute inset-0 bg-black/60 backdrop-blur-sm"
  }
}
```

### After Fix ✅
```json
{
  "anchorId": "practice-selector",
  "hit": {
    "tag": "DIV",
    "id": null,
    "className": "practice-card glass-panel ..."
  },
  "anchorRect": {
    "left": 500,
    "top": 300,
    "width": 320,
    "height": 240
  }
}
```

---

## Troubleshooting

### Issue: Still hitting scrim
**Check**:
1. Scrim has `data-pick-ignore="true"` attribute
2. Scrim has `data-tutorial-overlay="true"` attribute
3. `window.__TUTORIAL_PICK_ON__` is `true`
4. Scrim style has `pointerEvents: 'none'`

### Issue: No debug logs
**Check**:
1. Tutorial Pick is enabled (checkbox checked)
2. Console is open and not filtered
3. `debugMode` parameter is `true` (default)

### Issue: anchorId is null but should be set
**Check**:
1. Element has `data-tutorial` attribute in JSX
2. Element is rendered in DOM (not `display: none`)
3. Check console stack - element should appear with `hasTutorial` value

---

## Sign-Off Checklist

- [ ] Test 1: Basic pick without overlay - PASS
- [ ] Test 2: Pick through tutorial scrim - PASS
- [ ] Test 3: Debug logs are detailed and useful - PASS
- [ ] Test 4: Copy pick JSON works - PASS
- [ ] Test 5: All filtering strategies work - PASS
- [ ] Test 6: Pointer events toggle correctly - PASS
- [ ] Test 7: Known anchors all return correct IDs - PASS
- [ ] Test 8: Edge cases handled - PASS
- [ ] Build succeeds (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Version incremented (v3.25.27)

---

## Files to Review

1. [CoordinateHelper.jsx](src/components/dev/CoordinateHelper.jsx) - Main fix
2. [TutorialOverlay.jsx](src/components/tutorial/TutorialOverlay.jsx) - Pointer events integration
3. [App.jsx](src/App.jsx) - Version bump
4. [TUTORIAL_PICK_FIX.md](TUTORIAL_PICK_FIX.md) - Implementation documentation
