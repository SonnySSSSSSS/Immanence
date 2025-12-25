import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_v16(positive_prompt, prefix):
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
    print(f"--- IMMANENCE V16 HUB BACKGROUND BATCH (REF-MATCHED) ---")
    print(f"Settings: 1024x1024 | 9 Steps | CFG 1.0 | Sacred Geometry Style")
    print(f"Model: {CKPT_NAME}\n")

    for prompt, prefix in tasks:
        try:
            pid = queue_v16(prompt, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("Minimalist sacred geometry of a perfect spiral galaxy made of glowing cream and gold constellation dots and thin connecting lines. Soft, warm off-white paper background. Delicate, elegant line work. Astronomical chart aesthetic. Centered composition. High fidelity. 1024x1024.", "V16_HUB_PRACTICE"),
        ("Minimalist sacred geometry of Metatron's Cube made of glowing cream and gold constellation dots at vertices and thin connecting lines. Interlocking hexagons and triangles. Soft, warm off-white paper background. Delicate, elegant line work. Astronomical chart aesthetic. Centered composition. High fidelity. 1024x1024.", "V16_HUB_WISDOM"),
        ("Minimalist sacred geometry of three ascending mountain peaks made of glowing cream and gold constellation dots and thin connecting lines. Triangular silhouettes. Soft, warm off-white paper background. Delicate, elegant line work. Astronomical chart aesthetic. Centered composition. High fidelity. 1024x1024.", "V16_HUB_APPLICATION"),
        ("Minimalist sacred geometry of an 8-pointed compass star made of glowing cream and gold constellation dots and thin connecting lines radiating from center. Soft, warm off-white paper background. Delicate, elegant line work. Astronomical chart aesthetic. Centered composition. High fidelity. 1024x1024.", "V16_HUB_NAVIGATION")
    ]
    run_batch(example_tasks)
