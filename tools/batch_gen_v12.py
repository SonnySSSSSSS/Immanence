import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_baseline(positive_prompt, prefix, width=1024, height=1024):
    # The "Native Turbo" workflow
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "", "clip": ["4", 1] } }, # NO negative prompt
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": width, "height": height, "batch_size": 1 } }, 
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": 9,
                "cfg": 1.0, # CRITICAL: MUST BE 1.0
                "sampler_name": "euler_ancestral",
                "scheduler": "simple",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } }, # INTERNAL VAE
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": prefix, "images": ["8", 0] } }
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=10) as response:
        res = json.loads(response.read().decode('utf-8'))
        return res['prompt_id']

def run_batch(tasks):
    print(f"--- IMMANENCE V12 ABSOLUTE BASELINE ---")
    print(f"Settings: 9 Steps | CFG 1.0 | Euler Ancestral | Simple | Internal VAE")
    print(f"Model: {CKPT_NAME}\n")

    for prompt, prefix, w, h in tasks:
        try:
            pid = queue_baseline(prompt, prefix, w, h)
            print(f"Queued {prefix} ({w}x{h})")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        # Baseline Square
        ("The word 'EMBER' in plain bold black serif font on a solid white background. Clean 2D graphic. No shading.", "V12_BASE_1024_EMBER", 1024, 1024),
        # Target Wide (Safe Multiple)
        ("The word 'EMBER' in plain bold black serif font on a solid white background. Clean 2D graphic. No shading.", "V12_BASE_WIDE_EMBER", 1024, 384),
        # Target Wide (Original)
        ("The word 'EMBER' in plain bold black serif font on a solid white background. Clean 2D graphic. No shading.", "V12_BASE_WIDE_400_EMBER", 1024, 400)
    ]
    run_batch(example_tasks)
