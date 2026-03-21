# PROBE: Light Mode Practice UI Layer Ownership

**Date:** 2026-03-21
**Purpose:** Prove which rendering layers (CSS vs JSX props vs inline styles vs SVG attributes) own the active-state, button, ring, capsule, and avatar surfaces in light mode.

**Hypothesis:** The four suspected CSS-owned surfaces (`.btn-glow`, breathing ring SVG, `.glass-capsule`, avatar) are controlled by CSS files in the allowlist. Proof: unmistakable test changes will be visible in a screenshot taken with light mode enabled.

**Contrapositive (FAIL):** If any probe change is invisible in the screenshot, that layer is not controlled by the probed CSS selector/path and requires ownership investigation.

---

## Probe Changes (Reversible, Unmistakable)

### Change 1: Button Hover State
**File:** `src/immanence.css`
**Anchor:** Locate the existing rule block `.light-mode .btn-glow:hover` (current lines ~470–475)
**Action:** Add this rule immediately after that block:

```css
/* PROBE:LIGHT_MODE:BUTTON:START */
.light-mode .btn-glow {
  border: 3px dashed magenta !important;
}
/* PROBE:LIGHT_MODE:BUTTON:END */
```

**Question answered:** Is `.btn-glow` element controlled by CSS in `src/immanence.css`?
**Expected:** Begin/Resume button displays magenta dashed border in light mode (persistent, not transient).
**If invisible:** Button styling may be overridden by JSX className or inline style; requires investigation.

**Note on probe durability:** Using base `.btn-glow` (not `:active`) ensures proof is visible in static screenshots without requiring precise interaction timing.

---

### Change 2: Breathing Ring Stroke
**File:** `src/immanence.css`
**Anchor:** Locate the SVG section (current lines ~425–450)
**Action:** Add this rule at the end of the SVG section:

```css
/* PROBE:LIGHT_MODE:RING:START */
.light-mode svg circle,
.light-mode svg path {
  stroke: lime !important;
  stroke-width: 2px !important;
}
/* PROBE:LIGHT_MODE:RING:END */
```

**Question answered:** Is breathing ring stroke controlled by CSS selectors `svg circle` and `svg path` in `src/immanence.css`?
**Expected:** Breathing ring (and all SVG elements) appear bright lime green with 2px stroke in light mode.
**If invisible:** Ring stroke is not controlled by these selectors as written. Investigate actual render path (may use different SVG shape types, fill instead of stroke, filters, masks, canvas, or WebGL rendering).

**⚠️ Expected collateral:** Unrelated SVG icons (e.g., UI buttons, nav icons) will also recolor. This is acceptable diagnostic noise and confirms CSS is reached. If *only* breathing ring stays unchanged while other SVG recolors, the ring likely uses a different rendering method.

---

### Change 3: Glass Capsule Border
**File:** `src/immanence.css`
**Anchor:** Locate the existing rule block `.light-mode .glass-capsule` (current lines ~265–280)
**Action:** Append these declarations inside the existing `.light-mode .glass-capsule` rule body, immediately before the closing brace:

```css
  /* PROBE:LIGHT_MODE:CAPSULE:START */
  outline: 3px dashed red !important;
  /* PROBE:LIGHT_MODE:CAPSULE:END */
```

**Question answered:** Is `.glass-capsule` element controlled by CSS in `src/immanence.css`?
**Expected:** Red dashed outline visible around practice card surface in light mode.
**If invisible:** Capsule styling may be overridden by component-level className or inline styles; requires investigation.

---

### Change 4: Avatar Rim (Two Files)
**File:** `src/components/avatarV3/AvatarV3.css`
**Anchor:** Locate the `.light-mode .avatar-v3::after` rule (current lines ~232–240)
**Action:** Add this rule immediately after that block:

```css
/* PROBE:LIGHT_MODE:AVATAR:START */
.light-mode .avatar-v3 {
  outline: 3px dashed cyan !important;
}
/* PROBE:LIGHT_MODE:AVATAR:END */
```

**File:** `src/components/avatarV3/AvatarComposite.css`
**Anchor:** Locate the end of the light mode section (current line 161)
**Action:** Add this rule:

```css
/* PROBE:LIGHT_MODE:AVATAR:START */
.light-mode .avatar-composite {
  outline: 3px dashed cyan !important;
}
/* PROBE:LIGHT_MODE:AVATAR:END */
```

**Question answered:** Which avatar CSS layer(s) are controlled by CSS?
**Expected:** Cyan dashed outline visible around avatar in light mode (may appear on `.avatar-v3`, `.avatar-composite`, or both depending on which wrapper defines the visible bounding box).
**If invisible:** Avatar styling may be overridden by JSX props or component-level filters; requires investigation.

**Note:** Avatar probes two wrapper layers. Either one or both cyan outlines may be visible; this still proves CSS reach. If neither is visible, avatar rendering may use inline styles or JSX-level transforms.

---

## ALLOWLIST (Exact Paths)
- `src/immanence.css`
- `src/components/avatarV3/AvatarV3.css`
- `src/components/avatarV3/AvatarComposite.css`

## DENYLIST
- All other files (no changes outside probe markers)

---

## Constraints
- All probe changes use CSS comment delimiters (`/* ... */`) only—no `//` syntax
- Changes marked with `/* PROBE:LIGHT_MODE:*:START` and `*:END` comments
- All probes use `!important` to override existing styles (ensures visibility if CSS owns the layer)
- All probes are purely visual—no behavioral or state logic changes
- Probes must be completely reversible (delete between markers only, no net file changes)
- Button probe uses base rule (not `:active`) for static screenshot reliability
- Glass capsule probe is appended inside existing selector body (not a new rule block)

---

## Verification Steps

### Step 1: Build
```bash
npm run build
```
Must succeed with no new errors.

### Step 2: Start Dev Server
```bash
npm run dev
```

### Step 3: Enable Light Mode
- Browser DevTools → Application/Storage → LocalStorage
- Find key `immanenceOS.colorScheme`
- Set value to `'light'` (with quotes)
- Refresh page

### Step 4: Navigate to Practice Session
- Start or resume a practice session
- Ensure breathing ring, practice card, and avatar are all visible on screen

### Step 5: Capture Screenshots (Light Mode, Single Session)

**Screenshot A: Button & Capsule**
- Frame: Begin/Resume button (top) and practice card background (center)
- Required probes visible: magenta dashed border on button, red dashed outline on capsule

**Screenshot B: Breathing Ring**
- Frame: center of screen showing breathing ring animation
- Required probe visible: lime green stroke on ring (and all SVG elements)

**Screenshot C: Avatar**
- Frame: avatar in center with breathing ring behind it
- Required probe visible: cyan dashed outline around avatar

---

## Ownership Classification Table

After capturing screenshots, complete this table:

| Probe | Surface | Expected Visual | Actual Result | CSS Controlled | Evidence |
|-------|---------|---|---|---|---|
| Magenta border | Button | Magenta dashed border visible | ✓ visible / ✗ invisible | Yes / No | Screenshot A |
| Lime stroke | Ring SVG | Lime green stroke, 2px width (and other SVG recolored) | ✓ visible / ✗ invisible | Yes / No | Screenshot B |
| Red outline | Capsule | Red dashed outline around card | ✓ visible / ✗ invisible | Yes / No | Screenshot A |
| Cyan outline | Avatar | Cyan dashed outline on one or both avatar layers | ✓ visible / ✗ invisible | Yes / No | Screenshot C |

---

## STOP GATE ⛔

**Do not proceed to implementation specs until:**

1. ✅ All four probes are classified as either VISIBLE or INVISIBLE (binary, no ambiguity)
2. ✅ Ownership table is completed and signed off by human
3. ✅ Screenshots are provided as evidence
4. ✅ Any INVISIBLE probes are investigated:
   - Confirm that CSS file in allowlist was edited correctly
   - Document findings: which layer (JSX prop / inline style / SVG attribute / other rendering method) actually owns the property
   - Flag for implementation spec revision

**If any probe result is ambiguous or requires re-probing:**
- Stop, document the blocker, and request human clarification
- Do not proceed to implementation

---

## Cleanup & Verification

**Before closing the probe task, the coding agent must:**

1. Delete all four `/* PROBE:*:START` / `*:END` blocks and their contents
2. Verify working tree state:
   ```bash
   git diff src/immanence.css
   git diff src/components/avatarV3/AvatarV3.css
   git diff src/components/avatarV3/AvatarComposite.css
   ```
   All diffs should be empty (no changes remain)
3. Rebuild to confirm no artifacts:
   ```bash
   npm run build
   ```
4. Report: "Probe complete. Working tree clean."

**Commit handling:**
- If probes are to be preserved for audit: commit with message `chore(probe): light-mode layer ownership diagnostic` and document findings in linked implementation task
- If probes are diagnostic-only: discard all changes without commit

---

## Expected Outcomes & Next Steps

### Outcome A: All Four Probes VISIBLE (Most Likely)
✅ CSS owns all four layers
→ **Proceed to 3 Implementation Specs:**
  1. **SPEC-1: State Signaling** — restore active-state animations/affordances
  2. **SPEC-2: CTA Contrast** — ensure Begin button visible on all stages
  3. **SPEC-3: Depth Hierarchy** — restore surface layer stacking via shadows

### Outcome B: Some Probes INVISIBLE
⚠️ Mixed ownership detected (CSS + JSX + inline styles + other)
→ **STOP and investigate:**
  - Determine actual owner of invisible layers (JSX prop / inline style / SVG attr / rendering method)
  - Revise implementation specs with corrected ownership
  - Update ALLOWLIST if JSX files must be modified
  - Consider component-level `isLight` subscription if CSS-only approach is insufficient

### Outcome C: Probe Results Ambiguous or Unexpected
❌ Cannot classify ownership
→ **STOP and re-probe** with modified diagnostic strategy (e.g., different CSS selectors, targeted component inspection)

---

## Reversibility Guarantee

All probe changes are:
- Wrapped in start/end CSS comment markers
- Non-functional (visual only, no state/logic changes)
- Completely removable by deleting marked blocks
- Non-persistent (no commits unless explicitly chosen for audit)

**After probes are captured and ownership classified, working tree returns to clean state in <3 minutes.**

