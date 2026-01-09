# Avatar Container + Core System (Final Specification)

## Goal

Build a fixed container and a swappable core system that supports 90 avatar variations using existing Avatar Philosophy.

## Part 1 — Container (Fixed)

These assets **NEVER** change per avatar. They are the immutable vessel.

1.  **`avatar_container_frame.png`**

    - **Description**: Stone / parchment ring. Opaque. No transparency _inside_ the ring material itself (center hole is transparent).
    - **Z-Index**: High (Top). Sits _above_ the core to mask rough edges.

2.  **`avatar_container_glass.png`**

    - **Description**: Subtle lens highlight. Mostly transparent. Soft specular arcs only.
    - **Z-Index**: Medium (Above Core).

3.  **`avatar_container_shadow.png`**

    - **Description**: Inner radial shadow. Transparent outside. Very soft falloff.
    - **Z-Index**: Low (Behind Core or Multiply over Core).

4.  **`avatar_container_mask.png`**
    - **Description**: Perfect white circle on transparent background.
    - **Usage**: Defines the visible core area. Used for CSS masking or Canvas clipping.

## Part 2 — Core Avatar Assets (90 Total)

- **Size**: 512×512
- **Format**: Full bleed circle (no frame, no glass, no shadow).
- **Naming**: `core_[stage]_[path]_[variant].png`

### Axis Breakdown

1.  **Stage (5)**: Material + Complexity (Seedling, Ember, Flame, Beacon, Stellar).
2.  **Path (6)**: Shape/Silhouette (Dhyana, Prana, Drishti, Jnana, Soma, Samyoga).
3.  **Variant (3)**: Internal differences (Texture, Density, Structure).

## Part 3 — Layer Order (Bottom → Top)

1.  **Background** (Ambient Glow)
2.  **Shadow** (`avatar_container_shadow.png`)
3.  **Core** (Masked by `avatar_container_mask.png`)
4.  **Glass** (`avatar_container_glass.png`)
5.  **Frame** (`avatar_container_frame.png`)
6.  **Glow/Particles** (Dynamic)

## Part 4 — Attention Vectors

Handled by **Animation Only**:

- Pulse speed
- Glow intensity
- Jitter / smoothness
- **Rule**: Never change core shape or color via Attention (only Core assets change).

## Definition of Done

- Container never changes.
- Only core PNG swaps.
- Any of the 90 cores fits cleanly.
- No visual ambiguity between Stage vs Path.
