# AVATAR RETROFIT MAPPING
## Phase 1 — Reverse-Mapping Existing Assets to Stage/Path/Vector

**Date**: 2025-12-28  
**Purpose**: Systematically tag existing avatar assets with their Stage, Path, and Vector attributes

---

## Existing Asset Inventory

### Current Naming Convention

Found in `dist/avatars/`:
- **Pattern 1**: `{Stage}-{Mode}.png` (e.g., `Flame-Dhyana.png`)
- **Pattern 2**: `avatar-{stage}-{mode}-{path}_00001_.png` (e.g., `avatar-flame-dhyana-ekagrata_00001_.png`)

### Mode → Path Mapping Hypothesis

Based on existing naming, the "mode" appears to correlate with paths:

| Current Mode | Likely Path | Rationale |
|--------------|-------------|-----------|
| **Dhyana** | Ekagrata? | Meditation = single-pointed focus |
| **Drishti** | Vigilance? | Gaze/vision = watchful awareness |
| **Jnana** | ? | Knowledge path |
| **Prana** | Sahaja? | Breath = natural flow |
| **Samyoga** | ? | Union/integration |
| **Soma** | ? | Embodiment |

**Issue**: The 6 modes don't map cleanly to 3 paths. Need clarification.

---

## Retrofit Strategy

### Option A: Strict Mapping (Recommended)

Only retrofit assets that clearly fit the 3-path model:
- Ekagrata (precision-cut)
- Sahaja (natural flow)
- Vigilance (multi-faceted)

**Action**: Review each existing asset and tag only those that pass Jewel Lock validation.

### Option B: Expand Path Definitions

Define 6 paths instead of 3 to match existing modes.

**Risk**: Violates the simplicity of the 3-axis model.

---

## Retrofit Workflow

For each existing avatar asset:

1. **Visual Inspection**: Does it pass Jewel Lock criteria?
   - Single continuous jewel?
   - No mandalas/sigils?
   - Smooth silhouette?

2. **Stage Identification**: Which baseline does it derive from?
   - Seedling, Ember, Flame, Beacon, or Stellar?

3. **Path Classification**: What deformation is applied?
   - Ekagrata (precision-cut)?
   - Sahaja (natural flow)?
   - Vigilance (multi-faceted)?
   - Or UNKNOWN if unclear?

4. **Vector Classification**: What light behavior is present?
   - Stable (steady glow)?
   - Variable (scintillation)?
   - Diffuse (soft bloom)?
   - Or NEUTRAL if baseline?

5. **Tag Assignment**: Create metadata file
   ```json
   {
     "stage": "FLAME",
     "path": "Ekagrata",
     "vector": "Stable",
     "sourceFile": "avatar-flame-dhyana-ekagrata_00001_.png",
     "validated": true,
     "notes": ""
   }
   ```

---

## Sample Retrofit (Flame-Dhyana)

**File**: `dist/avatars/Flame-Dhyana.png`

### Analysis
- **Stage**: FLAME (gold palette, 4-5 rings) ✅
- **Path**: Likely Ekagrata (appears symmetric, clean cuts)
- **Vector**: Likely Stable (steady glow, no obvious jitter)

### Proposed Tag
```json
{
  "stage": "FLAME",
  "path": "Ekagrata",
  "vector": "Stable",
  "sourceFile": "Flame-Dhyana.png",
  "validated": false,
  "notes": "Needs visual confirmation of path/vector"
}
```

---

## Next Steps

1. **Clarify Mode → Path mapping** with user
2. **Create metadata directory**: `public/avatars/metadata/`
3. **Batch process existing assets**: Generate JSON tags for all
4. **Validation pass**: Review and approve/reject each tag
5. **Update AVATAR_SYSTEM.md**: Document the retrofit results

---

## Questions for User

1. **Do the 6 modes (Dhyana, Drishti, Jnana, Prana, Samyoga, Soma) map to the 3 paths?**
   - If yes, what's the mapping?
   - If no, should we expand to 6 paths or filter to 3?

2. **Should we retrofit ALL existing assets or only those that pass Jewel Lock validation?**
   - Strict: Only jewel-like assets
   - Permissive: All assets, mark invalid ones

3. **What's the priority?**
   - Complete retrofit first, then generate new variations?
   - Or skip retrofit and focus on generating new Jewel Lock-compliant assets?
