# Task Spec: Path-Driven Avatar Visual Differentiation

## Goal
Wire the four attention-interface paths (Yantra, Kaya, Chitra, Nada) into the AvatarV3 rendering pipeline so that each path produces **boldly different avatar geometry, breath behavior, and bloom structure**. Paths do NOT change color — stage controls all color. Paths change **deformation, intensity, and tone** of the jewel.

At the end of this task, switching paths in the DevPanel must produce immediate, unmistakable visual differences in the avatar jewel.

## Cardinal Rule
**Stage = Color / Material / Refinement. Path = Geometry / Deformation / Breath Shape.**
No path logic may introduce new hue, saturation, or color values. All color remains driven by `STAGE_THEMES`. Path logic modulates geometry family, opacity, blur radius, scale amplitude, bloom behavior, and sigil structure — nothing else.

This is consistent with the Jewel Spec: *"Stage transforms the jewel's substance, not its shape. Path applies a deformation field to the jewel."*

---

## Philosophical Grounding

### What Paths Are
Paths are **behavioral participation patterns** — the shape of how someone engages with practice over time. They are recognitions, not labels. They emerge slowly from months of consistent behavior. They carry no reward, status, or praise.

The system observes **behavioral residue** — what remains consistent when no one is asking questions.

### What Paths Are NOT
- Not spiritual identities or personality types
- Not levels or achievements
- Not chosen by the user (inferred from behavior)
- Not visible during Seedling stage (first 90 days)

### The Four Paths and Their Practice Roots

Each path maps to specific attention demands in the app's practice system:

#### Yantra (Ritual / Symbolic — Precision Geometry)
**Attentional demand**: Structured, single-pointed, intentional commitment.

**What practices feed Yantra**:
- **Breath**: Box/square/triangle presets, symmetric ratios (inhale = exhale, hold1 = hold2)
- **Awareness → Insight/Sakshi/Vipassana**: Cognitive witnessing, observing thoughts
- **Integration/Ritual/Circuit**: Structured multi-step ritual sequences
- **Wisdom content**: Contemplative study

**Practice Family affinity**: SETTLE (single-anchor stabilization) + INQUIRE (insight-directed)

**Why these practices**: They all ask attention to **persist with structure** — to hold a pattern, return to an anchor, follow a deliberate sequence. The behavioral signature is constrained continuity.

**Avatar expression**: The jewel expresses **precision** — high symmetry, clean facets, minimal turbulence, structured internal geometry. Like a cut diamond.

#### Kaya (Somatic / Perceptual — Flowing Geometry)
**Attentional demand**: Distributed body awareness, emotional engagement, somatic presence.

**What practices feed Kaya**:
- **Breath**: Extended exhale patterns (exhale ≥ inhale + 2), unstructured free breathing
- **Awareness → Body Scan**: Sequential somatic attention
- **Awareness → Feeling/Emotion**: Meeting emotional states somatically
- **Body-oriented practices**: Sensory sweep, felt-sense work

**Practice Family affinity**: SCAN (distributed sequential attention) + RELATE (attentional engagement with self)

**Why these practices**: They all ask attention to **move through the body's field** — scanning, feeling, returning with care rather than force. The behavioral signature is soft distributed continuity.

**Avatar expression**: The jewel expresses **flowing** — organic curves, gentle undulation, visible expansion/contraction like breathing, soft diffuse edges. Like a breathing organism.

#### Chitra (Imaginal / Visual — Faceted Geometry)
**Attentional demand**: Visual engagement, image-driven perception, multi-faceted observation.

**What practices feed Chitra**:
- **Perception → Visualization (Kasina)**: Geometry, afterimage, visual concentration
- **Perception → Photic**: Light-based perceptual training
- **Resonance → Cymatics**: Visual pattern observation with sound

**Practice Family affinity**: SETTLE (single-anchor, but the anchor is visual/imaginal)

**Why these practices**: They all ask attention to **engage with visual form** — holding an image, watching patterns emerge, attending to light and color. The behavioral signature is intense perceptual engagement.

**Avatar expression**: The jewel expresses **luminosity** — multi-faceted, irregular brilliant cuts, maximum internal light, dazzling radiance. Like a prism catching fire.

#### Nada (Sonic / Rhythmic — Rhythmic Geometry)
**Attentional demand**: Sound-based entrainment, rhythmic synchronization, breath-as-rhythm.

**What practices feed Nada**:
- **Breath with Tempo Sync**: BPM-locked breathing, coherence/resonance presets
- **Resonance → Sound**: Binaural beats, isochronic tones, mantra, nature soundscapes
- **Any tempo-synced practice**: Practices using exact Hz, BPM multiplier

**Practice Family affinity**: SETTLE (the anchor is sonic/temporal)

**Why these practices**: They all ask attention to **sync with rhythm** — riding a wave, following a beat, entrained to periodicity. The behavioral signature is rhythmic return.

**Avatar expression**: The jewel expresses **resonance** — pulsing, wave-like motion, concentric interference patterns, visible rhythmic oscillation. Like a speaker cone in water.

#### Balanced / Seedling (no path)
When no path dominates (balanced distribution), or during Seedling stage (< 90 days), the avatar shows its **neutral baseline** — the default flower sigil, default bloom, default breath. This is the "geometrically pure, metronomically stable form that expresses only Stage" (from Neutral Baseline Spec).

---

## The Three Deformation Families (from Jewel Spec)

The original avatar documentation defines three geometry families. Our four paths map into them:

| Deformation Family | Description | Path(s) |
|---|---|---|
| **Precision** | Symmetry, coherence, clean facets, minimal turbulence | **Yantra** |
| **Flowing** | Organic curves, smooth undulations, soft diffuse edges | **Kaya** |
| **Faceted** | Irregular faceting, multi-lensed, brilliant internal light | **Chitra** |
| *(Rhythmic — extension)* | Pulsing, oscillating, periodic temporal modulation | **Nada** |

Nada extends beyond the original three families by adding **temporal modulation** — its visual signature is less about static geometry and more about how the geometry breathes and pulses over time.

---

## Relationship to Existing Avatar Ontology

### Legacy Path System (6 paths) → New Path System (4 paths)

The original `AVATAR_SYSTEM.md` defines 6 paths: Dhyana, Prana, Drishti, Jnana, Soma, Samyoga.
The `pathDefinitions.js` consolidation maps them:

| Legacy Path | New Path | Rationale |
|---|---|---|
| Dhyana (precision, single-pointed) | **Yantra** | Both demand structured commitment |
| Jnana (precision, clarity-focused) | **Yantra** | Both demand insight-directed precision |
| Prana (flowing, circulatory) | **Nada** | Directional vital energy → rhythmic |
| Soma (flowing, restorative) | **Kaya** | Enveloping soft presence → somatic |
| Drishti (faceted, analytical gaze) | **Chitra** | Multi-lensed orienting → visual/imaginal |
| Samyoga (integrated, balanced) | **Balanced** (null) | Non-dominant → no path expressed |

### Attention Vectors (Ekagrata, Sahaja, Vigilance)

Attention Vectors remain a separate axis (internal energy behavior). This task does NOT implement vectors — only paths. Vectors are a future layer that modulates light physics (pulse, jitter, diffusion) without changing geometry.

From the Jewel Spec: *"Vectors affect ONLY light physics. They NEVER add shapes."*

---

## AvatarV3 Layer Stack (reference)

```
Bottom → Top:
1. ModeBlendField        — mode color gradients (UNCHANGED by path)
2. core-bed              — dark base (UNCHANGED)
3. core-glow             — inner glow → PATH modulates blur radius + opacity
4. StageCore             — stage wallpaper image (UNCHANGED — stage only)
5. vignette              — vignette → PATH modulates softness
6. AvatarBloomLayer      — BloomRingCanvas → PATH controls occluder pattern + bloom intensity
7. sigil                 — inner sigil SVG → PATH swaps SVG structure
8. LensHighlight         — lens flare → PATH modulates intensity
9. glass / grain / frame — structural overlays (UNCHANGED)
```

**What each axis controls** (Axis Constraint Table from AVATAR_SYSTEM.md):

| Axis | Allowed to Change | Forbidden to Change |
|---|---|---|
| **Stage** | Ring count, refinement, palette, material coherence | Pose, symmetry, gesture |
| **Path** | Geometry deformation, expression style, breath shape | Color palette, base ring count |
| **Vector** *(future)* | Glow dynamics, pulse, jitter, diffusion | Geometry, palette, structure |

---

## Path Visual Signatures (Concrete Render Parameters)

### Yantra — Precision Deformation
- **Sigil**: Hexagonal / 6-fold sacred geometry SVG — sharp edges, high symmetry
- **Bloom**: Low opacity (0.18), slow breath speed (0.5) → restrained, structured light
- **Breath**: Minimal amplitude (0.98–1.01 scale), slow measured cadence (20s period)
- **Glow**: Tight blur radius (6px), medium opacity (0.35), focused and crisp
- **Vignette**: Tighter (0.75 opacity) — constrains the visual field
- **Lens**: Low intensity (0.15) — precision, not dazzle
- **Jewel metaphor**: A precisely cut diamond. Still as a held breath.

### Kaya — Flowing Deformation
- **Sigil**: Concentric torus rings SVG — soft organic curves, no sharp edges
- **Bloom**: High opacity (0.35), slow breath speed (0.5) → soft, diffuse, wide glow
- **Breath**: Deep amplitude (0.88–1.08 scale), slow rhythmic cadence (22s period)
- **Glow**: Wide blur radius (20px), moderate opacity (0.30), soft and diffuse
- **Vignette**: Softer (0.45 opacity) — expansive, breathing space
- **Lens**: Medium intensity (0.22) — warm, present
- **Jewel metaphor**: A breathing organism. You can see it expand and contract.

### Chitra — Faceted Deformation
- **Sigil**: Star / starburst SVG — radiating points, multi-faceted, irregular brilliance
- **Bloom**: Maximum opacity (0.45), moderate breath speed (0.9) → intense, brilliant bloom
- **Breath**: Medium amplitude (0.95–1.04), moderate speed (16s period)
- **Glow**: Wide blur radius (16px), high opacity (0.50), intense radiance
- **Vignette**: Minimal (0.35 opacity) — the light pours out
- **Lens**: High intensity (0.35) — dazzling, refractive
- **Jewel metaphor**: A prism catching fire. Maximum luminosity, internal radiance.

### Nada — Rhythmic Deformation
- **Sigil**: Wave / interference pattern SVG — concentric ripples, standing wave
- **Bloom**: Medium opacity (0.30), fast breath speed (1.4) → pulsating, beat-driven glow
- **Breath**: Rhythmic pulse (0.92–1.06), faster beat-driven tempo (12s period)
- **Glow**: Medium blur radius (12px), medium opacity (0.38), pulsating rhythm
- **Vignette**: Medium (0.55 opacity)
- **Lens**: Medium intensity (0.25) — flicker quality
- **Jewel metaphor**: A speaker cone in water. You can feel the beat.

### Balanced / Null — Neutral Baseline
- Default flower sigil, default bloom, default breath — current behavior unchanged.
- This is the geometrically neutral form per the Neutral Baseline Spec.

---

## Implementation Plan

### Sigil Source-of-Truth

The sigil is a plain `<img>` tag at `AvatarV3.jsx` line 165–170:
```jsx
<div className="avatar-v3__layer avatar-v3__sigil">
  <img src={`${import.meta.env.BASE_URL}assets/avatar/sigil_flower.svg`} />
</div>
```
Swapping the `src` attribute to a path-specific SVG is the correct change point.
No canvas, no Three.js, no baked texture — just an image swap.

### BloomRingCanvas Constraint Resolution

**Fact**: `AvatarBloomLayer` passes `mode="avatar"` to `BloomRingCanvas`. In avatar mode, all heavy geometry is gated out by `{!isAvatar && ...}` guards:
- `RayOccluders` — **lab-only** (never rendered in avatar)
- GodRay sun proxy — **lab-only**
- Dark center disc, shoulder ring, reticle — all **lab-only**

In avatar mode, the only Three.js objects are **3 flat circles** (outer glow disc r=0.85, inner warmth r=0.4, central hotspot r=0.12) with additive blending and subtle breathing opacity.

**Decision: Option B** — Runtime avatar must NOT add meshes. Path bloom differences are achieved via:
1. **CSS layer opacity** on the `.avatar-v3__bloom-layer` wrapper (already hardcoded at 0.25)
2. **`breathSpeed` prop** passed to BloomRingCanvas (already accepted, controls glow breathing rate)
3. **CSS custom properties** on glow, vignette, and lens layers
4. **Breath amplitude** (scale min/max on AvatarV3Container)

Occluder patterns remain a DevPanel/lab-only feature. They do NOT affect the runtime avatar.

---

### Step 1: Create path sigil SVGs
Create 4 new SVG files in `public/assets/avatar/`:
- `sigil_yantra.svg` — hexagonal / 6-fold precision geometry
- `sigil_kaya.svg` — concentric torus rings / flowing curves
- `sigil_chitra.svg` — starburst / radiating faceted points
- `sigil_nada.svg` — wave interference / ripple pattern

All must share identical viewBox and anchor point as existing `sigil_flower.svg`.

### Step 2: Create path visual config module
New file `src/data/pathVisuals.js` mapping each path to concrete render params:
```js
{
  sigil: 'sigil_yantra.svg',     // <img> src swap
  breathMin: 0.98,                // AvatarV3Container scale
  breathMax: 1.01,
  breathDuration: 20,             // seconds
  bloomOpacity: 0.25,             // CSS opacity on bloom layer
  bloomBreathSpeed: 0.6,          // breathSpeed prop to BloomRingCanvas
  glowBlur: 6,                    // CSS blur on core-glow
  glowOpacity: 0.35,              // CSS opacity on core-glow
  vignetteOpacity: 0.75,          // CSS opacity on vignette
  lensIntensity: 0.15,            // opacity multiplier on LensHighlight
}
```
No occluder patterns, no new Three.js objects, no color values.

### Step 3: Wire path into AvatarV3.jsx
- Accept `path` prop (string: 'Yantra'|'Kaya'|'Chitra'|'Nada'|null)
- Import `getPathVisuals()` from `pathVisuals.js`
- Swap sigil `<img>` src to path-specific SVG
- Pass `bloomOpacity` and `bloomBreathSpeed` to `AvatarBloomLayer`
- Set CSS custom properties on the stack wrapper for glow/vignette/lens
- Override breath params (min, max, duration) passed to `AvatarV3Container`
- When `path` is null/undefined: use current defaults (zero regression)

### Step 4: Update AvatarBloomLayer
- Accept `bloomOpacity` and `breathSpeed` props (with fallback defaults)
- Apply `bloomOpacity` as layer `opacity` style (replaces hardcoded 0.25)
- Pass `breathSpeed` through to BloomRingCanvas

### Step 5: BloomRingCanvas — NO CHANGES
BloomRingCanvas already accepts `breathSpeed`. No occluder wiring needed. No new props.

### Step 6: Update CSS custom properties in AvatarV3.css
- `.avatar-v3__core-glow { filter: blur(var(--path-glow-blur, 12px)); opacity: var(--path-glow-opacity, 0.3); }`
- `.avatar-v3__vignette { opacity: var(--path-vignette-opacity, 0.6); }`

### Step 7: Pass path from App.jsx → HomeHub → AvatarV3
- `getDisplayPath()` returns null during Seedling → neutral baseline

### Step 8: DevPanel verification — existing path selector now shows bold avatar changes

---

## Allowlist (files to create or modify)

### New files
- `public/assets/avatar/sigil_yantra.svg`
- `public/assets/avatar/sigil_kaya.svg`
- `public/assets/avatar/sigil_chitra.svg`
- `public/assets/avatar/sigil_nada.svg`
- `src/data/pathVisuals.js`

### Modified files
- `src/components/avatarV3/AvatarV3.jsx` — accept path prop, wire config
- `src/components/avatarV3/AvatarV3.css` — CSS custom properties for path layers
- `src/components/avatarV3/AvatarV3Container.jsx` — pass path-driven breath params
- `src/components/dev/BloomRingCanvas.jsx` — NO CHANGES (already accepts breathSpeed)
- `src/components/HomeHub.jsx` — pass path to AvatarV3
- `src/App.jsx` — read path, pass down, version bump

## Denylist (DO NOT modify)

- `src/components/Avatar.jsx` (protected)
- `src/components/MoonOrbit.jsx` (protected)
- `src/components/MoonGlowLayer.jsx` (protected)
- `src/theme/stageColors.js` (stage colors are sacrosanct)
- `src/context/ThemeContext.jsx` (stage theming untouched)
- `src/data/pathDefinitions.js` (stable)
- `src/data/pathInference.js` (inference logic unchanged)
- `src/data/practiceFamily.js` (instrumentation layer — pure, immutable)
- `src/state/pathStore.js` (store logic unchanged)

## Constraints

1. **No color in path logic.** All color from stage. Path config contains zero hue/saturation values.
2. **Sigil SVGs share identical viewBox** (match `sigil_flower.svg`) to prevent layout reflow.
3. **Balanced / null path** = current defaults. Zero regression.
4. **Seedling suppression** via `pathStore.getDisplayPath()` returning null.
5. **BloomRingCanvas** is NOT modified. Avatar mode already gates out occluders/godrays. Path bloom differentiation uses only CSS opacity and the existing `breathSpeed` prop.
6. **Performance**: no new Three.js objects, meshes, or animation frames. Zero runtime geometry added.
7. **Axis separation**: Path forbidden from changing color; Stage forbidden from changing geometry.
8. **Single-line anchors**: minimal diffs.

## Verification Steps

1. `npm run lint` — zero new warnings
2. `npm run dev` — loads without console errors
3. DevPanel → Stage selector: avatar COLOR changes (indigo → amber → gold → cyan → violet). Unchanged.
4. DevPanel → Path selector: avatar SHAPE/BREATH/BLOOM changes. **Visually obvious.**
5. Yantra → barely breathes, sharp geometric sigil, restrained bloom, tight glow
6. Kaya → breathes deeply and visibly, soft torus sigil, wide diffuse bloom
7. Chitra → glows intensely, starburst sigil, maximum bloom, dazzling
8. Nada → pulses rhythmically, wave sigil, fast tempo
9. Seedling → path visuals suppressed, default flower sigil
10. Cross-check: path changes produce ZERO color change — only geometry/intensity/tempo

## Commit Message

```
feat: wire path-driven avatar visuals — geometry deformation, bloom, breath

Each attention-interface path now produces visually distinct avatar
geometry and behavior, rooted in practice participation patterns:

- Yantra (ritual/structural) → precision geometry, minimal breath, restrained bloom
- Kaya (somatic/body) → flowing geometry, deep breathing, diffuse bloom  
- Chitra (visual/perceptual) → faceted geometry, max luminosity, dazzling
- Nada (sonic/rhythmic) → rhythmic geometry, pulsing tempo, wave sigil

Path = behavioral shape (geometry/deformation).
Stage = duration/consistency (color/material).
Axes remain fully orthogonal per Jewel Spec.
Seedling suppresses all path visuals.
```
