# Turbo Model Asset Generation – Guard Rails

## Scope

Applies to **ALL ComfyUI runs** using turbo / lightning / distilled checkpoints:
- UI cards, rails, body scan assets
- Icons, panels, backgrounds
- Any ComfyUI generation targeting these models

**If a model is turbo → this document overrides all instincts.**

---

## 1. Absolute Parameter Locks (NON-NEGOTIABLE)

### Steps

```
Range: 6–8
Default: 8
```

**🚫 NEVER:** `steps > 8`

**Why:** Turbo models are designed for low-step synthesis. Beyond 8 steps, the iterative refinement destabilizes the model's learned distribution, causing:
- Baked / melted gradients
- Loss of form coherence
- "Overcooked" appearance

### CFG (Classifier-Free Guidance)

```
Range: 1.0–1.5
Default: 1.2
Hard cap: 1.5
```

**🚫 NEVER:** `CFG ≥ 1.6`

**Why:** Turbo models are trained with low guidance. High CFG:
- Amplifies noise artifacts
- Creates mushy, oversaturated output
- Ruins precision in architectural / symmetrical subjects
- Produces "psychedelic wallpaper" failure mode

### Denoise

```
Always: 1.0 (txt2img)
Range: 0.3–0.5 (img2img)
```

### Sampler

**Recommended:**
- `DPM++ 2M Karras`
- `Euler (simple)`

**Avoid:**
- `DPM++ SDE Karras` (can overshoot with turbo)
- `Ancestral samplers` (Euler a, DPM++ a)

### Scheduler

```
Default: karras
Alternative: normal
```

---

## 2. Prompt Structure (CRITICAL)

### Rule 1: Describe the THING, not the render

**❌ WRONG:**
```
"beautiful luminous glowing meditation figure with ethereal energy,
 cinematic bokeh, volumetric god rays, mystical aura, dreamy soft focus"
```

This asks the model to *render dream-like effects*, which turbo models struggle with.

**✅ RIGHT:**
```
"seated meditation figure, clear silhouette,
 soft glow at head, dark background, calm"
```

This describes the subject and lets the model handle synthesis naturally.

---

### Rule 2: Negative prompt is NOT optional

Turbo models are prone to:
- Glowing blobs instead of form
- Text artifacts
- Overly dramatic lighting

**Mandatory negative terms:**

```
text, letters, symbols, UI, borders,
illustration, fantasy art, digital painting,
overly bright, overexposed, lens flare,
bloom, god rays, volumetric light,
blurry, mushy, soft focus,
psychedelic, neon, oversaturated
```

---

### Rule 3: Be minimal and literal

**❌ WRONG (too poetic):**
```
"the sacred geometry of breath flowing through the chakra centers,
 a luminous mandala of consciousness ascending toward transcendence"
```

**✅ RIGHT (literal, achievable):**
```
"human silhouette in meditation, head to pelvis,
 vertical energy line from crown to root,
 soft glow, dark background"
```

Turbo models respond better to concrete, anatomical language.

---

## 3. Workflow Checklist (ComfyUI ONLY)

Before hitting **Queue Prompt**, verify:

- ✅ Sampler is `DPM++ 2M Karras` or `Euler`
- ✅ Steps: **6–8 only**
- ✅ CFG: **1.0–1.5, default 1.2**
- ✅ Denoise: 1.0 (txt2img)
- ✅ Checkpoint: turbo model loaded
- ✅ **NO ControlNet**
- ✅ **NO LoRA**
- ✅ **NO upscaler nodes**
- ✅ **NO latent sharpening**
- ✅ **NO high-res fix**
- ✅ VAE: default (NOT explicit vae_decode + split)
- ✅ SaveImage node present (outputs to `output/`)

**If ANY of these are violated → delete, rebuild, retry.**

---

## 4. Common Failure Modes & Fixes

### Failure: "Baked" / melted gradients

**Cause:** Steps too high (> 8) OR CFG too high (≥ 1.6)

**Fix:**
1. Drop steps to **6**
2. Drop CFG to **1.0**
3. Regenerate
4. If acceptable: gradually increase steps/CFG by 1 only

### Failure: Glowing blobs instead of form

**Cause:** Prompt too vague / illustrative ("ethereal", "mystical", "dreamy")

**Fix:**
1. Rewrite prompt to be literal and anatomical
2. Add to negative: `"blurry, soft focus, mushy"`
3. Regenerate

### Failure: Oversaturated / neon colors

**Cause:** CFG too high (≥ 1.5) or prompt includes "vibrant", "psychedelic"

**Fix:**
1. Drop CFG to **1.0**
2. Remove color adjectives; replace with material names (e.g., "gold" → "warm amber")
3. Regenerate

### Failure: Unwanted text / symbols

**Cause:** Model is hallucinating UI elements or letters

**Fix:**
1. Ensure negative includes: `"text, letters, symbols, UI, borders"`
2. Remove prompt terms like "mandala", "chakra symbols", "sacred geometry"
3. Use **literal + minimal** prompts
4. Regenerate

### Failure: Output is just noise

**Cause:** Seed conflict, or model did not load correctly

**Fix:**
1. Verify checkpoint is loaded (check ComfyUI terminal for errors)
2. Change seed
3. Regenerate

---

## 5. Parameter Tuning (If Default Doesn't Work)

### Start here (safe defaults)

```
steps: 8
CFG: 1.2
sampler: DPM++ 2M Karras
scheduler: karras
```

### If output is too smooth/soft (lacking detail):

```
steps: 8 (no change)
CFG: 1.5 (increase only to this)
```

### If output is too sharp/noisy:

```
steps: 6 (decrease only)
CFG: 1.0 (decrease only)
```

### If output is too stylized (illustration-like):

```
steps: 6 (decrease)
CFG: 1.0 (decrease)
Negative: add "illustration, digital art, painting style"
```

---

## 6. Example: Correct Turbo Workflow

### Asset: Body Scan – Upper (head glow)

**ComfyUI Settings:**
- Checkpoint: `z-image-turbo-fp8-aio.safetensors`
- Sampler: `DPM++ 2M Karras`
- Steps: 8
- CFG: 1.2
- Scheduler: karras
- Denoise: 1.0

**Positive Prompt:**
```
seated meditation figure, clear silhouette,
energy concentrated at head and crown,
soft violet glow at skull,
rest of body subdued and dark,
dark ethereal background with subtle particles,
calm, restrained, precise
```

**Negative Prompt:**
```
text, symbols, mandalas, UI, borders,
abstract gradient backgrounds,
full-frame glow,
blurry anatomy,
fantasy illustration,
overexposed light,
psychedelic colors
```

**Expected Result:**
- Clear seated figure
- Violet glow at head only
- Dark background
- Readable form (not melted)
- Minimal artifacts

---

## 7. Tools / Scripts

### Generate Awareness Silhouette Assets

```bash
python tools/comfy/generate_awareness_silhouette_assets.py
```

**Built-in guards:**
- Steps clamped to **max 8**
- CFG clamped to **max 1.5**
- No ControlNet / LoRA / upscaler
- Fixed seeds per asset (reproducible)
- Region-specific prompts (locked)

Modify only:
- `CHECKPOINT` (if using different turbo model)
- `SEED_BASE` (if you want different variants)

---

## 8. When to Escalate

If output fails acceptance criteria **after tuning CFG and steps**:

1. Check prompt for vague / illustrative terms
2. Increase negative prompt specificity
3. Consider **different subject** or **lower CFG (1.0)**
4. If model consistently fails → test with different turbo checkpoint

---

## 9. Quick Reference Card

| Parameter | Safe Range | Default | Hard Limits |
|-----------|-----------|---------|-------------|
| Steps | 6–8 | 8 | 🚫 > 8 |
| CFG | 1.0–1.5 | 1.2 | 🚫 ≥ 1.6 |
| Sampler | DPM++2M, Euler | DPM++2M Karras | Avoid Ancestral |
| Denoise (txt2img) | 1.0 | 1.0 | Always 1.0 |
| Denoise (img2img) | 0.3–0.5 | 0.4 | – |

---

## 10. Forbidden (Non-Negotiable)

- ❌ ControlNet with turbo
- ❌ LoRA stacking
- ❌ Upscaler nodes (only rescale PNG after)
- ❌ Latent sharpening
- ❌ Steps > 8
- ❌ CFG ≥ 1.6
- ❌ Vague / illustrative prompts
- ❌ Skipping negative prompt

---

**Last Updated:** 2026-01-30  
**Scope:** Immanence OS asset generation via ComfyUI  
**Status:** LOCKED – do not modify without approval
