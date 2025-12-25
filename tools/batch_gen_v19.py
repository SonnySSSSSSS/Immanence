import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_v19(positive_prompt, negative_prompt, prefix):
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
    print(f"--- IMMANENCE V19 TEXTURED HUB BATCH ---")
    print(f"Settings: 1024x1024 | 9 Steps | CFG 1.0 | Aged Manuscript Style")
    print(f"Model: {CKPT_NAME}\n")

    neg = "photorealistic, 3d, gradient, nebula, glow, bloom, depth of field, real mountains, clouds, space photography, blurry, messy lines"

    for prompt, prefix in tasks:
        try:
            pid = queue_v19(prompt, neg, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("Constellation line drawing of a spiral galaxy. White dots (stars) varying in size connected by thin white lines forming spiral arms. Subtle paper texture overlay on lavender background (#D4C5D8). Slight variations in line opacity and dot brightness creating hand-drawn aged quality. Faint grain texture. Small imperfections in dots and lines. Ancient astronomical chart aesthetic. Minimalist but characterful. 1024x1024.", "V19_TEX_PRACTICE"),
        ("Constellation line drawing of Flower of Life sacred geometry. White dots at circle intersections connected by thin white lines. Subtle paper texture overlay on sage blue background (#C5D8D4). Slight variations in line weight and dot opacity creating aged hand-drawn quality. Faint grain texture. Small imperfections suggesting ancient manuscript. Minimalist but characterful. 1024x1024.", "V19_TEX_WISDOM"),
        ("Constellation line drawing of three mountain peaks. White dots at peaks connected by thin white lines. Subtle paper texture overlay on lavender grey background (#D0CFD4). Slight variations in line opacity and dot brightness creating hand-drawn aged quality. Faint grain texture. Small imperfections suggesting worn star chart. Minimalist but characterful. 1024x1024.", "V19_TEX_APPLICATION"),
        ("Constellation line drawing of 8-pointed compass star with concentric circles. White dots at directional points connected by thin white lines. Subtle paper texture overlay on warm grey background (#D4D0C5). Slight variations in line weight and dot opacity creating aged nautical chart quality. Faint grain texture. Small imperfections suggesting antique instrument. Minimalist but characterful. 1024x1024.", "V19_TEX_NAVIGATION")
    ]
    run_batch(example_tasks)
