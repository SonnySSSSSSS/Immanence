# Avatar Animation Implementation - Light Mode Orb System

**Date:** 2026-01-08  
**Status:** ✅ COMPLETE

---

## Asset Set (Final)

All assets located in: `public/assets/avatar_v2/`

### Production Assets (Transparent)

- **Orb Loop:** `orb_loop_light_0003.png` through `orb_loop_light_0006.png` (4 frames)
- **Particles:** `orb_particles_light_0003.png` through `orb_particles_light_0005.png` (3 frames)
- **Frame Ring:** `avatar_frame_light.png`
- **Instrument Ring:** `avatar_instrument_light.png`
- **Glow:** `orb_glow_light.png`

### Proportions (320×320 container)

- **Orb diameter:** ~235px (73.4375%)
- **Frame outer:** ~302px (94.375%)
- **Instrument ring:** ~270px (84.375%)
- **Gap (orb ↔ frame):** ~12px

---

## Animation Specifications

### 1. Orb Loop (Primary Motion)

- **Method:** Crossfade PNG frames
- **Frames:** 4 (orb_loop_light_0003–0006)
- **Total loop duration:** 14 seconds
- **Per-frame duration:** 3.5 seconds
- **Fade transition:** 1000ms ease-in-out
- **Behavior:** One frame visible at a time, smooth crossfade
- **Pause condition:** `isPracticing === true`

### 2. Orb Particles (Secondary Motion)

- **Method:** Crossfade PNG frames
- **Frames:** 3 (orb_particles_light_0003–0005)
- **Total loop duration:** 21 seconds
- **Per-frame duration:** 7 seconds
- **Fade transition:** 1200ms ease-in-out
- **Opacity cap:** 0.22 (22%)
- **Timing offset:** 2 seconds from orb loop (NOT synchronized)
- **Pause condition:** `isPracticing === true` OR `reduced === true`

### 3. Instrument Ring (Optional Rotation)

- **Method:** CSS rotation
- **Animation:** `instrumentRotate 120s linear infinite`
- **Opacity:** 0.18 (18%)
- **Pause condition:** `isPracticing === true`
- **Disabled in:** Reduced mode (Sakshi/Vipassana)

### 4. Orb Glow (Static)

- **Method:** Static image
- **Opacity:** 0.35 (reduced ~40% from original)
- **Blend mode:** `screen`
- **Masking:** Radial gradient (88% black, 100% transparent)
- **Disabled in:** Reduced mode

---

## Layer Stack (Z-Index Order)

```
Background (parchment CSS)
  ↓
Frame Ring (z-index: 1)
  ↓
Instrument Ring (z-index: 2, opacity: 0.18)
  ↓
Orb Loop (z-index: 3)
  ↓
Orb Particles (z-index: 4, opacity: 0.22)
  ↓
Orb Glow (z-index: 5, opacity: 0.35, blend: screen)
```

---

## Performance Guardrails

✅ **Total animated layers:** 3 (orb loop, particles, instrument ring)  
✅ **No blend modes** beyond `normal` and `screen`  
✅ **No `filter: blur()` animations**  
✅ **Opacity and transform only** (no layout-affecting properties)  
✅ **CSS-based** (no JS timelines, React state only for frame swapping)

---

## Reduced Avatar Mode

**Used in:** Sakshi / Vipassana / Insight Meditation

**Includes:**

- Orb loop only (same 4 frames)
- Frame ring only

**Excludes:**

- Instrument ring
- Particles
- Glow

**Animation:** Same crossfade, or static (first frame only)

---

## Implementation Files

### New Components

- **`src/components/avatar/OrbCore.jsx`** - Main orb animation component

### Modified Components

- **`src/components/avatar/StaticSigilCore.jsx`** - Conditional rendering (light mode → OrbCore, dark mode → existing sigil)
- **`src/components/vipassana/MiniAvatar.jsx`** - Uses reduced OrbCore for light mode

### CSS Animations

- **`src/components/Avatar.css`** - Added `@keyframes instrumentRotate`

---

## Validation Checklist

### At Rest

- ✅ Avatar feels still
- ✅ Motion only noticeable after ~5 seconds
- ✅ Nothing draws attention away from practice

### At 96×96

- ✅ Motion barely detectable
- ✅ Reads as calm, intentional, expensive

### Performance

- ✅ No FPS drops on mobile
- ✅ Smooth crossfades
- ✅ Minimal CPU/GPU usage

---

## Style Compliance

✅ **Parchment-compatible** - Muted teal/jade tones  
✅ **Contemplative** - Slow, organic motion  
✅ **Refined** - No comic book, neon, or sci-fi aesthetics  
✅ **Instrument-like** - Precision, not decoration  
✅ **Ancient relic** - Mineral glass, ceramic, stone surfaces

**Hard rejections avoided:**

- ❌ Neon edges
- ❌ Cyan/purple glow
- ❌ "Magic orb" fantasy look
- ❌ Comic/game UI vibes
- ❌ Holographic effects
- ❌ High-contrast rim lighting

---

## Notes

- All animations pause during practice (`isPracticing === true`)
- Particle layer offset prevents visual synchronization with orb loop
- Instrument ring rotation is imperceptible at 120s duration
- Glow is clipped to orb bounds via radial gradient mask
- Light mode uses OrbCore, dark mode preserves existing sigil-based rendering
