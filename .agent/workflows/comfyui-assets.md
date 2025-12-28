---
description: How to use ComfyUI to generate assets for Immanence OS
---

# ComfyUI MCP Server - Usage Instructions

You have access to two ComfyUI tools for generating AI assets:

## Tool 1: check_comfyui_status

**Purpose**: Check if ComfyUI is running  
**Parameters**: None  
**When to use**: Before generating images, or when troubleshooting

**Example**:
```javascript
check_comfyui_status({})
```

---

## Tool 2: generate_comfyui_asset

**Purpose**: Generate images using ComfyUI's AI  

**Parameters**:
- `positive_prompt` (required): What to generate
- `negative_prompt` (optional): What to avoid
- `output_path` (optional): Where to save (relative to `D:\Unity Apps\immanence-os\`)

**Examples**:

### Generate with default location
```javascript
generate_comfyui_asset({
  "positive_prompt": "mystical purple avatar, ethereal glow, spiritual energy"
})
```

### Generate with specific output
```javascript
generate_comfyui_asset({
  "positive_prompt": "serene buddha statue, meditation pose, golden light",
  "negative_prompt": "text, watermark, blurry, distorted",
  "output_path": "public/avatars/buddha_01.png"
})
```

### Generate chakra visualization
```javascript
generate_comfyui_asset({
  "positive_prompt": "heart chakra symbol, green energy, lotus flower, sacred geometry",
  "negative_prompt": "text, watermark",
  "output_path": "public/chakras/anahata.png"
})
```

---

## Usage Patterns

When the user says:
- **"Generate a mystical avatar"** → Use `generate_comfyui_asset` with appropriate prompt
- **"Create a chakra image"** → Use `generate_comfyui_asset` with chakra-themed prompt
- **"Is ComfyUI running?"** → Use `check_comfyui_status`
- **"Make me a banner for..."** → Use `generate_comfyui_asset` with banner-style prompt

---

## Best Practices

### Always:
- Check ComfyUI status first if unsure
- Use descriptive, detailed prompts for better results
- Include negative prompts to avoid unwanted elements (text, watermarks, etc.)
- Specify `output_path` when user indicates where they want the file

### Default output location (if not specified):
`public/generated/[random-id].png`

### Good prompt patterns:
**Format**: Subject + style + lighting + quality modifiers

**Example**: `"mystical avatar, ethereal style, soft purple glow, high quality, detailed"`

### Common negative prompts:
`"text, watermark, blurry, distorted, low quality"`

### Path format:
- Use forward slashes: `public/avatars/test.png`
- Or double backslashes: `public\\avatars\\test.png`
- Relative to project root: `D:\Unity Apps\immanence-os\`

---

## Asset Organization

Recommended directories for generated assets:
- **Avatars**: `public/avatars/`
- **Chakras**: `public/chakras/`
- **Icons**: `public/icons/`
- **Backgrounds**: `public/backgrounds/`
- **UI Elements**: `public/ui/`
- **Generated**: `public/generated/` (for temporary/test assets)

---

## 🎯 RECOMMENDED: Universal Script (`comfy_gen.py`)

**As of December 2024, use `tools/comfy_gen.py` instead of creating one-off scripts.**

### Quick Start

```bash
# Basic usage - waits for completion
python tools/comfy_gen.py "mystical golden lotus on cream background" --output public/lotus.png

# Fire-and-forget mode - queues and exits immediately
python tools/comfy_gen.py "swirling ethereal clouds" --output public/clouds.png --no-download
```

### Common Use Cases

#### Generate Avatar Asset
```bash
python tools/comfy_gen.py \
  "serene meditation avatar, purple ethereal glow, spiritual energy, high quality" \
  --output public/avatars/meditation_01.png \
  --negative "text, watermark, blurry, photorealistic"
```

#### Generate Background (Fire-and-Forget)
```bash
python tools/comfy_gen.py \
  "soft swirling clouds in cream and pale gold, ethereal wisps, gentle gradients" \
  --output public/backgrounds/clouds_subtle.png \
  --no-download
```

#### Generate with Custom Dimensions
```bash
python tools/comfy_gen.py \
  "sacred geometry mandala, golden and amber tones" \
  --output public/icons/mandala.png \
  --width 512 \
  --height 512 \
  --steps 4
```

#### Quick Test Generation
```bash
# Generates to public/generated/ComfyUI_[timestamp].png
python tools/comfy_gen.py "abstract golden energy swirls"
```

### All Available Options

```bash
python tools/comfy_gen.py --help

Arguments:
  prompt              Positive prompt describing what to generate
  
Options:
  --output, -o        Output file path (relative to project root)
  --negative, -n      Negative prompt (default: "text, letters, watermark...")
  --width, -w         Image width in pixels (default: 1024)
  --height, -H        Image height in pixels (default: 1024)
  --steps, -s         Generation steps (default: 9)
  --cfg, -c           CFG scale (default: 1.0)
  --sampler           Sampler name (default: euler_ancestral)
  --scheduler         Scheduler (default: simple)
  --ckpt              Checkpoint name (default: z-image-turbo-bf16-aio.safetensors)
  --prefix, -p        Filename prefix for ComfyUI (default: ComfyUI)
  --timeout, -t       Timeout in seconds (default: 300)
  --no-download       Queue only, don't wait for completion
```

### Best Practices for AI Agent

1. **Always use `--no-download`** when generating during active tasks to avoid blocking
2. **Use descriptive prompts** with style, lighting, and quality modifiers
3. **Specify `--output`** with meaningful paths in the appropriate directory
4. **Include `--negative`** to avoid text, watermarks, and unwanted elements
5. **Notify user** after queuing, then continue with other work

### Example AI Agent Workflow

```bash
# 1. Queue the generation (non-blocking)
python tools/comfy_gen.py \
  "luminous chakra symbol, emerald green energy, lotus petals, sacred geometry" \
  --output public/chakras/heart_chakra.png \
  --negative "text, watermark, blurry, photorealistic" \
  --no-download

# 2. Immediately inform user and continue work
# "I've queued the heart chakra generation. I'll continue with the next task..."
```

---

## 🔥 FIRE-AND-FORGET PROTOCOL (MANDATORY)


To prevent the AI from "freezing" or "locked waits," always follow these steps for ComfyUI generations:

1. **DO NOT use synchronous MCP tools** for generations.
2. **USE THE UNIVERSAL SCRIPT** `tools/comfy_gen.py` with the `--no-download` flag to queue prompts via background command.
3. **IMMEDIATELY CONTINUE WORK.** After triggering the generation, immediately ask for the next task or continue with existing code work.
4. **USER NOTIFICATION.** The user will handle file placement and notify the AI when the asset is ready to be inspected or used.
5. **NEVER WAIT.** If a generation is running, the AI must remain active and responsive to other requests.

### Recommended Command Pattern
```bash
python tools/comfy_gen.py "your prompt here" --output public/path/to/asset.png --no-download
```

For synchronous generation (when user explicitly requests waiting):
```bash
python tools/comfy_gen.py "your prompt here" --output public/path/to/asset.png
```

