import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_v18(positive_prompt, negative_prompt, prefix):
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": negative_prompt, "clip": ["4", 1] } },
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
    print(f"--- IMMANENCE V18 LINE ART HUB BATCH ---")
    print(f"Settings: 1024x1024 | 9 Steps | CFG 1.0 | Ancient Star Chart Style")
    print(f"Model: {CKPT_NAME}\n")

    neg = "photorealistic, 3d, gradient, nebula, glow, bloom, depth of field, real mountains, clouds, space photography, blurry, messy lines, gritty texture"

    for prompt, prefix in tasks:
        try:
            pid = queue_v18(prompt, neg, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("Clean constellation line drawing of a spiral galaxy. White dots (stars) of varying sizes connected by thin white lines forming spiral arms from center outward. Simple, elegant curves. No gradients, no realistic effects. Flat solid lavender background (#D4C5D8). Minimalist astronomical chart style like ancient star maps. 1024x1024.", "V18_LINE_PRACTICE"),
        ("Clean constellation line drawing of Flower of Life pattern. White dots (stars) at circle intersections connected by thin white lines. Multiple overlapping circles forming sacred geometry. No gradients, no glow effects. Flat solid sage blue background (#C5D8D4). Minimalist astronomical chart style like ancient star maps. 1024x1024.", "V18_LINE_WISDOM"),
        ("Clean constellation line drawing of three mountain peaks. White dots (stars) at peak points and ridgelines connected by thin white lines forming triangular mountain silhouettes. Simple geometric shapes. No realistic mountains, no sky effects. Flat solid lavender grey background (#D0CFD4). Minimalist astronomical chart style like ancient star maps. 1024x1024.", "V18_LINE_APPLICATION"),
        ("Clean constellation line drawing of 8-pointed compass star. White dots (stars) at directional points connected by thin white lines radiating from center. Concentric circle guides. No ornate details, no gradient effects. Flat solid warm grey background (#D4D0C5). Minimalist astronomical chart style like ancient star maps. 1024x1024.", "V18_LINE_NAVIGATION")
    ]
    run_batch(example_tasks)
