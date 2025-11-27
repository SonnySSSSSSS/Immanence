# Immanence OS - Avatar Star 3D Development Status

**Last Updated:** November 27, 2025  
**Current Phase:** Ring Animation Implementation (PROBLEMATIC)

---

## CRITICAL ISSUE - Ring Rotation Not Working

### The Problem
SVG ring overlay is rendering with Perlin noise distortion, but rotation direction alternation is NOT working visually:

- **Rings 0 and 4 (even indices):** Should rotate clockwise (+0.5 speed) → NOT MOVING
- **Rings 1 and 3 (odd indices):** Should rotate counter-clockwise (-0.5 speed) → MOVING COUNTER-CLOCKWISE
- **Ring 2 (even index):** Should rotate clockwise (+0.5 speed) → MOVING COUNTER-CLOCKWISE

All visible rings move counter-clockwise. Rings 0 and 4 completely static.

### What We Know
1. **Math is correct:** Console logging confirms spinDirection alternates correctly (1, -1, 1, -1, 1)
2. **Angles are correct:** rotatedAngle values show positive/negative alternation as expected
3. **Noise masking hypothesis:** Rotation magnitude (0.15 then 0.5 radians/frame) may be drowned out by Perlin noise wobbling
4. **Not a code sync issue:** File updates ARE reaching local dev server
5. **No JavaScript errors:** Console completely clean

### Failed Debugging Attempts
- Increased rotation speed from 0.03 → 0.15 → 1.5 → 0.5 (current)
- Added per-ring independent direction angles (ringDirectionAngle varies per ring)
- Added staggered tendril phase shifts
- Console logging confirms math is correct but visual output wrong
- Removed 3D Ring geometry to eliminate render confusion

---

## Architecture Overview

### SVGRingOverlay Component
**Location:** AvatarStar3D.jsx lines 348-394

```javascript
- Uses requestAnimationFrame with 0.016 time increment (~60fps)
- Calls updateRings() every frame with advancing timeRef.current
- SVG with 5 empty <g> groups (ring-0 through ring-4)
- ViewBox: 0 0 512 512
```

### updateRings() Function
**Location:** AvatarStar3D.jsx lines 396-489

**Current Implementation:**
- Golden ratio spacing: baseRadius = 60 + ringIndex * (20 * 1.618)
- Thickness: 6 + stageConfig.coherence * 3
- Perlin noise distortion with smooth interpolation
- Per-ring directional bias (ringDirectionAngle)
- Tendrils at chaos > 0.3
- Rotation: `const rotatedAngle = angle + time * rotationSpeed`

**Rotation Configuration (Current - NOT WORKING):**
```javascript
const spinDirection = ringIndex % 2 === 0 ? 1 : -1;
const rotationSpeed = 0.5 * spinDirection;
// Ring 0: +0.5, Ring 1: -0.5, Ring 2: +0.5, Ring 3: -0.5, Ring 4: +0.5
```

### Perlin Noise Functions
**Location:** AvatarStar3D.jsx lines 8-35

Three-layer system:
- `perlin(x, y)`: Hash-based noise
- `smoothstep(t)`: Smoothing interpolation
- `noise(x, y)`: 2D interpolated noise value

---

## Visual Reference
All visual inspiration from Hollow Knight aesthetic. Current avatar stages:

- **SEEDLING:** Purple, smooth rings, minimal wobble
- **EMBER:** Orange, subtle irregular distortion
- **FLAME:** Yellow-orange, pronounced chaos, visible tendrils
- **BEACON:** Bright yellow, heavy warping/breaking
- **STELLAR:** Bright yellow, extreme distortion, maximum complexity

Reference images in /mnt/user-data/uploads/

---

## Previous Fixes (Working)
✅ Removed Three.js RingGeometry (was causing shader errors)  
✅ Switched to SVG overlay approach (hand-drawn aesthetic)  
✅ Implemented Perlin noise (organic vs. sine wave distortion)  
✅ Golden ratio spacing for rings  
✅ Per-ring directional bias  
✅ Tendril generation at high chaos  
✅ Glow effects and stroke styling  

---

## Next Steps (When Resumed)
1. **Investigate why rings 0 and 4 don't animate** - possible code path issue?
2. **Reduce noise amplitude** - hypothesis: noise completely overwhelms rotation signal
3. **Separate rotation from noise distortion** - apply rotation AFTER noise sampling?
4. **Test with extreme rotation speeds** - verify rotation math actually moves ring at all
5. **Consider ring animation order** - are rings 0/4 being cleared or not re-rendered?

---

## Technical Debt
- No error handling in updateRings
- Perlin noise implementation is basic (could use Simplex for better quality)
- Animation loop in useEffect doesn't properly manage requestAnimationFrame cleanup in all cases
- No memoization of calculated values

---

## Files Modified This Session
- AvatarStar3D.jsx: Lines 425-427, 440-449 (rotation speed, debug logging)

---

## Abandoned Approaches
- Three.js RingGeometry with custom shaders (sterile, computer-generated look)
- meshStandardMaterial with emissive (didn't match reference aesthetic)
- Sine wave distortion (perfectly symmetrical, not organic)
- Global direction angle for all rings (made them all move identically)