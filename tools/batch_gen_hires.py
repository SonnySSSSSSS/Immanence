import json
import urllib.request
import uuid
import time
import sys

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_hi_res_fix(positive_prompt, prefix):
    # Pass 1: Base Composition (512x200)
    # Pass 2: Refinement (1024x400)
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "blurry, low quality, grainy, artifacts, soft focus, bokeh, glow, bloom, blur, depth of field, fuzzy, bad text, distorted", "clip": ["4", 1] } },
        
        # Initial Latent (Small)
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 512, "height": 200, "batch_size": 1 } },
        
        # Sampler Pass 1 (Base)
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": 10,
                "cfg": 1.5,
                "sampler_name": "euler",
                "scheduler": "karras",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        
        # Latent Upscale (2x)
        "10": {
            "class_type": "LatentUpscaleBy",
            "inputs": {
                "samples": ["3", 0],
                "scale_by": 2,
                "upscale_method": "bicubic"
            }
        },
        
        # Sampler Pass 2 (High Res Refinement)
        "11": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": 12,
                "cfg": 1.5,
                "sampler_name": "euler",
                "scheduler": "karras",
                "denoise": 0.5, # Critical: subtle refinement
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["10", 0]
            }
        },
        
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["11", 0], "vae": ["4", 2] } },
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": prefix, "images": ["8", 0] } }
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=10) as response:
        res = json.loads(response.read().decode('utf-8'))
        return res['prompt_id']

def run_batch(tasks):
    print(f"--- IMMANENCE HI-RES FIX BATCH (V8) ---")
    print(f"Workflow: 512x200 -> 2x Latent Upscale -> 1024x400 Refinement")
    print(f"Model: {CKPT_NAME} | Sampler: euler/karras\n")

    for prompt, prefix in tasks:
        try:
            pid = queue_hi_res_fix(prompt, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")
    
    print(f"\nBatch successfully queued. Check D:\\AI\\ComfyUI\\output for V8_HIRES results.")

if __name__ == "__main__":
    example_tasks = [
        ("Razor-sharp 2D black and white typography of the word 'EMBER'. Pure solid black letters on a clean solid white background. No shading. No textures.", "V8_HIRES_EMBER"),
        ("Razor-sharp 2D black and white typography of the word 'BEACON'. Pure solid black letters on a clean solid white background. No shading. No textures.", "V8_HIRES_BEACON"),
        ("Razor-sharp 2D black and white typography of the word 'STELLAR'. Pure solid black letters on a clean solid white background. No shading. No textures.", "V8_HIRES_STELLAR")
    ]
    run_batch(example_tasks)
