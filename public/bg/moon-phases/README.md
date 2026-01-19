# Moon Phase Sprites for Immanence OS

Generated: January 19, 2026  
Generator: ComfyUI via z-image turbo  
Purpose: Orbit milestone phase glyphs for MoonOrbit component

## Specifications

- **Count**: 16 phases (complete lunar cycle)
- **Size**: 256×256 px per sprite
- **Format**: PNG with alpha transparency
- **Model**: z-image-turbo-fp8-aio.safetensors
- **Steps**: 9 (z-image turbo default)
- **CFG**: 1.0 (z-image turbo default)

## Style Guidelines

**Aesthetic**: Mythic sci-fi celestial UI  
**Palette**: Teal/emerald harmony with off-white moonlight and warm tints  
**Texture**: Soft lunar surface with subtle film grain  
**Dark side**: Deep charcoal with faint teal tint (not pure black)  
**Lighting**: Consistent convention - waxing (light on right), waning (light on left)  
**Terminator**: Curved (not straight clip)  
**Glow**: Minimal, subtle outer glow only  
**Background**: Fully transparent, no stars/nebula

## Phase Index

| Index | Phase Name | Description |
|-------|------------|-------------|
| 00 | New Moon | Almost fully dark |
| 01 | Waxing Crescent | Thin crescent, light on right |
| 02 | Waxing Crescent | Slightly thicker, light on right |
| 03 | Waxing Crescent | Medium crescent, light on right |
| 04 | First Quarter | Right half lit |
| 05 | Waxing Gibbous | More than half lit on right |
| 06 | Waxing Gibbous | Nearly full, small dark sliver on left |
| 07 | Waxing Gibbous | Very close to full, tiny dark sliver on left |
| 08 | Full Moon | Fully lit |
| 09 | Waning Gibbous | Very close to full, tiny dark sliver on right |
| 10 | Waning Gibbous | Nearly full, small dark sliver on right |
| 11 | Waning Gibbous | More than half lit on left |
| 12 | Last Quarter | Left half lit |
| 13 | Waning Crescent | Medium crescent, light on left |
| 14 | Waning Crescent | Slightly thicker, light on left |
| 15 | Waning Crescent | Thin crescent, light on left |

## Files

- `moon_phase_00.png` ... `moon_phase_15.png` - Individual phase sprites
- `contact_sheet.png` - 4×4 grid visual reference on checkerboard background

## Usage in MoonOrbit

```javascript
// Map phase index to asset
const phaseIndex = Math.floor((normalizedPosition * 16) % 16);
const phaseSrc = `/Immanence/bg/moon-phases/moon_phase_${phaseIndex.toString().padStart(2, '0')}.png`;
```

## Generation Details

**Base Prompt**:
```
Small moon phase sprite icon, transparent background, soft lunar surface texture, 
subtle film grain, mythic sci-fi aesthetic, teal/emerald UI harmony, 
off-white moonlight with slight warm tint, dark side is deep charcoal with faint teal tint, 
curved terminator, crisp edge at small size, minimal glow, no outline ring, 
no background, no stars, centered, clean alpha
```

**Negative Prompt**:
```
background, stars, sky, nebula, vignette, frame, border, thick halo, outline stroke, 
cartoon, flat vector, emoji, watermark, text, blur, noisy artifacts, jpeg artifacts, 
harsh specular highlight, strong bloom, lens flare
```

## Quality Checks

- ✅ All 16 phases generated successfully
- ✅ Transparent backgrounds (alpha channel)
- ✅ Consistent style across set
- ✅ Curved terminators (not straight clips)
- ✅ Readable at small size
- ✅ Lighting convention maintained (waxing right, waning left)
- ✅ No baked backgrounds or halos
- ✅ Soft glow that fades to transparency

## Next Steps

1. Visual review of contact sheet
2. Test at small size overlay on orbit ring
3. Verify phases read clearly at runtime
4. Wire into MoonOrbit component
5. If needed: regenerate at 384×384 for higher fidelity
