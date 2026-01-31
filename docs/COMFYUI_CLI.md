# ComfyUI Asset Generator CLI

Generate Sakshi parallax scene layers and other assets **without writing scripts**.

**TL;DR:** `node tools/comfy-cli forest midground` — that's it.

---

## Prerequisites

### ComfyUI Setup
- ComfyUI running at `http://127.0.0.1:8188`
- Models installed:
  - **Checkpoint**: `z_image_bf16.safetensors` or `z_image_turbo_bf16.safetensors`
  - **Text Encoder**: `qwen_3_4b.safetensors` (goes in `models/text_encoders/`)
  - **VAE**: `ae.safetensors` (Flux VAE, goes in `models/vae/`)

### Node.js
- Node.js 18+

### Installation
```bash
cd tools/comfy-cli
npm install
cd ../..
```

---

## Quick Start

### Generate a Single Layer
```bash
node tools/comfy-cli forest midground
```

### Generate All Layers of a Scene
```bash
node tools/comfy-cli forest
node tools/comfy-cli city --model base
```

### Generate All Scenes and Layers
```bash
node tools/comfy-cli --all
node tools/comfy-cli --all --model turbo
```

---

## Usage Patterns

### 1. **Command Line** (Manual Generation)

Basic syntax:
```bash
node tools/comfy-cli <scene> [layer] [--model base|turbo]
```

Examples:
```bash
# Single layer
node tools/comfy-cli forest background
node tools/comfy-cli city midground
node tools/comfy-cli beach foreground

# All layers of scene
node tools/comfy-cli mountain
node tools/comfy-cli office --model base

# All scenes
node tools/comfy-cli --all
node tools/comfy-cli --all --model base
```

### 2. **npm Scripts** (Automated)

Add to `package.json`:
```json
{
  "scripts": {
    "gen:assets": "node tools/comfy-cli",
    "gen:forest": "node tools/comfy-cli forest",
    "gen:all": "node tools/comfy-cli --all",
    "gen:city:turbo": "node tools/comfy-cli city --model turbo",
    "gen:base": "node tools/comfy-cli --all --model base"
  }
}
```

Then run:
```bash
npm run gen:forest
npm run gen:all
npm run gen:base
```

### 3. **MCP Server** (Claude Code Integration)

Start the MCP server:
```bash
node tools/comfy-cli/mcp-server.js
```

Claude Code can then invoke:
- **`generate-scene`** — Generate specific scene/layer
- **`list-scenes`** — Show available scenes and layers

### 4. **From Node.js Code**

```javascript
import { spawn } from 'child_process';

function generateAsset(scene, layer, model = 'turbo') {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [
      'tools/comfy-cli/index.js',
      scene,
      layer,
      '--model', model
    ]);

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Generation failed: ${code}`));
    });
  });
}

// Usage
await generateAsset('forest', 'midground', 'turbo');
```

---

## Available Scenes and Layers

### Forest
- `background` — Distant canopy, misty depth
- `midground` — Forest path with trees
- `foreground` — Earth path with leaves

### City
- `background` — Urban skyline, buildings
- `midground` — Quiet street
- `foreground` — Pavement and curb

### Office
- `background` — Interior wall with window
- `midground` — Home office room
- `foreground` — Floor and furniture edge

### Beach
- `background` — Sky and horizon
- `midground` — Shoreline with waves
- `foreground` — Sand near feet

### Mountain
- `background` — Distant silhouettes
- `midground` — Mountain trail
- `foreground` — Rocky path

---

## Model Presets

### Turbo (Fast, Good Quality)
```
Steps: 9
CFG: 1.0
Sampler: res_multistep
Scheduler: simple
Time: ~30-45 seconds per layer
Best for: Iteration, testing
```

### Base (Slow, Better Quality)
```
Steps: 25
CFG: 7.0
Sampler: dpmpp_sde
Scheduler: ddim_uniform
Time: ~2-3 minutes per layer
Best for: Final assets
```

---

## Output Format

Assets are saved as WEBP (quality=90):
```
public/scenes/sakshi/{scene}/{layer}.webp
```

Example:
- `public/scenes/sakshi/forest/background.webp`
- `public/scenes/sakshi/city/midground.webp`
- `public/scenes/sakshi/mountain/foreground.webp`

---

## Troubleshooting

### ComfyUI Not Accessible
```
❌ ComfyUI not accessible at http://127.0.0.1:8188
```

**Fix**: Ensure ComfyUI is running:
```bash
# Start ComfyUI in another terminal
cd /path/to/ComfyUI
./run_nvidia_gpu.bat  # or equivalent for your setup
```

### Checkpoint Not Found
```
❌ Error: Model checkpoint z_image_turbo_bf16.safetensors not found
```

**Fix**: Verify checkpoint exists in ComfyUI:
```
ComfyUI/models/diffusion_models/z_image_turbo_bf16.safetensors
```

### CLIP Model Not Found
```
❌ Error: CLIP model qwen_3_4b.safetensors not found
```

**Fix**: Download to ComfyUI text_encoders folder:
```
ComfyUI/models/text_encoders/qwen_3_4b.safetensors
```

Get it from: https://huggingface.co/Comfy-Org/z_image_turbo/tree/main/split_files/text_encoders

### Job Timeout
```
❌ Error: Job ... timed out
```

**Fix**:
- Use `--model turbo` (faster)
- Ensure ComfyUI isn't processing other jobs
- Check ComfyUI system resources

### Out of Memory
```
CUDA Out of Memory
```

**Fix**: Use turbo model or reduce resolution (edit script):
```javascript
// In tools/comfy-cli/index.js, change:
width: 1024,  // reduce to 512
height: 1024, // reduce to 512
```

---

## File Locations

| File | Purpose |
|------|---------|
| `tools/comfy-cli/index.js` | Main CLI tool |
| `tools/comfy-cli/mcp-server.js` | MCP server wrapper |
| `tools/comfy-cli/package.json` | Dependencies |
| `tools/comfy-cli/README.md` | Detailed technical reference |

---

## Best Practices

1. **Test first**: Generate a single layer before batch operations
   ```bash
   node tools/comfy-cli forest midground
   ```

2. **Use turbo for iteration**: Save time testing prompts
   ```bash
   node tools/comfy-cli forest --model turbo
   ```

3. **Use base for final assets**: Better quality for production
   ```bash
   node tools/comfy-cli forest --model base
   ```

4. **Batch generation**: Use npm scripts or `--all` for multiple assets
   ```bash
   npm run gen:all
   ```

5. **Monitor first run**: Watch the output to confirm everything works
   ```bash
   node tools/comfy-cli city background
   # Look for: "✅ {scene}/background/{layer}.webp"
   ```

---

## Advanced: Custom Prompts

To customize scene prompts, edit `tools/comfy-cli/index.js`:

```javascript
const SCENES = {
  forest: {
    background: 'YOUR CUSTOM PROMPT HERE, more details, style hints',
    // ... rest of layers
  },
};
```

Then regenerate:
```bash
node tools/comfy-cli forest background
```

---

## Migration from Old Scripts

If you have old Python scripts (`generate_sakshi_scene_assets.py`, etc.):

**Old:**
```bash
python tools/comfy/generate_sakshi_scene_assets.py --scene forest --layer midground
```

**New:**
```bash
node tools/comfy-cli forest midground
```

The new CLI is faster, simpler, and doesn't require Python. No need to maintain the old scripts.

---

## Performance Notes

| Operation | Time (Turbo) | Time (Base) |
|-----------|--------------|------------|
| Single layer | ~30-45s | ~2-3 min |
| Scene (3 layers) | ~2-2.5 min | ~6-9 min |
| All scenes (15 layers) | ~7-10 min | ~30-45 min |

Times vary based on GPU and ComfyUI load.

---

## What's Next?

- **Add to CI/CD**: Regenerate assets on every deploy
- **Web UI integration**: Call from React app
- **Extend MCP server**: Add more tools for asset management
- **Custom generators**: Create new scene types in SCENES registry
