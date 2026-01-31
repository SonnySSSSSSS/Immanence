# ComfyUI Asset Generator CLI

Generate Sakshi scene parallax layers without writing scripts.

## Installation

```bash
# Install dependencies
cd tools/comfy-cli
npm install

# Make it executable (optional, on Linux/Mac)
chmod +x index.js
```

## Usage

### 1. **Command Line (Simplest)**

```bash
# Single layer
node tools/comfy-cli forest midground
node tools/comfy-cli city background --model base

# All layers of a scene
node tools/comfy-cli forest
node tools/comfy-cli mountain --model turbo

# All scenes and layers
node tools/comfy-cli --all
node tools/comfy-cli --all --model base
```

### 2. **From npm Scripts** (Add to `package.json`)

```json
{
  "scripts": {
    "comfy": "node tools/comfy-cli/index.js",
    "comfy:all": "node tools/comfy-cli/index.js --all",
    "comfy:forest": "node tools/comfy-cli/index.js forest",
    "comfy:city": "node tools/comfy-cli/index.js city"
  }
}
```

Then run:
```bash
npm run comfy forest midground
npm run comfy:all
```

### 3. **MCP Server** (For Claude Code Integration)

Start the MCP server:
```bash
node tools/comfy-cli/mcp-server.js
```

Claude Code can then call:
- `generate-scene` - Generate specific scene/layer
- `list-scenes` - List available scenes

### 4. **As a Node.js Module** (From JavaScript)

```javascript
import { spawn } from 'child_process';

async function generateAsset(scene, layer, model = 'turbo') {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [
      'tools/comfy-cli/index.js',
      scene,
      layer,
      '--model', model
    ]);

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Generation failed with code ${code}`));
    });
  });
}

await generateAsset('forest', 'midground', 'turbo');
```

## Arguments

```
SCENE              Scene name: forest, city, office, beach, mountain
LAYER              Layer: background, midground, foreground (optional)
--all              Generate all scenes and layers
--model base|turbo Model preset (default: turbo)
--scene NAME       Specify scene (alternative syntax)
```

## Models

| Model | Steps | CFG | Speed | Quality |
|-------|-------|-----|-------|---------|
| turbo | 9 | 1.0 | ~30s | Good |
| base | 25 | 7.0 | ~120s | Better |

## Output

Assets save to:
```
public/scenes/sakshi/{scene}/{background|midground|foreground}.webp
```

## Requirements

- Node.js 18+
- ComfyUI running at http://127.0.0.1:8188
- z_image models installed in ComfyUI
- qwen_3_4b.safetensors text encoder

## Troubleshooting

**"ComfyUI not accessible"**
- Ensure ComfyUI is running: http://127.0.0.1:8188
- Check port is not blocked

**"Checkpoint not found"**
- Verify z_image_bf16.safetensors or z_image_turbo_bf16.safetensors exists
- Check ComfyUI models folder

**"CLIP model not found"**
- Download qwen_3_4b.safetensors to ComfyUI/models/text_encoders/
- See main project README for setup

**Slow generation**
- Use `--model turbo` for faster (9 steps vs 25)
- Reduce output resolution in code if needed

## Notes

- Assets are WEBP format, quality=90
- Seeds are deterministic (8888) unless randomized
- No cloud upload or telemetry
- All processing is local
