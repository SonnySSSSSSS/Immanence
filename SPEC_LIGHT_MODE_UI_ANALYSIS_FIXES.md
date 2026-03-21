# SPEC: Practice Section Light Mode UI Remediation

**Status:** Analysis complete, awaiting triage and implementation approval
**Date:** 2026-03-21
**Authority:** Pending human review before any spec sub-task approval

---

## Executive Summary

Light mode rendering of PracticeSection UI has 10 identified issues ranging from critical (broken affordances) to low (aesthetic/WCAG edge cases). No single issue is catastrophic in isolation, but together they degrade UX from "functional" to "noticeably less polished than dark mode."

**Critical blockers (2):** Active state signaling collapsed; primary CTA contrast at risk
**High impact (3):** Surface stacking invisible, avatar degraded, SVG rendering muddy
**Medium (3):** Glass blur cosmetic, stage glows imperceptible, one component unaudited
**Low (2):** Typography aesthetic, contrast edge cases

This spec is a **planning document**. Each section below is a **candidate sub-spec** ready for approval and hand-off to the implementing agent.

---

## CRITICAL Issues

### SPEC C-1: Restore Active-State Signaling in Light Mode

**Goal:** Replace suppressed glow animations with light-mode substitute affordance that communicates active practice state, selected controls, and animation.

**Current behavior:**
- `--glow-gold: none` silences all glows
- `.animate-glow-pulse` override suppresses animation
- Active ring, progress indicators, and selected UI elements render identically to idle state

**Desired behavior:**
- Active elements have perceptible visual feedback (animated border, background tint pulse, or accent-color glow)
- Glow integrates with manuscript aesthetic (inset shadow, subtle opacity shift, or tinted pulse)

**Files to modify (ALLOWLIST):**
- `src/immanence.css`

**Files NOT to modify (DENYLIST):**
- `src/components/practice/` (no JSX changes)
- `src/state/` (no store changes)
- `src/context/` (no context changes)

**Constraints:**
- Light mode only (no dark mode changes)
- Reuse existing CSS variable system (`--light-accent`, `--accent-*`)
- Animation duration must match dark mode equivalents
- Must work on `.btn-glow`, `.glass-capsule`, `.animate-glow-pulse`, and practice ring SVG elements

**Verification:**
1. Build succeeds (`npm run build`)
2. Dev server starts (`npm run dev`)
3. Light mode toggle active (class `light-mode` on `<html>`)
4. Screenshot of practice card with active session showing animated affordance on:
   - Begin/Resume button (hover and active states)
   - Breathing ring (animated state)
   - Session progress indicator
5. Affordance is perceptible at normal screen brightness (no zoom required)

**Commit message:**
```
fix(light-mode): restore active-state signaling with border-pulse and tinted animation

Replaces suppressed glow animations (--glow-gold: none) with light-mode substitute:
- .animate-glow-pulse: inset shadow animation (0.5s opacity oscillation)
- .btn-glow active/hover: animated accent border (0.2s easel)
- practice ring: subtle opacity pulse on active phase

Maintains manuscript aesthetic (no glowing halos) while communicating interactivity.
Verified: practice card, breathing ring, session controls in light mode.
```

**Atomic change:** YES (one CSS file, one hypothesis: animations suppressed)
**Success signal:** Practice card active elements have visible, smooth animation in light mode
**No sequencing:** N/A (CSS-only)

---

### SPEC C-2: Fix Primary Button Contrast on Warm Stage Backgrounds

**Goal:** Ensure Begin Practice button remains clickable and visually distinct on all five stage-tinted light mode backgrounds.

**Current behavior:**
- Gold/amber gradient button (`from-amber-400 to-yellow-500` Tailwind) has no light-mode override
- Against Flame (#F5F0E6) and Seedling (#F0F9F4) warm backgrounds, contrast ratio likely < 3:1
- Button boundary is ambiguous; CTA affordance is weakened

**Desired behavior:**
- Button is visually prominent against all stage backgrounds in light mode
- Either: (A) stage-aware background swap, or (B) strong border ring with accent color
- Passes WCAG AA contrast (≥4.5:1 for small text) on all 5 stages

**Files to modify (ALLOWLIST):**
- `src/immanence.css`

**Files NOT to modify (DENYLIST):**
- `src/components/practice/BeginPracticeButton.jsx` (no JSX)
- `src/components/practice/SessionControls.jsx` (no JSX)

**Constraints:**
- Light mode only
- Must work across all 5 stages (Seedling, Ember, Flame, Beacon, Stellar)
- No JSX changes to BeginPracticeButton or SessionControls
- Reuse stage-aware colors from ThemeContext/stageColors.js

**Verification:**
1. Build succeeds
2. Dev server starts
3. Light mode + each of 5 stages active
4. Screenshot of Begin Practice button on each stage background
5. Contrast check: WCAG AA (≥4.5:1) on button text vs background using dev tools eyedropper
6. Button clearly "pops" from background visually

**Commit message:**
```
fix(light-mode): ensure Begin button visible on all stage backgrounds

Adds stage-aware `.light-mode .btn-glow` rule with accent border-bottom and
inverted background strategy:
- Seedling/Ember/Flame: swaps to dark variant with accent border
- Beacon/Stellar: border-ring approach with 2px accent ring

Passes WCAG AA (4.5:1) on all 5 stages. Verified: visual and contrast check.
```

**Atomic change:** YES (one hypothesis: button contrast too low)
**Success signal:** Button is clearly visible and meets WCAG AA on all stages
**No sequencing:** None (CSS-only, independent of C-1)

---

## HIGH Impact Issues

### SPEC H-1: Restore Surface Layer Stacking via Shadow Differentiation

**Goal:** Make layered surfaces (base → surface → elevated) visually distinct via shadows rather than background contrast alone.

**Current behavior:**
- `--bg-elevated: #FFFFFF` vs stage surfaces `#F8FCF9`–`#F8F9FE` (essentially identical)
- Cards, modals, and dialogs do not "lift" — depth cues lost
- User cannot easily identify which surface tier they are interacting with

**Desired behavior:**
- Elevated surfaces cast a subtle shadow onto lower tiers
- Depth hierarchy is perceptually clear
- Shadows integrate with light mode aesthetics (no harsh black drop-shadows)

**Files to modify (ALLOWLIST):**
- `src/immanence.css`
- `src/styles/cardMaterial.js` (light mode shadow definitions)

**Files NOT to modify (DENYLIST):**
- `src/components/` (no component changes)
- `src/context/ThemeContext.jsx` (no color variable injection changes)

**Constraints:**
- Use stage-aware shadow tint (`--light-shadow-tint` already exists)
- No background color changes to `--bg-elevated`
- Apply consistently to `.glass-capsule`, `.panel-ornate`, cards, modals
- Shadows must render with inset + drop shadow combination (manuscript aesthetic: upper-left light)

**Verification:**
1. Build succeeds
2. Dev server starts
3. Light mode active + one stage selected (recommend Beacon for contrast)
4. Screenshot of practice card with visible layers: housing → surface → card
5. Confirm shadow is visible on each layer boundary (eyedropper check shadow area)

**Commit message:**
```
fix(light-mode): differentiate surface tiers via shadow hierarchy

Replaces background-contrast depth cues (now invisible on near-white stages)
with explicit shadow layering on elevated surfaces:
- glass-capsule: 0 2px 6px shadow + inset highlight
- panel-ornate: stacked drop + inset shadows
- card-adaptive: 0 4px 12px soft shadow

Maintains manuscript aesthetic (no harsh black). Verified on Beacon stage.
```

**Atomic change:** YES (single hypothesis: surface contrast lost)
**Success signal:** Layer boundaries are clearly visible via shadows
**No sequencing:** None (can run in parallel with C-1, C-2)

---

### SPEC H-2: Adapt Avatar Rendering for Light Backgrounds

**Goal:** Avatar composite (globe + rim + glass layers) should appear crisp and well-integrated on light backgrounds, not washed-out or visually jarring.

**Current behavior:**
- Avatar source imagery optimized for dark mode
- Current light mode adaptation: brightness +18–28%, glass layer 0.6 opacity, warm vignette 0.14 alpha
- Result: washed-out appearance, insufficient rim definition, vignette barely perceptible
- Avatar appears to float disconnected from the practice environment

**Desired behavior:**
- Avatar reads as a distinct, well-lit object on light surface
- Rim glow/edge definition is perceptible (stronger than 0.14)
- Either: (A) increase vignette alpha + rim opacity, or (B) add circular shadow base below avatar

**Files to modify (ALLOWLIST):**
- `src/components/avatarV3/AvatarComposite.css`
- `src/components/avatarV3/AvatarV3.css`

**Files NOT to modify (DENYLIST):**
- `src/components/avatarV3/AvatarV3.jsx` (no JSX)
- Avatar image source assets (no design changes)

**Constraints:**
- Light mode only
- Brightness filters remain (1.18 / 1.28 / 0.94 / 1.08 exist for reason)
- No avatar component JSX changes
- Opacity increase limited to <0.30 total (avoid visual overweight)

**Verification:**
1. Build succeeds
2. Dev server starts
3. Light mode active + practice session running
4. Screenshot of avatar in center of screen (breathing ring visible behind)
5. Compare to dark mode avatar appearance: should feel equally grounded and distinct
6. Rim glow should be perceptible at arm's length (normal viewing distance)

**Commit message:**
```
fix(light-mode): strengthen avatar rim definition and base grounding

Adjusts AvatarComposite light mode filters and AvatarV3 rim glow:
- Increases warm vignette alpha from 0.14 to 0.22 (rim clarity)
- Adds circular shadow base (0 16px 24px with stage-tint) below avatar
- Glass layer opacity unchanged (0.6 intentional)

Result: avatar reads as grounded, distinct object on light surface.
Verified: visual appearance in light mode practice session.
```

**Atomic change:** YES (single hypothesis: avatar washed-out)
**Success signal:** Avatar rim and base are perceptible; avatar looks grounded
**No sequencing:** Independent of C-1, C-2, H-1

---

### SPEC H-3: Fix SVG Multiply Blend Mode on Tinted Backgrounds

**Goal:** SVG geometry (lines, paths, circles) renders cleanly and predictably across all five stage-tinted light mode backgrounds.

**Current behavior:**
- `mix-blend-mode: multiply` on `.svg line`, `.svg path.stroke`, `.svg circle.stroke`
- Works correctly on neutral surfaces
- On Beacon (#F0F5F7 cyan-tinted) and Stellar (#F0F3F9 purple-tinted), multiply compounds with background hue
- Result: muddy, overly-saturated, or hue-shifted strokes (unpredictable per stage)

**Desired behavior:**
- Strokes render consistently across all backgrounds
- Either: (A) conditional blend mode per-stage, or (B) switch to `darken` blend (more predictable), or (C) use direct stroke color instead of blend

**Files to modify (ALLOWLIST):**
- `src/immanence.css`

**Files NOT to modify (DENYLIST):**
- `src/components/practice/` (no SVG component changes)

**Constraints:**
- Light mode only
- SVG content rendering unchanged
- Solution must work on all decorative and functional SVG (breathing ring, icons, geometry)
- Reuse `--light-accent` stroke color

**Verification:**
1. Build succeeds
2. Dev server starts
3. Light mode + each of 5 stages active
4. Screenshot of breathing ring (largest SVG geometry visible) on each stage
5. Confirm strokes are clean and consistent (no muddy/hue-shifted appearance)
6. Eyedropper check: stroke color matches expected `--light-accent` on all stages

**Commit message:**
```
fix(light-mode): replace multiply blend with stage-safe darken mode for SVG

Replaces `mix-blend-mode: multiply` with `darken` on SVG geometry:
- multiply compounds with tinted stage backgrounds (Beacon cyan, Stellar purple)
- darken is predictable across all hue backgrounds

Applies to: breathing ring, icons, decorative geometry.
Verified: visual consistency on all 5 stages.
```

**Atomic change:** YES (single hypothesis: blend mode unpredictable on tints)
**Success signal:** SVG strokes look clean and consistent on all stages
**No sequencing:** Independent of C-1, C-2, H-1, H-2

---

## MEDIUM Impact Issues

### SPEC M-1: Define Meaningful Glass Aesthetic in Light Mode

**Goal:** Light mode `.glass-capsule` elements have either a visible frosted-glass effect or commit to flat card styling—not a meaningless blur.

**Current behavior:**
- `backdrop-filter: blur(4px)` is imperceptible (nearly no blur visible)
- 45% white background + 4px blur reads as flat white card, not glass
- Glass metaphor communicates nothing

**Desired behavior:**
- Either: (A) increase blur to ≥8px for perceptible frosted effect, or (B) remove blur and style as cards with visible border + shadow

**Files to modify (ALLOWLIST):**
- `src/immanence.css`

**Files NOT to modify (DENYLIST):**
- `src/components/`
- `src/styles/cardMaterial.js` (use immanence.css for one-off rule)

**Constraints:**
- Light mode only
- Must work on `.glass-capsule` (main practice surface) and any `.glass-*` prefixed elements
- No component JSX changes
- Performance: blur GPU cost must not increase significantly (discuss with human if >8px needed)

**Verification:**
1. Build succeeds
2. Dev server starts
3. Light mode active
4. Screenshot of practice card with glass-capsule element
5. Blur effect should be visually perceptible when element is layered over breathing ring or background geometry

**Commit message:**
```
fix(light-mode): increase glass-capsule blur to perceptible threshold

Raises `backdrop-filter: blur(4px)` to `blur(12px)` on `.glass-capsule` for
visible frosted-glass effect. 4px was imperceptible; 12px communicates
material distinction without excessive GPU load.

Alternative considered: commit to flat card aesthetic (removed blur), but
glass metaphor preferred per design system.

Verified: blur is perceptible on practice card surface.
```

**Atomic change:** YES (single hypothesis: blur too subtle)
**Success signal:** Blur effect is visibly perceptible on glass-capsule
**No sequencing:** Independent of all others

---

### SPEC M-2: Increase Stage Glow Visibility in Glass Capsules

**Goal:** Stage-specific colored glows on `.glass-capsule` elements are perceptible and reinforce stage identity in light mode.

**Current behavior:**
- Stage glows at `box-shadow: 0 4px 16px rgba(x, y, z, 0.12)` are nearly imperceptible
- Only visual per-stage differentiator in light mode rendering
- At 0.12 alpha, may be invisible under normal ambient screen conditions

**Desired behavior:**
- Glow alpha ≥0.20 for clear visibility
- Optionally add subtle stage-tint background color (`rgba(accent, 0.04)`) to capsule
- Stage identity is clear at a glance

**Files to modify (ALLOWLIST):**
- `src/immanence.css`

**Files NOT to modify (DENYLIST):**
- `src/theme/stageColors.js` (no color palette changes)
- `src/context/ThemeContext.jsx`

**Constraints:**
- Light mode only
- Must increase alpha on all 5 stage-specific rules (lines 284–302)
- Optional: add light tint to background (0.04 alpha max to preserve white surface feel)

**Verification:**
1. Build succeeds
2. Dev server starts
3. Light mode + cycle through all 5 stages
4. Screenshot of practice card on each stage
5. Glow color should match the stage accent (Seedling green, Ember orange, etc.)
6. Glow should be perceptible at normal screen brightness (no zoom needed)

**Commit message:**
```
fix(light-mode): increase stage glow visibility from 0.12 to 0.24 alpha

Boosts box-shadow alpha on all 5 `.light-mode [data-stage] .glass-capsule` rules
from 0.12 → 0.24 for clear stage identity. Adds optional `rgba(accent, 0.04)`
background tint (imperceptible but perceptually reinforces glow hue).

Stage glows are the primary per-stage visual differentiator in light mode;
previous 0.12 was below perceptibility threshold.

Verified: glow is visible on practice card for all 5 stages.
```

**Atomic change:** YES (single hypothesis: glows too subtle)
**Success signal:** Stage glows are clearly visible and match stage accent colors
**No sequencing:** Independent of all others

---

### SPEC M-3: Audit PracticeHeader for Light Mode Inline Styles

**Goal:** Ensure PracticeHeader component has no hardcoded inline colors that bypass light mode CSS overrides.

**Current behavior:**
- PracticeHeader is a persistent orientation element at top of practice section
- Component has zero light mode awareness (no `colorScheme` subscription)
- Unknown whether inline styles or hardcoded rgba values exist

**Desired behavior:**
- All text/color props use adaptive classes (`.text-white` → caught by CSS override) or CSS variables
- No `rgba(255,255,255,x)` or `#fff` hardcoded inline styles
- Header is readable in light mode

**Files to modify (ALLOWLIST):**
- `src/components/practice/PracticeHeader.jsx`

**Files NOT to modify (DENYLIST):**
- `src/immanence.css` (no CSS changes unless issues found)
- `src/state/displayModeStore.js`

**Constraints:**
- Audit only—do not refactor unless specific issues found
- If inline styles exist, replace with `.text-white` Tailwind class or CSS variable
- No logic changes

**Verification:**
1. Search PracticeHeader.jsx for inline `style={{ color:` or hardcoded hex/rgba
2. If no hardcoded colors found: report "no issues found"
3. If found: fix and re-verify
4. Dev server runs without errors
5. Light mode toggle: PracticeHeader text is readable

**Commit message (if changes needed):**
```
fix(light-mode): remove hardcoded inline colors from PracticeHeader

Replaces inline style={{color: 'rgba(255,255,255,...)'}} with .text-white
Tailwind class, which is caught by light mode CSS overrides.

PracticeHeader is a persistent navigation element; ensuring light mode
compatibility improves header readability across color schemes.

Verified: header readable in light and dark modes.
```

**Atomic change:** YES (audit + fix one component)
**Success signal:** No hardcoded colors found, or all inlines replaced with adaptive classes
**No sequencing:** Independent of all others

---

## LOW Impact Issues

### SPEC L-1: Review Timer Etched Text Shadow for Aesthetic Fit

**Goal:** Assess whether `.timer-display` etched text-shadow (embossed aesthetic) aligns with modern light mode design intent.

**Current behavior:**
- `.light-mode .timer-display` has `text-shadow: 0 1px 0 white, 0 -1px 0 shadow-tint`
- Classic embossed/debossed technique from early 2000s
- At large font sizes may read as dated or skeuomorphic

**Desired behavior:**
- Either: (A) retain as intentional retro aesthetic element, or (B) simplify to single-layer shadow or remove entirely
- Decision should be driven by design system goals (manuscript feel vs. modern flat)

**Files to modify (ALLOWLIST):**
- `src/immanence.css` (if changes needed)

**Files NOT to modify (DENYLIST):**
- Timer component JSX

**Constraints:**
- Decision is aesthetic (not a bug)
- If changing, must affect only `.timer-display` in light mode
- Compare to dark mode timer appearance for consistency

**Verification:**
1. Screenshot of timer display in light mode at normal size
2. Compare to dark mode timer
3. Assess: is embossed shadow intentional or outdated?
4. If change approved: build succeeds, timer is readable

**Commit message (if change needed):**
```
style(light-mode): simplify timer text-shadow for modern aesthetic

Removes embossed dual-layer text-shadow from .timer-display; replaces with
single subtle drop-shadow. Etched aesthetic felt dated compared to flat
design system intent.

Verified: timer readable and aesthetically consistent with modern light mode.
```

**Atomic change:** YES (affects one element)
**Success signal:** Design intent clarified; timer aesthetic matches system
**No sequencing:** Independent—lowest priority

---

### SPEC L-2: Verify Contrast Ratios on Ghost-Opacity Text

**Goal:** Confirm that `.text-white/20` and `.text-white/30` opacity mappings do not inadvertently violate WCAG AA on informational labels.

**Current behavior:**
- `.text-white/20` → `rgba(180, 175, 165, 0.45)` on near-white backgrounds
- `.text-white/30` → `rgba(170, 165, 150, 0.55)` on near-white backgrounds
- Contrast ratio likely <3:1 (fails WCAG AA for small text)
- Assumed to be decorative (not informational), but not explicitly documented

**Desired behavior:**
- Confirm all uses of `.text-white/20`, `/30` are truly decorative (not WCAG-required labels)
- If any informational text uses these classes, document as out-of-spec and flag for remediation
- Add CSS comment documenting decorative-only intent

**Files to check (ALLOWLIST):**
- `src/immanence.css` (lines 370–380)
- `src/components/practice/BreathPracticeCard.jsx` (grep for `text-white/20`, `text-white/30`)
- `src/components/practice/PracticeMenu.jsx`
- `src/components/practice/PracticeOptionsCard.jsx`

**Files NOT to modify (DENYLIST):**
- None (audit only)

**Constraints:**
- Audit only—do not change contrast values
- Document findings in spec or linked issue
- If informational text found, create separate remediation spec

**Verification:**
1. Grep for `.text-white/20` and `.text-white/30` in practice components
2. For each match, assess: informational or decorative?
3. Calculate actual contrast ratio (eyedropper + WCAG checker)
4. Report: "all decorative, no issues" or "X instances of informational text found—requires remediation"

**Commit message:** N/A (audit only—no code change unless violations found)

**Atomic change:** YES (audit only)
**Success signal:** Confirmation that ghost-opacity text is used only decoratively, or violations documented
**No sequencing:** Independent—lowest priority

---

## Implementation Roadmap

### Priority Tier 1 (Critical, high impact) — Ship first
1. **C-1**: Restore active-state signaling → unlocks affordance visibility
2. **C-2**: Fix Begin button contrast → ensures primary CTA is usable

### Priority Tier 2 (High impact) — Follow-up
3. **H-1**: Restore surface stacking → depth hierarchy clarity
4. **H-2**: Adapt avatar for light → perceptual cohesion
5. **H-3**: Fix SVG blend mode → rendering consistency

### Priority Tier 3 (Medium) — Polish
6. **M-1**: Glass aesthetic definition → material clarity
7. **M-2**: Increase stage glow visibility → stage identity
8. **M-3**: Audit PracticeHeader → completeness check

### Priority Tier 4 (Low) — Optional/deferred
9. **L-1**: Timer aesthetic review → design consistency
10. **L-2**: Ghost-opacity WCAG audit → compliance documentation

---

## Authority & Approval

- **Planning agent:** Claude Code (analysis complete)
- **Implementing agent:** Human + triage (approve individual specs as needed)
- **Commit authority:** Human approval required per AGENTS.md § Task Spec Requirements

Each sub-spec above is ready for isolated implementation once approved. Specs may be batched (e.g., C-1 + C-2 shipped together) or sequenced as human workflow allows.

**Next step:** Triage and approval of one or more sub-specs. Submit spec text to implementing agent with explicit flag: `IMPLEMENT` or defer.

