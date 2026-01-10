/_ AVATAR OPTICAL SYSTEM CONTRACT - LIGHT MODE _/
/_ ------------------------------------------ _/
/\* 1. IMMUTABLE VESSEL (The Stage)

- Frame, Instrument Ring, Optical Lens, Highlights, Inner Shadow.
- These are constant. No visual drift allowed.

2.  PARAMETER SCOPE (Surgical Isolation)

- hueShift, luminance, contrast, saturation, scale.
- Applies ONLY to the mineral core image (z-index 1).
- NEVER propagates to lens, frame, or highlights.

3.  SEAT INTEGRITY (Hard Mask)

- 2px radial feather mask on the core container is MANDATORY.
- object-fit: cover is the only allowed fitting mode.

4.  ENERGY GUARDRAILS

- Loop: Crossfade only. No core rotation.
- Particles: Opacity ≤ 0.22.
- Glow: Opacity ≤ 0.40, ambient only.

5.  VIOLATIONS

- Any per-gem manual optics tweaking (e.g. "making the lens look better for this one") is a bug.
  \*/
