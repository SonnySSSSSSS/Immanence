import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_hub_bgs(positive_prompt, prefix, width=1024, height=1024):
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "", "clip": ["4", 1] } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": width, "height": height, "batch_size": 1 } }, 
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": 9,
                "cfg": 1.0,
                "sampler_name": "euler_ancestral",
                "scheduler": "simple",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": prefix, "images": ["8", 0] } }
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=10) as response:
        res = json.loads(response.read().decode('utf-8'))
        return res['prompt_id']

def run_batch(tasks):
    print(f"--- IMMANENCE V15 HUB BACKGROUND BATCH ---")
    print(f"Settings: 1024x1024 | 9 Steps | CFG 1.0 | Euler Ancestral")
    print(f"Model: {CKPT_NAME}\n")

    for prompt, prefix in tasks:
        try:
            pid = queue_hub_bgs(prompt, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("Constellation pattern forming a perfect spiral of connected stars, spiraling inward from outer edge to center point. Small white dots (stars) connected by thin cream lines creating a gentle spiral galaxy shape. Subtle, delicate line work on soft lavender background (#D4C5D8). Minimalist astronomical chart aesthetic. Centered composition. 1024x1024.", "V15_HUB_PRACTICE"),
        ("Constellation pattern forming Metatron's Cube sacred geometry. Small white dots (stars) at vertices connected by thin cream lines creating interlocking hexagons and triangles. Subtle, delicate line work on soft sage blue background (#C5D8D4). Minimalist astronomical chart aesthetic. Centered composition. 1024x1024.", "V15_HUB_WISDOM"),
        ("Constellation pattern forming three ascending mountain peaks rising upward. Small white dots (stars) at peak points connected by thin cream lines creating triangular mountain silhouettes. Subtle, delicate line work on soft lavender grey background (#D0CFD4). Minimalist astronomical chart aesthetic. Centered composition. 1024x1024.", "V15_HUB_APPLICATION"),
        ("Constellation pattern forming an 8-pointed compass star with cardinal and ordinal directions. Small white dots (stars) at directional points connected by thin cream lines radiating from center. Subtle, delicate line work on soft warm grey background (#D4D0C5). Minimalist astronomical chart aesthetic. Centered composition. 1024x1024.", "V15_HUB_NAVIGATION")
    ]
    run_batch(example_tasks)
