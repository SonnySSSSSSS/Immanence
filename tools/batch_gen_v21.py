import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_v21(positive_prompt, negative_prompt, prefix):
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": negative_prompt, "clip": ["4", 1] } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } }, 
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": 10,
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
    print(f"--- IMMANENCE V21 BOLD DRAMATIC BATCH ---")
    print(f"Settings: 1024x1024 | 10 Steps | CFG 1.0 | High-Impact Bold Artwork")
    print(f"Model: {CKPT_NAME}\n")

    neg = "photorealistic, 3d, realistic mountains, clouds, space photography, blurry, messy lines, low quality, soft, muted colors"

    for prompt, prefix in tasks:
        try:
            pid = queue_v21(prompt, neg, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("Epic and majestic 2D ancient astronomical chart of a super-massive spiral galaxy. Bold, thick golden ink lines and brilliant glowing white stars. Intense chiaroscuro lighting with deep heavy shadows and blindingly bright solar flares. Intricate secondary micro-geometric paths and complex celestial coordinates. Weathered antique manuscript texture with heavy grain and dark charred edges. Dramatically bold star-clusters and high-contrast light rays. Lavender background (#D4C5D8). Ultra high fidelity detail. 1024x1024.", "V21_BOLD_PRACTICE"),
    ]
    run_batch(example_tasks)
