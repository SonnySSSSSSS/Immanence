"""
Generate 4 Awareness body-scan assets via ComfyUI HTTP API.
Chakra-indicated, ethereal energy-body assets (no text, no symbols).

Outputs (final, 768x768 PNG):
- public/awareness/body-scan/upper.png
- public/awareness/body-scan/middle.png
- public/awareness/body-scan/lower.png
- public/awareness/body-scan/full.png

ComfyUI requirement:
- ComfyUI running locally (default: http://127.0.0.1:8188)
- Turbo checkpoint (z-image-turbo-fp8-aio.safetensors or equivalent)

Install (once):
  python -m pip install requests pillow

Run:
  python tools/comfy/generate_awareness_body_scan_assets.py
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
CHECKPOINT = "z-image-turbo-fp8-aio.safetensors"

# Authoring resolution and final output
MASTER_W, MASTER_H = 1024, 1024
FINAL_W, FINAL_H = 768, 768

# Sampling settings (TURBO-OPTIMIZED, STRICT CAPS)
STEPS = 8  # 6–8 only
CFG = 1.4  # 1.0–2.0 only
SAMPLER_NAME = "euler"  # default-style for turbo
SCHEDULER = "normal"
DENOISE = 1.0

# Deterministic seeds (optional)
RANDOM_SEED = True
SEED_BASE = 4242

# Save prefix inside Comfy outputs
COMFY_FILENAME_PREFIX = "awareness_body_scan"

# Timeouts
POLL_INTERVAL_SEC = 0.6
JOB_TIMEOUT_SEC = 180


# -------------------------
# PROMPTS (LOCKED)
# -------------------------

BASE_POSITIVE = (
    "ethereal, cosmic, translucent energetic human body, soft luminous glow, nebula and starfield background, "
    "elegant sacred geometry accents, non-realistic anatomy, calm symmetry, high contrast glow on active regions, "
    "dark desaturated body elsewhere, painterly but clean, square format, centered composition, "
    "consistent camera distance across series, no text, no labels, no UI elements"
)

NEGATIVE = (
    "text, letters, glyphs, logos, watermark, realistic anatomy, detailed face, photorealistic, "
    "extra limbs, distorted proportions, asymmetrical lighting, harsh shadows, lens flare, bloom overdone"
)

REGION_PROMPTS = {
    "upper": (
        "ONLY crown and third eye chakras are active with bright glowing light. "
        "Crown glows violet and white with subtle halo above head. Third eye glows indigo at forehead. "
        "NO energy visible anywhere else on body. Heart, solar plexus, sacral, root are completely dark and unlit. "
        "Upper torso fades into total darkness below shoulders. "
        "Same pose and camera angle as other images in series. "
        "Inactive chakras must be fully off, not dimmed or faded."
    ),
    "middle": (
        "ONLY heart and solar plexus chakras are active with bright glowing light. "
        "Heart glows emerald green at chest center. Solar plexus glows warm golden yellow in upper abdomen. "
        "Energy softly radiates outward across chest and upper abdomen. "
        "NO energy visible at crown, forehead, throat, sacral, or root. Head completely unlit. Lower body completely unlit. "
        "Same pose and camera angle as other images in series. "
        "Inactive chakras must be fully off, not dimmed or faded."
    ),
    "lower": (
        "ONLY sacral and root chakras are active with bright glowing light. "
        "Sacral glows deep orange in lower abdomen. Root glows deep red, grounded downward into space. "
        "Energy concentrates in pelvic region only. "
        "NO energy visible anywhere else. Head completely dark, torso completely dark, no heart or solar glow. "
        "Same pose and camera angle as other images in series. "
        "Inactive chakras must be fully off, not dimmed or faded."
    ),
    "full": (
        "ALL seven chakras are active and visible along central vertical axis, evenly balanced intensity. "
        "From bottom to top: root (deep red) → sacral (orange) → solar plexus (golden yellow) → heart (emerald green) → throat (cyan blue) → third eye (indigo) → crown (violet white). "
        "Restrained rainbow spectrum, harmonious intensity, no single chakra overpowering others. "
        "Subtle vertical energy alignment and integration. "
        "Same pose and camera angle as other images in series. "
        "This image must look visually distinct from the other three."
    ),
}


# -------------------------
# OUTPUT PATHS (PUBLIC ONLY)
# -------------------------

@dataclass(frozen=True)
class Target:
    key: str
    out_path: Path

TARGETS = [
    Target("upper", Path("public/awareness/body-scan/upper.png")),
    Target("middle", Path("public/awareness/body-scan/middle.png")),
    Target("lower", Path("public/awareness/body-scan/lower.png")),
    Target("full", Path("public/awareness/body-scan/full.png")),
]


# -------------------------
# COMFY WORKFLOW BUILDER
# -------------------------

def build_workflow(prompt_pos: str, prompt_neg: str, seed: int) -> Dict[str, Any]:
    """
    Minimal ComfyUI txt2img workflow:
      CheckpointLoaderSimple -> CLIPTextEncode(pos/neg)
      EmptyLatentImage -> KSampler -> VAEDecode -> SaveImage
    """
    cfg_clamped = min(max(CFG, 1.0), 2.0)
    steps_clamped = min(max(STEPS, 6), 8)

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
                "clip": ["1", 1],
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
                "steps": steps_clamped,
                "cfg": cfg_clamped,
                "sampler_name": SAMPLER_NAME,
                "scheduler": SCHEDULER,
                "denoise": DENOISE,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0],
            },
        },
        "6": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["5", 0],
                "vae": ["1", 2],
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


def poll_history(session: requests.Session, prompt_id: str) -> Dict[str, Any]:
    url = f"{COMFY_BASE_URL}/history/{prompt_id}"
    start = time.time()
    while True:
        if time.time() - start > JOB_TIMEOUT_SEC:
            raise TimeoutError("ComfyUI job timed out")
        r = session.get(url, timeout=30)
        r.raise_for_status()
        data = r.json()
        if prompt_id in data and data[prompt_id].get("outputs"):
            return data[prompt_id]
        time.sleep(POLL_INTERVAL_SEC)


def extract_first_output_image(history: Dict[str, Any]) -> Tuple[str, str]:
    outputs = history.get("outputs", {})
    for _, out in outputs.items():
        images = out.get("images")
        if images:
            image = images[0]
            return image["filename"], image["subfolder"]
    raise RuntimeError("No output images found in ComfyUI history")


def download_image_bytes(session: requests.Session, filename: str, subfolder: str) -> bytes:
    url = f"{COMFY_BASE_URL}/view"
    params = {"filename": filename, "subfolder": subfolder, "type": "output"}
    r = session.get(url, params=params, timeout=60)
    r.raise_for_status()
    return r.content


def save_png(data: bytes, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(io.BytesIO(data)).convert("RGBA")
    if (MASTER_W, MASTER_H) != (FINAL_W, FINAL_H):
        im = im.resize((FINAL_W, FINAL_H), resample=Image.LANCZOS)
    im.save(out_path, format="PNG")


# -------------------------
# MAIN
# -------------------------

def main() -> None:
    session = requests.Session()

    for idx, target in enumerate(TARGETS):
        seed = random.randint(0, 2**32 - 1) if RANDOM_SEED else SEED_BASE + idx
        prompt_pos = f"{BASE_POSITIVE}, {REGION_PROMPTS[target.key]}"
        workflow = build_workflow(prompt_pos, NEGATIVE, seed)
        prompt_id = post_prompt(session, workflow)
        history = poll_history(session, prompt_id)
        filename, subfolder = extract_first_output_image(history)
        img_bytes = download_image_bytes(session, filename, subfolder)
        save_png(img_bytes, target.out_path)
        print(f"Saved {target.key} -> {target.out_path}")


if __name__ == "__main__":
    main()
