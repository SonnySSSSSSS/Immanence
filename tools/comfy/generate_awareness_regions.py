"""
Generate 4 Awareness "region rail" wallpapers via ComfyUI HTTP API, then downscale to deliverables.

Outputs (final, downscaled to 1024x512 PNG):
- public/visualization/awareness/regions/rail_region_upper.png
- public/visualization/awareness/regions/rail_region_middle.png
- public/visualization/awareness/regions/rail_region_lower.png
- public/visualization/awareness/regions/rail_region_full.png

ComfyUI requirement:
- ComfyUI running locally (default: http://127.0.0.1:8188)
- A checkpoint name that exists in ComfyUI/models/checkpoints (set CHECKPOINT below)

Install (once):
  python -m pip install requests pillow

Run:
  python tools/comfy/generate_awareness_regions.py
"""

from __future__ import annotations

import io
import json
import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import requests
from PIL import Image


# -------------------------
# USER SETTINGS (EDIT THESE)
# -------------------------

COMFY_BASE_URL = "http://127.0.0.1:8188"

# IMPORTANT: set this to a checkpoint that exists on your machine in ComfyUI.
# Example names: "sdxl_base_1.0.safetensors" or whatever you installed.
CHECKPOINT = "z-image-turbo-fp8-aio.safetensors"

# Generation resolution (master) and deliverable resolution (final file saved)
MASTER_W, MASTER_H = 2048, 1024
FINAL_W, FINAL_H = 1024, 512

# Sampling settings (safe defaults)
STEPS = 8
CFG = 3.0
SAMPLER_NAME = "euler"
SCHEDULER = "normal"
DENOISE = 1.0

# If True, uses a random seed per image. If False, uses SEED_BASE + index.
RANDOM_SEED = True
SEED_BASE = 123456789

# Save prefix inside Comfy outputs (Comfy will create its own filenames)
COMFY_FILENAME_PREFIX = "awareness_region_rail"

# Timeouts
POLL_INTERVAL_SEC = 0.6
JOB_TIMEOUT_SEC = 180


# -------------------------
# PROMPTS (LOCKED)
# -------------------------

BASE_POSITIVE = (
    "subtle spiritual UI wallpaper, calm atmospheric texture, deep teal and blue-gray, "
    "soft fog, gentle grain, faint sacred geometry, minimal contrast in center for text readability, "
    "detail concentrated near edges, no neon, no lens flare, no bloom, no god rays, "
    "clean modern app background, high quality"
)

NEGATIVE = (
    "text, letters, words, logo, watermark, signature, face, person, hand, harsh glow, lens flare, neon, "
    "high contrast center, busy pattern in center, bright white hotspots, cyberpunk, oversaturated"
)

REGION_MODIFIERS = {
    "upper": "emphasis near top edge, airy, crown/above-crown feel, faint starfield near top corners, very subtle",
    "middle": "emphasis in central vertical band but pushed to sides, heart-to-root zone feel, gentle symmetric geometry near left/right edges",
    "lower": "emphasis near bottom edge, grounded, root-to-feet feel, denser fog/grain near bottom corners",
    "full": "balanced top-to-bottom, faint vertical alignment motif, subtle whole-column coherence, evenly weighted edges",
}


# -------------------------
# OUTPUT PATHS (LOCKED)
# -------------------------

@dataclass(frozen=True)
class Target:
    key: str
    out_path: Path

TARGETS = [
    Target("upper", Path("public/visualization/awareness/regions/rail_region_upper.png")),
    Target("middle", Path("public/visualization/awareness/regions/rail_region_middle.png")),
    Target("lower", Path("public/visualization/awareness/regions/rail_region_lower.png")),
    Target("full", Path("public/visualization/awareness/regions/rail_region_full.png")),
]


# -------------------------
# COMFY WORKFLOW BUILDER
# -------------------------

def build_workflow(prompt_pos: str, prompt_neg: str, seed: int) -> Dict[str, Any]:
    """
    Builds a minimal ComfyUI txt2img workflow:
      CheckpointLoaderSimple -> CLIPTextEncode(pos/neg)
      EmptyLatentImage -> KSampler -> VAEDecode -> SaveImage
    """
    # Node IDs are arbitrary strings, but must be consistent in references.
    wf: Dict[str, Any] = {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": CHECKPOINT
            },
        },
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt_pos,
                "clip": ["1", 1],  # output 1 of CheckpointLoaderSimple = CLIP
            },
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt_neg,
                "clip": ["1", 1],
            },
        },
        "4": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": MASTER_W,
                "height": MASTER_H,
                "batch_size": 1,
            },
        },
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": STEPS,
                "cfg": CFG,
                "sampler_name": SAMPLER_NAME,
                "scheduler": SCHEDULER,
                "denoise": DENOISE,
                "model": ["1", 0],      # output 0 = MODEL
                "positive": ["2", 0],   # output 0 = conditioning
                "negative": ["3", 0],
                "latent_image": ["4", 0],
            },
        },
        "6": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["5", 0],
                "vae": ["1", 2],  # output 2 = VAE
            },
        },
        "7": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["6", 0],
                "filename_prefix": COMFY_FILENAME_PREFIX,
            },
        },
    }
    return wf


# -------------------------
# COMFY API HELPERS
# -------------------------

def post_prompt(session: requests.Session, workflow: Dict[str, Any]) -> str:
    url = f"{COMFY_BASE_URL}/prompt"
    payload = {"prompt": workflow}
    r = session.post(url, json=payload, timeout=30)
    if r.status_code != 200:
        print(f"ERROR: ComfyUI returned {r.status_code}")
        print(f"Response: {r.text}")
    r.raise_for_status()
    data = r.json()
    prompt_id = data.get("prompt_id")
    if not prompt_id:
        raise RuntimeError(f"ComfyUI /prompt response missing prompt_id: {data}")
    return prompt_id


def poll_history(session: requests.Session, prompt_id: str, timeout_sec: int) -> Dict[str, Any]:
    url = f"{COMFY_BASE_URL}/history/{prompt_id}"
    start = time.time()
    while True:
        r = session.get(url, timeout=30)
        r.raise_for_status()
        data = r.json()
        if data and prompt_id in data:
            return data[prompt_id]
        if time.time() - start > timeout_sec:
            raise TimeoutError(f"Timed out waiting for history for prompt_id={prompt_id}")
        time.sleep(POLL_INTERVAL_SEC)


def extract_first_output_image(history_item: Dict[str, Any]) -> Tuple[str, str, str]:
    """
    Returns (filename, subfolder, type) for the first saved image in the history output.
    """
    outputs = history_item.get("outputs", {})
    # SaveImage node is "7" in our workflow; but be defensive in case Comfy changes.
    for node_id, node_out in outputs.items():
        images = node_out.get("images")
        if not images:
            continue
        img0 = images[0]
        filename = img0.get("filename")
        subfolder = img0.get("subfolder", "")
        img_type = img0.get("type", "output")
        if filename:
            return filename, subfolder, img_type
    raise RuntimeError(f"No output images found in history item outputs: {json.dumps(outputs)[:800]}")


def download_image_bytes(session: requests.Session, filename: str, subfolder: str, img_type: str) -> bytes:
    # /view?filename=...&subfolder=...&type=output
    url = f"{COMFY_BASE_URL}/view"
    params = {"filename": filename, "subfolder": subfolder, "type": img_type}
    r = session.get(url, params=params, timeout=60)
    r.raise_for_status()
    return r.content


# -------------------------
# IMAGE POST-PROCESS
# -------------------------

def downscale_and_save_png(png_bytes: bytes, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(png_bytes)) as im:
        im = im.convert("RGB")
        im = im.resize((FINAL_W, FINAL_H), resample=Image.LANCZOS)
        im.save(out_path, format="PNG", optimize=True)


# -------------------------
# MAIN
# -------------------------

def main() -> int:
    if not CHECKPOINT or CHECKPOINT.endswith(".safetensors") is False:
        # Not a hard rule, but helps catch accidental blanks
        print(f"[WARN] CHECKPOINT looks unusual: {CHECKPOINT!r}")

    session = requests.Session()

    for idx, t in enumerate(TARGETS):
        modifier = REGION_MODIFIERS[t.key]
        pos = f"{BASE_POSITIVE}, {modifier}"
        neg = NEGATIVE

        seed = random.randint(0, 2**32 - 1) if RANDOM_SEED else (SEED_BASE + idx)

        print(f"\n=== Generating: {t.key} -> {t.out_path.as_posix()} ===")
        workflow = build_workflow(pos, neg, seed)

        prompt_id = post_prompt(session, workflow)
        print(f"Submitted prompt_id={prompt_id}")

        hist = poll_history(session, prompt_id, timeout_sec=JOB_TIMEOUT_SEC)
        filename, subfolder, img_type = extract_first_output_image(hist)
        print(f"Comfy output: filename={filename} subfolder={subfolder!r} type={img_type}")

        png_bytes = download_image_bytes(session, filename, subfolder, img_type)
        downscale_and_save_png(png_bytes, t.out_path)

        print(f"Saved: {t.out_path.as_posix()} ({FINAL_W}x{FINAL_H})")

    print("\nAll done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
