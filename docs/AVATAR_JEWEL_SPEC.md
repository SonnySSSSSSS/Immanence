# AVATAR JEWEL SPECIFICATION
## Canonical Ontology for Immanence OS Avatar System

> **Core Principle**: The avatar IS a jewel. It does not represent a jewel. It IS the jewel.
> All transformations happen TO this jewel. No prompt may invent a new object.

---

## 1. JEWEL MASTER FORM (Phase 0)

### 1.1 What IS the Jewel?

The avatar is a **single continuous energy-crystal object** with these invariant properties:

| Property | Constraint |
|----------|------------|
| **Topology** | Closed 3D volume, never flat, never fragmented |
| **Material** | Polished gemstone / crystalline energy |
| **Light** | Subsurface refraction, internal glow |
| **Count** | Exactly ONE object per avatar |
| **Silhouette** | External silhouette may only change via smooth deformation; no protrusions, spokes, or radial appendages |

### 1.2 Canonical Baselines (5 Jewels)

Each Stage has exactly ONE canonical jewel form that defines its shape:

| Stage | Baseline File | Ring Count | Color Palette |
|-------|---------------|------------|---------------|
| **SEEDLING** | [`seedling-core.png`](file:///d:/Unity%20Apps/immanence-os/public/avatars/baselines/seedling-core.png) | 6-7 rings | Indigo (#818cf8, #6366f1) |
| **EMBER** | [`ember-core.png`](file:///d:/Unity%20Apps/immanence-os/public/avatars/baselines/ember-core.png) | 5-6 rings | Orange (#fb923c, #f97316) |
| **FLAME** | [`flame-core.png`](file:///d:/Unity%20Apps/immanence-os/public/avatars/baselines/flame-core.png) | 4-5 rings | Gold (#fcd34d, #f59e0b) |
| **BEACON** | [`beacon-core.png`](file:///d:/Unity%20Apps/immanence-os/public/avatars/baselines/beacon-core.png) | 3-4 rings | Cyan (#22d3ee, #06b6d4) |
| **STELLAR** | [`stellar-core.png`](file:///d:/Unity%20Apps/immanence-os/public/avatars/baselines/stellar-core.png) | 2-3 rings | Violet (#a78bfa, #8b5cf6) |

**Location**: `public/avatars/baselines/`

**Selection criteria**:
- Feels manufactured, not illustrated
- Implies cutting, polishing, refinement
- Rewards long looking
- Scales upward without becoming louder
- **Topology precedence over beauty** — correctness wins over prettiness

---

## 2. STAGE = Material Refinement (Phase 1)

Stage transforms the jewel's **substance**, not its shape.

### What Stage Controls

| Attribute | Description |
|-----------|-------------|
| Color palette | Stage-specific hues only |
| Ring refinement | Edge sharpness, clarity |
| Material density | Opacity, internal depth |
| Internal complexity | Detail resolution, layer count |

### What Stage FORBIDS

- ❌ Changing silhouette
- ❌ Adding new geometry families
- ❌ Introducing symbols
- ❌ Altering ring count beyond stage spec

---

## 3. PATH = Geometry & Mode (Phase 2)

Path applies a **deformation field** to the jewel, defining the *mode of participation*.
All 6 Paths are available at all 5 Stages. There is no hierarchy between paths.

### 3.1 Geometry-to-Path Mapping

The 6 Paths are expressed through 3 fundamental **Deformation Families**:

| Deformation Family | Description | Primary Path(s) |
|--------------------|-------------|-----------------|
| **Precision** | Symmetry, coherence, clean facets | **DHYANA**, **JNANA** |
| **Flowing** | Organic curves, smooth undulations | **PRANA**, **SOMA** |
| **Faceted** | Irregular faceting, multi-lensed | **DRISHTI** |

*Note: **SAMYOGA** may utilize any deformation family as it represents integration/balance.*

### 3.2 Path Definitions

| Path | Geometry | Visual Expression |
|------|----------|-------------------|
| **DHYANA** | Precision | Perfect radial symmetry, minimal turbulence, single-pointed focus. |
| **PRANA** | Flowing | Directional currents, circulatory energy, vital and organic. |
| **DRISHTI** | Faceted | Multi-faceted analytical cuts, orienting quality, multiple lenses. |
| **JNANA** | Precision | Rides on Precision/Faceted geo; expressed through sharp light boundaries. |
| **SOMA** | Flowing | Rides on Flowing geo; expressed through soft, enveloping, restorative glow. |
| **SAMYOGA** | Any | Harmonized light behavior; no dominant deformation bias; integration. |

---

## 4. ATTENTION VECTOR = Internal Energy Behavior (Phase 3)

Vectors affect ONLY light physics and energy behavior. They NEVER add shapes.
Classification is based on **Internal Energy Behavior**.

> **Vector Blind Test**: If a reviewer can correctly classify the Attention Vector from a grayscale silhouette alone, the asset fails validation.

### 4.1 EKAGRATA (Stable)

**Metaphor**: Coherent focus

| Attribute | Value |
|-----------|-------|
| Glow | Steady internal glow, constant intensity |
| Pulse | 1 Hz, 10% variation |
| Coherence | Long, sustained, perfectly periodic |
| Motion | Minimal, centered |

### 4.2 SAHAJA (Natural)

**Metaphor**: Flowing breath

| Attribute | Value |
|-----------|-------|
| Glow | Breathing glow, soft undulations |
| Pulse | 0.5 Hz, organic modulation |
| Coherence | Fluid, continuous |
| Motion | Gentle drift, undulating light |

### 4.3 VIGILANCE (Scanning)

**Metaphor**: Analytical awareness

| Attribute | Value |
|-----------|-------|
| Glow | Scintillating, angular light |
| Pulse | Fragmented, variable frequency |
| Coherence | High-frequency "searching" energy |
| Motion | Jittered, exploratory shifting |

---

## 5. MANDATORY NEGATIVE CONSTRAINTS

Every generation prompt MUST include these negatives:

### Hard Negatives (Always Include)

```
Do not create mandalas
Do not create sigils
Do not create symbolic diagrams
Do not create flat glyphs
Do not create sacred geometry patterns
Do not create spiritual symbols
Do not create text or inscriptions
```

### Positive Constraints (Always Include)

```
Single continuous jewel-like object
Subsurface light refraction
Polished gemstone or energy crystal
Three-dimensional depth
Internal light source
```

---

## 6. PROMPT TEMPLATE

### Standard Generation Format

```
[STAGE]: {stage_name}
Material: {color_palette}, {ring_count} internal rings
Refinement: {material_description}

[PATH]: {path_name}
Deformation: {path_fragment}

[VECTOR]: {vector_name}
Light Physics: {vector_fragment}

[OBJECT LOCK]:
Single continuous jewel-like object
Subsurface light refraction
Polished energy crystal
Three-dimensional volumetric form

[FORBIDDEN]:
No mandalas, no sigils, no symbolic diagrams
No flat glyphs, no sacred geometry patterns
No spiritual symbols, no text, no inscriptions
No multiple objects, no fragmentation
```

---

## 7. VALIDATION CHECKLIST

Before accepting any generated avatar:

### Jewel Authority
- [ ] Is this recognizably the SAME jewel as the stage baseline?
- [ ] Does it feel manufactured, not illustrated?
- [ ] Is it a single continuous object?

### Stage Integrity
- [ ] Does color match the stage palette?
- [ ] Is ring count within stage spec?
- [ ] Is material refinement stage-appropriate?

### Path Deformation
- [ ] Is the deformation applied to the jewel, not a new form?
- [ ] Can you identify the path by cut style alone?
- [ ] Does topology remain unchanged?

### Vector Light Physics
- [ ] Is the light behavior correct for the vector?
- [ ] Could you NOT identify the vector by silhouette?
- [ ] Does light affect only glow/pulse/scatter?

### Negative Check
- [ ] No mandalas or sigils present?
- [ ] No flat symbolic diagrams?
- [ ] No text or inscriptions?
- [ ] No multiple objects?

---

## 8. NEXT STEPS

1. **Select 5 Baseline Jewels**: Review existing assets, tag the canonical baseline per stage
2. **Retrofit Tags**: Map existing successful avatars to Stage/Path/Vector
3. **Test Deformation**: Generate one Path variation per baseline (3 × 5 = 15)
4. **Test Light Physics**: Generate one Vector variation per baseline (3 × 5 = 15)
5. **Cross-Validation**: Verify independence of axes
