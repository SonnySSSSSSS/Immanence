import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_v17(positive_prompt, prefix):
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "", "clip": ["4", 1] } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } }, 
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
    print(f"--- IMMANENCE V17 DRAMATIC HUB BATCH ---")
    print(f"Settings: 1024x1024 | 9 Steps | CFG 1.0 | High-Impact Visuals")
    print(f"Model: {CKPT_NAME}\n")

    for prompt, prefix in tasks:
        try:
            pid = queue_v17(prompt, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("Constellation pattern forming a vibrant spiral galaxy. Dense rings of glowing white and gold stars spiraling inward to a bright luminous center. Constellation lines connecting stars in spiral arms. Rich starfield with varying star sizes. Central glow with subtle radial light rays. Soft lavender background (#D4C5D8) with subtle nebula wisps. Dramatic depth and contrast. 1024x1024.", "V17_DRAM_PRACTICE"),
        ("Constellation pattern forming elaborate nested sacred geometry. Multiple overlapping circles (Flower of Life) with Metatron's Cube and Sri Yantra elements. Dense network of glowing gold and white stars at intersections. Constellation lines creating intricate geometric web. Central luminous point. Subtle geometric auras. Soft sage blue background (#C5D8D4) with ethereal glow. Rich, mystical depth. 1024x1024.", "V17_DRAM_WISDOM"),
        ("Constellation pattern forming dramatic mountain range silhouette against night sky. Three prominent peaks with dense star clusters forming ridgelines. Milky Way arc above mountains. Additional constellation patterns in sky depicting ascending paths. Gold and white stars of varying brightness. Subtle aurora glow behind peaks. Soft lavender grey background (#D0CFD4). Majestic, aspirational depth. 1024x1024.", "V17_DRAM_APPLICATION"),
        ("Constellation pattern forming ornate astrolabe with multiple concentric circles. Central 8-pointed compass star surrounded by zodiac ring, degree markers, and celestial coordinates. Dense constellation patterns in outer rings. Gold and white stars at all intersections. Radial guide lines. Subtle glow from center spreading outward. Soft warm grey background (#D4D0C5). Intricate navigational instrument depth. 1024x1024.", "V17_DRAM_NAVIGATION")
    ]
    run_batch(example_tasks)
