# Immanence OS — Worklog

## 2026-01-09 11:45 - Gemini - COMPLETED

**Task**: Implement Final Avatar Container+Core Layering Spec

**Files Modified**:

- `src/components/avatar/OrbCore.jsx`: Major refactor of layer order (Frame moved to top Z:10, Core Assembly at Z:5).
- `src/App.jsx`: Version bump v3.16.7.
- `docs/AVATAR_CONTAINER_CORE_SPEC.md`: Created formal specification.

**Changes**:

- **Layering**: Implemented strict Bottom-up order: Background -> Shadow -> Core (Masked) -> Glass -> Frame.
- **Visuals**:
  - Frame is now the topmost "Container" (opacity/blend modes unaffected, just Z-sorting).
  - Core is masked by a `div` simulating `avatar_container_mask`.
  - Glass (Lens+Highlight) sits _inside_ the core assembly but _above_ the core asset.
- **Instrument Ring**: Moved to Z:6 (between Core and Frame) for depth.
- **Spec**: Formalized the immutable Container vs. Swappable Core architecture.

**Version**: v3.16.7

**Status**: COMPLETED

---

## 2026-01-09 11:35 - Gemini - COMPLETED

**Task**: Fix Missing Avatar Gem Asset (Light Mode)

**Files Modified**:

- `src/components/avatar/StaticSigilCore.jsx`: Added logic to resolve correct `gemSrc` URL (using `stage_path_attention` format) and pass it to `OrbCore`.
- `src/App.jsx`: Version bump v3.16.6.

**Changes**:

- **Asset Resolution**: `OrbCore` was previously receiving no `gemSrc`, defaulting to empty glass container. Now it correctly calculates the jewel asset path (e.g., `seedling_soma_ekagrata.png`).
- **Defaulting**: Defaults to `dhyana_ekagrata` (Symmetric) when in "Core" mode or no path is selected.
- **Visual Fix**: This ensures the generated Jewel Authority assets actually appear inside the orb vessel.

**Version**: v3.16.6

**Status**: COMPLETED

---

## 2026-01-09 11:15 - Gemini - COMPLETED

**Task**: Boost Avatar Visibility (Correction)

**Files Modified**:

- `src/components/avatar/OrbCore.jsx`: Increased axis intensity, switched to 'overlay' blend, widened mask, aggressively reduced lens opacity.
- `src/App.css`: Updated `axis-breathe` to oscillate 0.4->0.8 opacity + scale pulse.
- `src/App.jsx`: Version bump v3.16.5.

**Changes**:

- **Axis Visibility**: Switched from `screen` to `overlay`, increased opacity range (0.4-0.8), widened mask to 80%.
- **Fog Removal**: Reduced Optical Lens opacity to 0.15 (was 0.4) and Shadow to 0.3 (was 0.4).
- **Motion**: Added slight `scaleX` breathing to the axis animation for organic feel.

**Version**: v3.16.5

**Status**: COMPLETED

---

## 2026-01-09 11:05 - Gemini - COMPLETED

**Task**: Refine Avatar Orb Polishing (Axis, Motion, Clarity)

**Files Modified**:

- `src/components/avatar/OrbCore.jsx`: Added internal axis, slow breathing motion, reduced lens opacity.
- `src/App.css`: Added `axis-breathe` and `breathingPulse` keyframes.
- `src/App.jsx`: Version bump to v3.16.4.

**Changes**:

- **Internal Axis**: Added a vertical spine with gradient and mask (Step 1).
- **Motion**: Added `axis-breathe` animation (10s cycle) to the axis (Step 2).
- **Clarity**: Reduced transparency of Optical Lens (0.8 -> 0.4) and Shadow (0.6 -> 0.4) to remove "misty" look (Step 3).
- **Scalability**: Added configuration logic for axis type/intensity/pulse to `variantProps`.

**Version**: v3.16.4

**Status**: COMPLETED

**Notes**:

- `breathingPulse` was missing from `App.css` but used in `AvatarContainer.jsx`, so I added it to ensure consistency.
- The axis is parameterized for future variants (e.g., horizontal, radial).

---

## 2026-01-08 — Light Mode Avatar System Implementation

### Summary

Implemented complete light mode orb-based avatar system with crossfade animation, replacing the sigil-based rendering for light mode while preserving dark mode functionality.

### Asset Generation

- **Generated via ComfyUI MCP**: Created new avatar assets with parchment-compatible aesthetic
  - Orb loop frames (8 generated, 4 kept): `orb_loop_light_0003–0006.png`
  - Particle frames (8 generated, 3 kept): `orb_particles_light_0003–0005.png`
  - Frame ring: `avatar_frame_light.png`
  - Instrument ring: `avatar_instrument_light.png`
  - Glow layer: `orb_glow_light.png`
- **Asset Processing**: Created Python scripts for transparency processing and composite verification
  - `tools/bulk_process_transparency.py`: Batch converts black backgrounds to alpha
  - `tools/verify_composite.py`: Generates test composites for validation
  - `tools/final_composite_test.py`: Creates final 320×320 and 96×96 test renders
- **Asset Pruning**: Removed rejected frames based on style criteria
  - Discarded orb frames 0001–0002 (too cloudy/dull), 0007–0008 (too dark/murky)
  - Discarded particle frames 0001–0002, 0006–0008 (too visible/distracting)
  - Deleted all preview assets (parchment background versions)

### Component Implementation

- **Created `src/components/avatar/OrbCore.jsx`**:
  - Crossfade animation system for orb loop (4 frames, 14s cycle)
  - Particle layer with offset timing (3 frames, 21s cycle, 2s offset)
  - Instrument ring with 120s CSS rotation
  - Static glow layer with reduced opacity
  - Reduced mode support for Sakshi/Vipassana practices
  - Circular clipping wrapper to eliminate transparency artifacts
- **Modified `src/components/avatar/StaticSigilCore.jsx`**:
  - Added conditional rendering: OrbCore for light mode, sigil for dark mode
  - Imported and integrated OrbCore component
- **Modified `src/components/vipassana/MiniAvatar.jsx`**:
  - Updated to use reduced OrbCore (96×96) for light mode
  - Preserved simple circle design for dark mode
- **Modified `src/components/Avatar.css`**:
  - Added `@keyframes instrumentRotate` for instrument ring animation

### Animation Specifications

**Full Mode:**

- Orb loop: 4-frame crossfade, 14s total (3.5s/frame), 1000ms ease-in-out fade
- Particles: 3-frame crossfade, 21s total (7s/frame), 1200ms ease-in-out fade, 2s offset, opacity 0.22
- Instrument ring: 120s linear rotation, opacity 0.18
- Glow: Static, opacity 0.18, 96% scale, positioned behind orb (z-index: 1)

**Reduced Mode (Sakshi/Vipassana):**

- Orb loop only (same 4 frames)
- Frame ring only
- No instrument ring, particles, or glow

### Critical Fixes Applied

1. **Circular Clipping Wrapper**: Added `border-radius: 50%` + `overflow: hidden` wrapper around all orb layers to eliminate checkerboard transparency artifacts
2. **Glow Repositioning**: Moved glow behind orb (z-index: 1 vs orb z-index: 2), reduced opacity from 0.35 → 0.18, scaled to 96%
3. **Orb Sizing**: Reduced orb diameter from 235px → 228px (7px reduction) to maintain 12px gap with frame ring

### Proportions (320×320 container)

- Frame outer: 302px (94.375%)
- Instrument ring: 270px (84.375%)
- Orb diameter: 228px (71.25%)
- Gap (orb ↔ frame): ~12px

### Performance Guardrails

- Opacity and transform only (no layout-affecting properties)
- CSS-based animations (React state only for frame swapping)
- No blur animations
- Pauses during practice (`isPracticing === true`)
- Total animated layers: 3 (orb loop, particles, instrument ring)

### Style Compliance

- **Aesthetic**: Parchment-compatible, contemplative, refined, instrument-like
- **Mood**: Calm, ancient, intentional
- **Surface language**: Ceramic, stone, glass, ink, patina
- **Lighting**: Soft ambient, no hard rim glow
- **Color saturation**: Restrained, earthy, mineral-based (muted teal/jade tones)

### Photic Circles UI Cleanup

- **Removed instruction text**: Deleted "Tap to exit • Drag to adjust spacing" overlay text
- **Pure black background**: Changed from `rgba(0, 0, 0, 0.95)` to `#000000` for clean interface

### Documentation

- **Created `docs/AVATAR_ANIMATION_IMPLEMENTATION.md`**: Comprehensive documentation of animation system, asset specifications, layer stack, and performance guardrails
- **Updated `docs/ARCHITECTURE.md`**: (Pending) Add Avatar System section documenting dual-mode rendering

### Files Modified

**New:**

- `src/components/avatar/OrbCore.jsx`
- `tools/bulk_process_transparency.py`
- `tools/verify_composite.py`
- `tools/final_composite_test.py`
- `docs/AVATAR_ANIMATION_IMPLEMENTATION.md`

**Modified:**

- `src/components/avatar/StaticSigilCore.jsx`
- `src/components/vipassana/MiniAvatar.jsx`
- `src/components/Avatar.css`
- `src/components/PhoticCirclesOverlay.jsx`

**Assets:**

- `public/assets/avatar_v2/` (11 production assets + 3 test composites)

### Validation Results

✅ No checkerboard artifacts  
✅ Orb feels seated, not pressed against frame  
✅ Glow barely noticeable unless staring  
✅ At rest, avatar feels still  
✅ Motion only noticeable after ~5 seconds  
✅ At 96×96, motion barely detectable  
✅ Reads as calm, intentional, expensive

### Next Steps

- Monitor performance on mobile devices
- Consider adding subtle particle opacity variation for organic feel
- Evaluate user feedback on animation timing

---

## 2026-01-08 Photic Circles UI Cleanup

### Changes

- **Removed instruction text**: Deleted "Tap to exit Drag to adjust spacing" overlay text for clean interface
- **Pure black background**: Changed from `rgba(0, 0, 0, 0.95)` to `#000000`
- **Updated z-index**: Changed from 1000 to 2000 for proper layering

### Master Optical System

- **Generated 3 Museum-Grade Assets**:
  - `optical_lens.png`: Circular convex crystal glass with realistic refraction.
  - `optical_highlight.png`: Asymmetrical specular catch-lights.
  - `optical_shadow.png`: Radial inner shadow for depth illusion.
- **Implemented Layered Optical Stack**:
  - Added new depth-suggesting shadow mask (z-index 2).
  - Added refraction-simulating lens overlay (z-index 3).
  - Added surface catch-light highlights (z-index 4).
  - Result: Gem cores now feel seated behind curved crystal glass, satisfying the "museum-grade" constraint.

### Files Modified

- `src/components/PhoticCirclesOverlay.jsx`

### Result

- Clean, distraction-free interface during photic entrainment
- Tap-to-exit and drag-to-adjust functionality preserved (unlabeled)
- Pure black background eliminates any visual artifacts

## 2026-01-08 — Jewel Authority Asset Generation (Unit Test)

### Summary

Generated the first set of "Jewel Authority" assets for the SEEDLING stage using the new AVATAR_JEWEL_SPEC. These assets focus on the jewel itself as the continuous object, without external frames or sigils, following the topological deformation rules.

### Assets Generated (Seedling Stage)

- **SEEDLING_DHYANA_EKAGRATA**: Precision deformation, steady internal glow. [Indigo]
- **SEEDLING_PRANA_SAHAJA**: Flowing deformation, breathing glow. [Indigo]
- **SEEDLING_DRISHTI_VIGILANCE**: Faceted deformation, scanning light. [Indigo]

### Process

1. **Prompt Engineering**: Applied the new template-based prompt logic from `AVATAR_JEWEL_SPEC.md`.
2. **Generation**: Used ComfyUI MCP to generate 1024x1024 raw images on pure black backgrounds.
3. **Transparency Processing**: Updated `tools/bulk_process_transparency.py` to target the `public/avatars/` directory and processed raw outputs into production-ready transparent PNGs.

### Validation Checklist

- [x] **Jewel Authority**: Recognizably the "Seedling" material; feels manufactured; single continuous object.
- [x] **Path Deformation**: Dhyana (Symmetric), Prana (Flowing), Drishti (Faceted) clearly distinguishable.
- [x] **Negative Compliance**: No mandalas, sigils, symbols, or text detected.
- [x] **Technical**: 512x512 (processed), Correct Alpha channel, Black-to-Alpha conversion successful.

### Files Created

- `public/avatars/seedling_dhyana_ekagrata.png`
- `public/avatars/seedling_prana_sahaja.png`
- `public/avatars/seedling_drishti_vigilance.png`

## 2026-01-08 — Jewel Authority Matrix (15 Assets Audit)

### Summary

Successfully expanded the Jewel Authority unit test to a full 15-asset matrix covering all 5 Stages (Seedling, Ember, Flame, Beacon, Stellar) and all 3 major Path/Vector combinations.

### Assets Generated

- **Seedling (Indigo)**: Dhyana/Ekagrata, Prana/Sahaja, Drishti/Vigilance
- **Ember (Orange)**: Prana/Ekagrata, Prana/Sahaja, Prana/Vigilance
- **Flame (Gold)**: Dhyana/Ekagrata, Dhyana/Sahaja, Dhyana/Vigilance
- **Beacon (Cyan)**: Drishti/Ekagrata, Drishti/Sahaja, Drishti/Vigilance
- **Stellar (Violet)**: Jnana/Ekagrata, Jnana/Sahaja, Jnana/Vigilance

### Findings

- **Visual Consistency**: All assets adhere to the "Single Continuous Jewel" principle. No external UI halos, frames, or text.
- **Stage Topology**:
  - **Dhyana/Jnana**: Precision facets and clean symmetry.
  - **Prana**: Organic, flowing "liquid crystal" topology.
  - **Drishti**: Analytical, multi-lensed cuts.
- **Integration**: The `VerificationGallery` component was fixed to correctly map these assets into the `OrbCore` vessel frames for visual audit.
- **Transparency**: All 15 assets were bulk-processed from black backgrounds to transparent PNGs using the `bulk_process_transparency.py` tool.

## 2026-01-08 — Jewel Authority: Path Coverage Complete (30 Assets)

### Summary

Generated the missing Path variations (using the EKAGRATA vector) for all 5 Stages. This completes the 30-asset baseline required to lock the system's geometry.

### Assets Generated

- **Full Ekagrata Matrix (30 Assets)**: 5 Stages × 6 Paths (Soma, Prana, Dhyana, Drishti, Jnana, Sakshi).

### 🔒 GEOMETRY LOCKED

- **Topology Finalized**: Each Path now has a canonical deformation logic that scales from Seedling to Stellar.
- **Ceiling Verified**: `Stellar Jnana Ekagrata` confirmed as the complexity ceiling. No generated asset surpasses its level of detail or "prestige."
- **Immutable Logic**: Deformation is now frozen. Future assets (Sahaja/Vigilance) will only vary internal light behavior and physics, keeping the base geometry identical.

### Next Steps

- Proceed to **Vector Expansion** (60 remaining assets).
- Generate Sahaja (Flowing) and Vigilance (Faceted/Dynamic) light behaviors for the locked geometries.

### Next Steps

- Integrate asset selection logic into production `OrbCore`.
- Generate the full 90-asset set (18 variants per stage).
- Capture regression anchors for final sign-off.
