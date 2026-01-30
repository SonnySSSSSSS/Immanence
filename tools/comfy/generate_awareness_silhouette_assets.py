"""
Generate 4 Awareness silhouette + energy glow assets via ComfyUI HTTP API.
Seated meditation figure with region-specific energy glows.

Outputs (final, 768x1024 PNG portrait):
- public/visualization/awareness/awareness_upper.png
- public/visualization/awareness/awareness_middle.png
- public/visualization/awareness/awareness_lower.png
- public/visualization/awareness/awareness_full.png

ComfyUI requirement:
- ComfyUI running locally (default: http://127.0.0.1:8188)
- Turbo checkpoint (z-image-turbo-fp8-aio.safetensors or equivalent)

Install (once):
  python -m pip install requests pillow

Run:
  python tools/comfy/generate_awareness_silhouette_assets.py
"""

from __future__ import annotations

import io
import json
import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Tuple

import requests
from PIL import Image


# -------------------------
# USER SETTINGS (EDIT THESE)
# -------------------------

COMFY_BASE_URL = "http://127.0.0.1:8188"

# Turbo checkpoint
CHECKPOINT = "z-image-turbo-fp8-aio.safetensors"

# Generation resolution: 768 x 1024 (portrait)
WIDTH, HEIGHT = 768, 1024

# Sampling settings (LOCKED SPEC)
STEPS = 8  # range 12-16, testing lower
CFG = 1.2  # MAX 1.5
SAMPLER_NAME = "dpmpp_2m"
SCHEDULER = "karras"
DENOISE = 1.0

# Fixed seeds per asset (consistency)
RANDOM_SEED = False
SEED_BASE = 100

# Save prefix inside Comfy outputs
COMFY_FILENAME_PREFIX = "awareness_silhouette"

# Timeouts
POLL_INTERVAL_SEC = 0.6
JOB_TIMEOUT_SEC = 180


# -------------------------
# PROMPTS (LOCKED)
# -------------------------

BASE_POSITIVE = (
    "minimal luminous human silhouette, seated meditation pose, "
    "clear vertical body axis, "
    "dark ethereal background with subtle particles, "
    "cinematic lighting, "
    "anatomically meaningful energy glow, "
    "no abstract gradients, "
    "no decorative background, "
    "single centered figure, "
    "calm, restrained, precise"
)

NEGATIVE = (
    "text, symbols, mandalas, UI, borders, "
    "abstract gradient backgrounds, "
    "full-frame glow, "
    "blurry anatomy, "
    "fantasy illustration, "
    "overexposed light, "
    "psychedelic colors"
)

REGION_MODIFIERS = {
    "upper": (
        "energy concentrated at head and crown, "
        "soft violet or cool white glow at skull, "
        "rest of body subdued and dark"
    ),
    "middle": (
        "energy concentrated at chest and upper abdomen, "
        "gold-green glow at heart and solar plexus, "
        "clear ribcage and torso silhouette"
    ),
    "lower": (
        "energy concentrated at pelvis and lower abdomen, "
        "warm amber or red-gold glow at hips/root, "
        "upper body subdued"
    ),
    "full": (
        "continuous vertical energy line from head to pelvis, "
        "balanced glow across entire body axis, "
        "no single dominant hotspot"
    ),
}


# -------------------------
# OUTPUT PATHS (LOCKED)
# -------------------------

@dataclass(frozen=True)
class Target:
    key: str
    out_path: Path

TARGETS = [
    Target("upper", Path("public/visualization/awareness/awareness_upper.png")),
    Target("middle", Path("public/visualization/awareness/awareness_middle.png")),
    Target("lower", Path("public/visualization/awareness/awareness_lower.png")),
    Target("full", Path("public/visualization/awareness/awareness_full.png")),
]


# -------------------------
# COMFY WORKFLOW BUILDER
# -------------------------

def build_workflow(prompt_pos: str, prompt_neg: str, seed: int) -> Dict[str, Any]:
    """
    Builds a minimal ComfyUI txt2img workflow:
      CheckpointLoaderSimple -> CLIPTextEncode(pos/neg)
      EmptyLatentImage -> KSampler -> VAEDecode -> SaveImage
    
    NO ControlNet, LoRA, upscaler, or post-processing.
    """
    # Strict parameter clamping
    cfg_clamped = min(CFG, 1.5)
    steps_clamped = min(STEPS, 16)
    
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
                "width": WIDTH,
                "height": HEIGHT,
                "batch_size": 1,
            },
        },
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps_clamped,
                "cfg": cfg_clamped,
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
    url = f"{COMFY_BASE_URL}/view"
    params = {"filename": filename, "subfolder": subfolder, "type": img_type}
    r = session.get(url, params=params, timeout=60)
    r.raise_for_status()
    return r.content


# -------------------------
# IMAGE POST-PROCESS
# -------------------------

def save_png(png_bytes: bytes, out_path: Path) -> None:
    """Save PNG directly without modification."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(io.BytesIO(png_bytes)) as im:
        im = im.convert("RGB")
        im.save(out_path, format="PNG", optimize=True)


# -------------------------
# MAIN
# -------------------------

def main() -> int:
    print(f"Generating awareness silhouette + energy glow assets ({WIDTH}x{HEIGHT})")
    print(f"Settings: {STEPS} steps, CFG {CFG}, {SAMPLER_NAME}/{SCHEDULER}")
    print(f"Checkpoint: {CHECKPOINT}")
    print(f"(No ControlNet, LoRA, upscaler, or post-processing)\n")

    session = requests.Session()

    for idx, t in enumerate(TARGETS):
        modifier = REGION_MODIFIERS[t.key]
        pos = f"{BASE_POSITIVE}, {modifier}"
        neg = NEGATIVE

        seed = (SEED_BASE + idx) if not RANDOM_SEED else random.randint(0, 2**32 - 1)

        print(f"=== Generating: {t.key} -> {t.out_path.as_posix()} ===")
        workflow = build_workflow(pos, neg, seed)

        prompt_id = post_prompt(session, workflow)
        print(f"Submitted prompt_id={prompt_id}")

        hist = poll_history(session, prompt_id, timeout_sec=JOB_TIMEOUT_SEC)
        filename, subfolder, img_type = extract_first_output_image(hist)
        print(f"Comfy output: {filename}")

        png_bytes = download_image_bytes(session, filename, subfolder, img_type)
        save_png(png_bytes, t.out_path)

        print(f"✓ Saved: {t.out_path.as_posix()} ({WIDTH}x{HEIGHT})\n")

    print("All done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
