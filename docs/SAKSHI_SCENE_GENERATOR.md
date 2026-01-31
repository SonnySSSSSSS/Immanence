# ComfyUI Image Generator (Repo Usage Guide)

This guide documents how to generate images with the ComfyUI tooling included in this repo for future use.

## Prerequisites
- ComfyUI running locally at http://127.0.0.1:8188
- Required models installed in ComfyUI (checkpoint + text encoder)

## Primary generator options

### 1) Universal generator (single prompt)
Use the general-purpose CLI for quick single-asset generation.

File: [tools/comfy_gen.py](tools/comfy_gen.py)

Example usage:
```bash
python tools/comfy_gen.py "mystical golden lotus on cream background" --output public/lotus.png
```

Key flags:
- `--output` path (relative to repo root)
- `--width` / `--height`
- `--steps` / `--cfg`
- `--sampler` / `--scheduler`
- `--ckpt` checkpoint filename

### 2) Sakshi scene generator (batch parallax layers)
Use this when you want consistent **background/midground/foreground** layers for parallax scenes.

File: [tools/comfy/generate_sakshi_scene_assets.py](tools/comfy/generate_sakshi_scene_assets.py)

Outputs:
```
public/scenes/sakshi/{scene}/{background|midground|foreground}.webp
```

Example usage:
```bash
python tools/comfy/generate_sakshi_scene_assets.py --scene forest --layer midground --model base
python tools/comfy/generate_sakshi_scene_assets.py --all --model turbo
```

Model presets are controlled by `--model` and can be overridden with:
- `--ckpt`, `--clip`, `--clip-type`
- `--steps`, `--cfg`, `--sampler`, `--scheduler`, `--denoise`

### 3) Specialized batch generators (pre-built pipelines)
These are purpose-built scripts that generate specific asset sets with curated prompts.

Examples:
- [tools/comfy/generate_awareness_body_scan_assets.py](tools/comfy/generate_awareness_body_scan_assets.py)
- [tools/comfy/generate_awareness_silhouette_assets.py](tools/comfy/generate_awareness_silhouette_assets.py)

Each script documents its own prompts, sizes, and output paths at the top of the file.

### 4) Windows convenience wrapper
Quick prompt-based generation on Windows:

File: [generate_asset.bat](generate_asset.bat)

Example:
```bat
generate_asset.bat "mystical avatar" public/avatars/test.png
```

### 5) Direct workflow JSON submit
PowerShell example that submits a JSON workflow straight to ComfyUI.

File: [generate_parchment.ps1](generate_parchment.ps1)

## ComfyUI API flow (what the scripts do)
Typical workflow:
1. POST `/prompt` with a ComfyUI graph
2. Poll `/history/{prompt_id}` until outputs appear
3. Download images via `/view`

## Troubleshooting checklist
- If you see **clip input is invalid**, the checkpoint does not contain a valid text encoder. Use `CLIPLoader` explicitly and ensure the encoder file matches the model type.
- If a checkpoint is missing, ComfyUI returns a 400 with a list of valid `ckpt_name` values.
- If jobs time out, increase polling timeout or reduce steps/resolution for testing.

## Model selection guidance
- **Turbo** checkpoints are fast; good for iteration.
- **Base** checkpoints are slower; good for final quality.
- If you switch between models, confirm the text encoder/CLIP pairing.

## Recommended next step for new assets
Start with the universal generator, then graduate to a specialized script:
1. Generate a single test image using [tools/comfy_gen.py](tools/comfy_gen.py).
2. Once the look is locked, create or reuse a dedicated script under [tools/comfy](tools/comfy/).
