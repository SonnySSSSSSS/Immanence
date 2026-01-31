#!/usr/bin/env python3
"""
Simple ComfyUI asset generator for Sakshi scenes.
Builds workflow directly (no conversion needed).
"""

import json
import time
import sys
from pathlib import Path
import requests
from PIL import Image
import io

COMFY_URL = "http://127.0.0.1:8188"
OUTPUT_DIR = Path("public/scenes/sakshi")

# Scene prompts
SCENES = {
    "forest": {
        "background": "distant forest canopy, soft sky filtered through leaves, misty depth, muted greens",
        "midground": "forest path surrounded by trees, gentle depth, soft foliage forms, low contrast",
        "foreground": "earth path with scattered leaves, close ground texture, painterly brush strokes",
    }
}

GLOBAL_POSITIVE = "painterly illustration, soft brush texture, muted natural colors, matte surface, diffuse daylight, contemplative atmosphere, minimal detail, calm composition"
NEGATIVE = "text, watermark, people, faces, animals, cinematic lighting, dramatic shadows, harsh contrast, oversaturated colors, photorealistic"


def test_connection():
    """Test ComfyUI is accessible."""
    try:
        r = requests.get(f"{COMFY_URL}/system_stats", timeout=5)
        print(f"✅ ComfyUI connected: {r.status_code}")
        return True
    except Exception as e:
        print(f"❌ ComfyUI not accessible: {e}")
        return False


def build_workflow(prompt_pos: str, prompt_neg: str, seed: int) -> dict:
    """Build minimal Z-Image workflow in API format."""
    return {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "z_image_turbo_bf16.safetensors"}
        },
        "2": {
            "class_type": "CLIPLoader",
            "inputs": {
                "clip_name": "qwen_3_4b.safetensors",
                "type": "lumina2"
            }
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt_pos,
                "clip": ["2", 0]
            }
        },
        "4": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": prompt_neg,
                "clip": ["2", 0]
            }
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {
                "width": 1024,
                "height": 1024,
                "batch_size": 1
            }
        },
        "6": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": 9,
                "cfg": 1.0,
                "sampler_name": "res_multistep",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["3", 0],
                "negative": ["4", 0],
                "latent_image": ["5", 0]
            }
        },
        "7": {
            "class_type": "VAEDecode",
            "inputs": {
                "samples": ["6", 0],
                "vae": ["1", 2]
            }
        },
        "8": {
            "class_type": "SaveImage",
            "inputs": {
                "images": ["7", 0],
                "filename_prefix": "sakshi_scene"
            }
        }
    }


def submit_workflow(workflow: dict) -> str:
    """Submit workflow to ComfyUI and return prompt_id."""
    r = requests.post(
        f"{COMFY_URL}/prompt",
        json={"prompt": workflow},
        timeout=30
    )

    if r.status_code != 200:
        print(f"ERROR: {r.status_code}")
        print(f"Response: {r.text}")
        raise RuntimeError(f"ComfyUI rejected workflow: {r.text}")

    data = r.json()
    prompt_id = data.get("prompt_id")
    if not prompt_id:
        raise RuntimeError(f"No prompt_id in response: {data}")

    return prompt_id


def poll_completion(prompt_id: str, timeout_sec: int = 300) -> dict:
    """Poll history until job completes."""
    start = time.time()

    while time.time() - start < timeout_sec:
        r = requests.get(f"{COMFY_URL}/history/{prompt_id}", timeout=10)
        data = r.json()

        if prompt_id in data and data[prompt_id].get("outputs"):
            return data[prompt_id]

        time.sleep(2)

    raise TimeoutError(f"Job {prompt_id} timed out after {timeout_sec}s")


def download_image(filename: str, subfolder: str = "") -> bytes:
    """Download image from ComfyUI."""
    r = requests.get(
        f"{COMFY_URL}/view",
        params={
            "filename": filename,
            "subfolder": subfolder,
            "type": "output"
        },
        timeout=30
    )
    r.raise_for_status()
    return r.content


def save_webp(image_bytes: bytes, out_path: Path):
    """Convert to WEBP and save."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img.save(out_path, format="WEBP", quality=90)
    print(f"  ✅ Saved: {out_path}")


def generate_layer(scene: str, layer: str, prompt_core: str, seed: int = 8888):
    """Generate one layer."""
    print(f"\n{'='*60}")
    print(f"Generating: {scene}/{layer}")
    print(f"{'='*60}")

    prompt_pos = f"{prompt_core}, {GLOBAL_POSITIVE}"

    # Build and submit
    workflow = build_workflow(prompt_pos, NEGATIVE, seed)
    print("📤 Submitting to ComfyUI...")
    prompt_id = submit_workflow(workflow)
    print(f"   ID: {prompt_id}")

    # Poll for completion
    print("⏳ Waiting for generation...")
    history = poll_completion(prompt_id)

    # Extract and download image
    outputs = history.get("outputs", {})
    for out_key, out_data in outputs.items():
        images = out_data.get("images", [])
        if images:
            image = images[0]
            filename = image["filename"]
            subfolder = image.get("subfolder", "")

            print(f"📥 Downloading image...")
            img_bytes = download_image(filename, subfolder)

            out_path = OUTPUT_DIR / scene / f"{layer}.webp"
            save_webp(img_bytes, out_path)
            return

    raise RuntimeError("No image in ComfyUI output")


def main():
    if not test_connection():
        sys.exit(1)

    print("\n🎨 Generating Sakshi scene assets...\n")

    try:
        # Test with forest/midground
        scene_data = SCENES["forest"]
        generate_layer("forest", "midground", scene_data["midground"], seed=8888)

        print("\n✅ Success! Try other layers/scenes now.")
        print("\nUsage:")
        print("  python tools/comfy/simple_generate.py forest background")
        print("  python tools/comfy/simple_generate.py forest foreground")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
