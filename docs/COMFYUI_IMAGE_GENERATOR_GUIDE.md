# ComfyUI Image Generator

⚠️ **OUTDATED**: This document describes a registry system that has been replaced.

**See [ComfyUI CLI Guide](COMFYUI_CLI.md)** for current documentation.

---

## Old Content (MCP-Based Registry System)

The following describes a future-proof system (kept for reference, but not currently implemented):

## Prerequisites
- ComfyUI running locally at `http://127.0.0.1:8188`
- MCP proxy running on `http://localhost:5050` (see [src/tools/runComfyProxy.js](../src/tools/runComfyProxy.js))
- Required models installed in ComfyUI:
  - **Checkpoints**: `z_image_bf16.safetensors`, `z-image-turbo-bf16-aio.safetensors`
  - **CLIP**: `qwen_3_4b.safetensors` (critical for z-image models)
- Python dependencies: `pyyaml`, `requests`

## Quick Start

Generate a single asset:
```bash
python tools/comfy/mcp_generator.py --asset sakshi_scenes/forest/background
```

Generate all layers for a scene:
```bash
python tools/comfy/mcp_generator.py --asset sakshi_scenes/forest/all
```

Generate all assets with a specific model:
```bash
python tools/comfy/mcp_generator.py --asset sakshi_scenes/all --model z-image-base
```

Dry run (show what would be generated):
```bash
python tools/comfy/mcp_generator.py --asset all --dry-run
```

## Architecture

### 1. Model Preset Registry ([tools/comfy/presets.yml](../tools/comfy/presets.yml))

Defines reusable model configurations with **all critical settings**:

```yaml
presets:
  z-image-base:
    checkpoint: z_image_bf16.safetensors
    clip:
      name: qwen_3_4b.safetensors
      type: lumina2  # CRITICAL: must match z-image architecture
    sampler:
      name: euler
      scheduler: normal
      steps: 25
      cfg: 7.5
    timeout:
      job: 600  # Base model needs longer processing time
```

**Why explicit CLIP loader?** Z-image checkpoints don't include embedded text encoders, causing "clip input is invalid: None" errors. The generator uses separate `CLIPLoader` nodes with `lumina2` type.

### 2. Asset Registry ([tools/comfy/assets.yml](../tools/comfy/assets.yml))

Defines **what to generate** without writing code:

```yaml
sakshi_scenes:
  forest:
    background:
      prompt: "peaceful forest clearing at dawn..."
      negative_prompt: "people, animals, movement, text"
      output_path: public/scenes/sakshi/forest_background.webp
      preset: z-image-turbo
      seed: null  # null = random, or specify integer
```

### 3. Generator Script ([tools/comfy/mcp_generator.py](../tools/comfy/mcp_generator.py))


## Usage Patterns

### Asset Path Syntax

```
group/scene/layer    → Generate single asset
group/scene/all      → Generate all layers in scene
group/all            → Generate all scenes in group
all                  → Generate everything in registry
```

Examples:
```bash
python tools/comfy/mcp_generator.py --asset sakshi_scenes/forest/background
python tools/comfy/mcp_generator.py --asset sakshi_scenes/forest/all
python tools/comfy/mcp_generator.py --asset sakshi_scenes/all
python tools/comfy/mcp_generator.py --asset all
```

### Model Override

```bash
python tools/comfy/mcp_generator.py --asset sakshi_scenes/city/all --model z-image-base
python tools/comfy/mcp_generator.py --asset all --model z-image-turbo
```

### Dry Run Mode

```bash
python tools/comfy/mcp_generator.py --asset sakshi_scenes/all --dry-run
```

## Adding New Assets

Edit [tools/comfy/assets.yml](../tools/comfy/assets.yml):

```yaml
awareness_body_scan:
  head:
    visualization:
      prompt: "soft glowing orb representing head awareness..."
      negative_prompt: "people, faces, detailed anatomy, text"
      output_path: public/scenes/awareness/head_visualization.webp
      preset: z-image-turbo
      seed: null
```

Then generate:

```bash
python tools/comfy/mcp_generator.py --asset awareness_body_scan/head/visualization
```

## Troubleshooting

### Error: "clip input is invalid: None"

**Solution**: Verify `qwen_3_4b.safetensors` exists in ComfyUI's `models/text_encoders/` directory and preset has `clip.type: lumina2`.

### Job Times Out

**Solution**: Increase timeout in [presets.yml](../tools/comfy/presets.yml).

### MCP Proxy Not Responding

**Solution**: Start proxy with `node src/tools/runComfyProxy.js` and verify ComfyUI at `http://127.0.0.1:8188`.

## Model Selection

- **Z-Image Base** (`z_image_bf16.safetensors`): Higher quality, slower (~3-5 min), 25 steps
- **Z-Image Turbo** (`z-image-turbo-bf16-aio.safetensors`): Good quality, faster (~30-60 sec), 9 steps
- **Both require**: `qwen_3_4b.safetensors` CLIP with `lumina2` type

## Best Practices

1. Start with turbo for iteration
2. Lock prompts before switching to base model
3. Use `--dry-run` before large batches
4. Keep `.json` metadata files for reproducibility
5. Extend `assets.yml` instead of creating one-off scripts


