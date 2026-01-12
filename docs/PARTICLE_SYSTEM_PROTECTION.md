# Particle System Protection Pattern

## Critical Issue: Display Mode Switching

### The Problem

When users toggle between **Hearth mode (430px)** and **Sanctuary mode (820px)**, the IndrasNet particle canvas would resize. This caused visible particle stretching/shrinking because:

1. Canvas width changed from 430px → 820px (or vice versa)
2. Existing particles were already rendered at old dimensions
3. Canvas resize caused geometric distortion of particles
4. User would see stretched/compressed particles during transition

### The Solution: Three-Layer Protection System

We implemented a **defense-in-depth** approach with three complementary protection layers:

## Layer 1: Key-Based Remounting (Primary Protection)

**Location:** `src/components/IndrasNet.jsx` lines 68-94

```javascript
const [canvasKey, setCanvasKey] = useState(`canvas-${displayMode}-0`);

useEffect(() => {
    if (prevModeRef.current !== displayMode) {
        setOpacity(0); // Fade out

        setTimeout(() => {
            setCanvasKey(`canvas-${displayMode}-${Date.now()}`); // NEW KEY → React remounts
            prevModeRef.current = displayMode;
            initializedRef.current = false;
            particlesRef.current = [];

            requestAnimationFrame(() => setOpacity(1)); // Fade in
        }, 300);
    }
}, [displayMode]);
```

**How it works:**
- When `displayMode` changes, we generate a new React `key` for the canvas element
- React sees the key change and **completely unmounts the old canvas**
- A brand new canvas is mounted with correct dimensions
- No stretched particles can survive the unmount/remount cycle

**Why this is critical:**
- This is the **primary protection** - even if other layers fail, this ensures correctness
- React's reconciliation algorithm guarantees complete state reset on key change
- No way for old particles to persist into new canvas

## Layer 2: Fade Transition (Visual Polish)

**Location:** Same `useEffect` + CSS in canvas element (lines 252-256)

```javascript
style={{
    opacity: opacity,
    transition: "opacity 0.3s ease-in-out",
}}
```

**How it works:**
- Old canvas fades to `opacity: 0` over 300ms
- After fade completes, key changes → unmount/remount
- New canvas fades back to `opacity: 1`
- User sees smooth transition instead of abrupt change

**Why this matters:**
- Prevents jarring visual experience
- Masks the unmount/remount process
- Professional-grade UX

## Layer 3: Protected Initialization (Safety Net)

**Location:** `initParticles()` function (lines 107-130)

```javascript
function initParticles() {
    if (initializedRef.current) return; // ⚠️ Guard against double-init
    initializedRef.current = true;

    particlesRef.current = [];
    // ... create particles
}
```

**How it works:**
- `initializedRef` tracks whether particles have been created for this canvas mount
- Prevents duplicate initialization during canvas lifetime
- Resize handler only reinitializes if width changes by >50px

**Why this matters:**
- Prevents edge cases where React might trigger multiple effect runs
- Ensures particle count stays consistent
- Protects against developer errors in future modifications

---

## Testing Requirements

**Before ANY modification to IndrasNet.jsx, you MUST:**

### Manual Testing Checklist

1. **Rapid Mode Switching**
   - [ ] Toggle hearth → sanctuary → hearth → sanctuary 10 times rapidly
   - [ ] Verify particles maintain consistent size throughout
   - [ ] No stretching, squashing, or duplication visible

2. **Stage Transitions**
   - [ ] Test with each stage: Seedling, Ember, Flame, Beacon, Stellar
   - [ ] Verify color changes smoothly
   - [ ] Confirm particle behavior consistent across all stages

3. **Viewport Resize**
   - [ ] Resize browser window while in both modes
   - [ ] Particles should gracefully handle minor resizes
   - [ ] Major resizes (>50px change) should reinitialize cleanly

4. **Visual Inspection**
   - [ ] Check for smooth fade transitions (no flicker)
   - [ ] Verify no particle duplication or gaps
   - [ ] Confirm animation remains smooth at 60fps

### Automated Testing (Future)

Consider adding:
- Visual regression tests capturing particle canvas at different modes
- Performance tests ensuring 60fps during transitions
- Unit tests for particle count consistency

---

## Code Modification Guidelines

### ⚠️ DO NOT MODIFY WITHOUT EXTREME CARE

The following code sections are **protected patterns** - modifying them may reintroduce particle stretching:

1. **Canvas key prop** (line 250)
   ```javascript
   key={canvasKey} // ⚠️ DO NOT REMOVE
   ```

2. **displayMode useEffect** (lines 73-94)
   - Do not remove the setTimeout
   - Do not change the 300ms duration without updating CSS
   - Do not skip the key update

3. **initializedRef guard** (line 108)
   ```javascript
   if (initializedRef.current) return; // ⚠️ DO NOT REMOVE
   ```

4. **Opacity state + CSS transition** (lines 68, 252-256)
   - These must work together for smooth fade

### Safe Modifications

You CAN safely modify:
- Particle count (`particleCount` variable)
- Particle size (`FIXED_PARTICLE_SIZE` constant)
- Stage colors (`STAGE_PARTICLE_COLORS` object)
- Animation speed or behavior (within `draw()` function)
- Canvas height (currently 600px)

### If You Must Modify Protected Code

1. Read this entire document first
2. Understand WHY each layer exists
3. Test against the full checklist above
4. Have a rollback plan ready
5. Document your changes in this file

---

## Architecture Decision Records

### Why React keys instead of conditional rendering?

**Considered alternatives:**
- Conditional rendering: `{displayMode === 'hearth' ? <Canvas1/> : <Canvas2/>}`
  - ❌ Requires duplicate Canvas components
  - ❌ More complex code

- Force re-render with effect dependency: `useEffect(..., [displayMode])`
  - ❌ React may batch updates
  - ❌ Not guaranteed to fully remount

- Manual canvas.clear() on mode change
  - ❌ Doesn't reset internal React state
  - ❌ Still visible during resize

**Why keys won:**
- ✅ Leverages React's built-in reconciliation
- ✅ Guaranteed complete state reset
- ✅ Simplest implementation
- ✅ Future-proof (React team maintains this behavior)

### Why 300ms fade duration?

- Fast enough to feel responsive
- Slow enough to appear smooth (not abrupt)
- Matches standard animation durations in UI
- Gives time for canvas to fully remount before fading in

### Why >50px threshold for resize reinit?

- Avoids excessive reinitialization on minor resizes
- Covers the full hearth→sanctuary jump (390px difference)
- Small enough to catch significant browser resizes
- Balances performance vs correctness

---

## Related Files

- `src/components/IndrasNet.jsx` - Primary implementation
- `src/state/displayModeStore.js` - Display mode state management
- `src/App.jsx` - Passes displayMode prop to IndrasNet
- `CLAUDE.md` - Project-wide development guidelines

---

## Version History

- **v3.23.13** (2026-01-12): Initial three-layer protection system implemented
  - Added key-based remounting
  - Added fade transitions
  - Added protected initialization
  - Added comprehensive documentation

---

## Questions?

If you're unsure whether a change might break particle rendering:

1. Check if it touches any "⚠️ DO NOT MODIFY" sections
2. Run through the testing checklist
3. When in doubt, create a separate experimental branch
4. Test extensively before merging

**Remember:** This pattern exists because particle stretching was a persistent, user-visible bug. The three-layer approach ensures it never returns.
