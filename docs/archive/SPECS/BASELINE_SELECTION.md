# CANONICAL BASELINE JEWEL SELECTION
## Phase 0 — Jewel Lock Establishment

**Date**: 2025-12-28  
**Purpose**: Identify and formalize the 5 canonical baseline jewels (one per Stage)

---

## Candidate Review

### Existing "Core" Assets

Found in `dist/avatars/`:
- `seedling-core.png` (1.19 MB)
- `ember-core.png` (1.44 MB)
- `flame-core.png` (1.41 MB)
- `beacon-core.png` (374 KB)
- `stellar-core.png` (434 KB)

**Initial Assessment**: These appear to be pre-existing baseline candidates. Need to verify they meet Jewel Lock criteria.

### Alternative Candidates

The directory also contains:
- **Stage-Mode combinations** (e.g., `Flame-Dhyana.png`, `Beacon-Soma.png`)
- **Stage-Mode-Path combinations** (e.g., `avatar-flame-dhyana-ekagrata_00001_.png`)

**Note**: The naming suggests these are already variations, not neutral baselines.

---

## Selection Criteria (from AVATAR_JEWEL_SPEC.md)

Each baseline must:
- ✅ Feel manufactured, not illustrated
- ✅ Imply cutting, polishing, refinement
- ✅ Reward long looking
- ✅ Scale upward without becoming louder
- ✅ Single continuous jewel-like object
- ✅ Subsurface light refraction visible
- ✅ No mandalas, sigils, or symbolic diagrams
- ✅ **Topology precedence over beauty** — if a core asset is less beautiful but more topologically correct, it wins

> **Rationale**: Some of the prettiest assets are already path- or vector-influenced. Baselines must survive deformation; prettiness is secondary.

---

## SELECTED BASELINES

### Seedling_Base
**File**: `dist/avatars/seedling-core.png`  
**Stage Spec**: 6-7 internal rings, Indigo (#818cf8, #6366f1)  
**Validation**:
- [ ] Jewel authority confirmed
- [ ] Ring count matches spec
- [ ] Color palette matches stage
- [ ] Silhouette is smooth, no protrusions

**Notes**: _[To be filled after visual inspection]_

---

### Ember_Base
**File**: `dist/avatars/ember-core.png`  
**Stage Spec**: 5-6 internal rings, Orange (#fb923c, #f97316)  
**Validation**:
- [ ] Jewel authority confirmed
- [ ] Ring count matches spec
- [ ] Color palette matches stage
- [ ] Silhouette is smooth, no protrusions

**Notes**: _[To be filled after visual inspection]_

---

### Flame_Base
**File**: `dist/avatars/flame-core.png`  
**Stage Spec**: 4-5 internal rings, Gold (#fcd34d, #f59e0b)  
**Validation**:
- [ ] Jewel authority confirmed
- [ ] Ring count matches spec
- [ ] Color palette matches stage
- [ ] Silhouette is smooth, no protrusions

**Notes**: _[To be filled after visual inspection]_

---

### Beacon_Base
**File**: `dist/avatars/beacon-core.png`  
**Stage Spec**: 3-4 internal rings, Cyan (#22d3ee, #06b6d4)  
**Validation**:
- [ ] Jewel authority confirmed
- [ ] Ring count matches spec
- [ ] Color palette matches stage
- [ ] Silhouette is smooth, no protrusions

**Notes**: _[To be filled after visual inspection]_

---

### Stellar_Base
**File**: `dist/avatars/stellar-core.png`  
**Stage Spec**: 2-3 internal rings, Violet (#a78bfa, #8b5cf6)  
**Validation**:
- [ ] Jewel authority confirmed
- [ ] Ring count matches spec
- [ ] Color palette matches stage
- [ ] Silhouette is smooth, no protrusions

**Notes**: _[To be filled after visual inspection]_

---

## Next Steps

1. **Visual Inspection**: Review each `*-core.png` file against validation criteria
2. **Formal Tagging**: Copy selected baselines to `public/avatars/baselines/` with canonical names
3. **Documentation**: Update AVATAR_JEWEL_SPEC.md with baseline file references
4. **Topology Lock**: Extract silhouette/geometry specs from each baseline for future deformation constraints

---

## Rejection Criteria

If any baseline fails validation:
- **Fallback Option 1**: Select from existing Stage-Mode combinations (e.g., `Flame-Dhyana.png`)
- **Fallback Option 2**: Generate new baseline using strict Jewel Lock prompt
- **Fallback Option 3**: Use user-provided reference image

**Critical**: No baseline may be accepted if it contains mandalas, sigils, or symbolic diagrams.
