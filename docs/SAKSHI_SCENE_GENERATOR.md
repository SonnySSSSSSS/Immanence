# Sakshi Scene Asset Generator

Generate parallax scene layers for Sakshi scenes using ComfyUI.

**⚠️ OUTDATED**: This document has been superseded by the **[ComfyUI CLI Guide](COMFYUI_CLI.md)**.

## Quick Migration

| Old Approach | New Approach |
|---|---|
| `python tools/comfy/generate_sakshi_scene_assets.py --scene forest --layer midground` | `node tools/comfy-cli forest midground` |
| Python required | Node.js required (already in project) |
| Complex script setup | Simple CLI tool |
| Single-purpose | Multi-purpose (scenes, layers, models) |

## New Usage

**See [ComfyUI CLI Guide](COMFYUI_CLI.md)** for comprehensive documentation.

Quick examples:
```bash
# Generate a single layer
node tools/comfy-cli forest midground

# Generate all layers of a scene
node tools/comfy-cli forest --model turbo

# Generate all scenes
node tools/comfy-cli --all
```

## Why the Change?

- ✅ Simpler: No Python dependencies
- ✅ Faster: Node.js runs on Windows natively
- ✅ More flexible: CLI, npm scripts, MCP, JavaScript integration
- ✅ Less maintenance: Single tool instead of multiple scripts
- ✅ Better integration: Works with Claude Code via MCP

## Setup

```bash
cd tools/comfy-cli
npm install
cd ../..
```

Then run:
```bash
node tools/comfy-cli --all
```

**For detailed usage, see [COMFYUI_CLI.md](COMFYUI_CLI.md)**
