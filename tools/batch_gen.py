import json
import urllib.request
import uuid
import time
import sys

# ComfyUI Configuration
COMFYUI_URL = "http://127.0.0.1:8188"
# Optimized for Z-Image Turbo AIO (BF16) - Better Precision
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_job(positive_prompt, prefix, steps=25, cfg=1.5):
    """
    Submit a single prompt to ComfyUI via API.
    V7 Precision Settings: Higher steps and balanced CFG for razor-sharp vector text.
    """
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "blurry, low quality, grainy, artifacts, soft focus, bokeh, glow, bloom, blur, depth of field, fuzzy, text noise, shading, gradient, grey, gray", "clip": ["4", 1] } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 400, "batch_size": 1 } },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": steps,
                "cfg": cfg,
                "sampler_name": "euler",
                "scheduler": "karras",
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
    """Executes a list of (prompt, prefix) tuples."""
    queued = []
    print(f"--- 🚀 IMMANENCE BATCH GENERATOR (V7 PRECISION) 🚀 ---")
    print(f"Connecting to: {COMFYUI_URL}")
    print(f"Model: {CKPT_NAME}")
    print(f"Settings: Steps=25, CFG=1.5 (Razor Sharp)\n")

    for prompt, prefix in tasks:
        try:
            pid = queue_job(prompt, prefix)
            queued.append(f"{prefix}: {pid}")
            print(f"✓ Queued {prefix}")
            time.sleep(1.0) # Small delay to ensure stability
        except Exception as e:
            print(f"✗ Failed {prefix}: {e}")
    
    print(f"\n{len(queued)} jobs total successfully queued.")
    print(f"ComfyUI is processing in the background.")
    print(f"Check D:\\AI\\ComfyUI\\output for results.")
    print(f"----------------------------------------")

if __name__ == "__main__":
    # Example task list for standardized generation
    # Any follow-up requests for stage tools should be added here
    example_tasks = [
        ("Razor-sharp 2D black and white typography of the word 'EMBER'. Pure solid black letters on a clean solid white background. Clinical vector style. No shading. No textures. High contrast.", "V7_SHARP_EMBER"),
        ("Razor-sharp 2D black and white typography of the word 'BEACON'. Pure solid black letters on a clean solid white background. Clinical vector style. No shading. No textures. High contrast.", "V7_SHARP_BEACON"),
        ("Razor-sharp 2D black and white typography of the word 'STELLAR'. Pure solid black letters on a clean solid white background. Clinical vector style. No shading. No textures. High contrast.", "V7_SHARP_STELLAR")
    ]
    
    run_batch(example_tasks)
    sys.exit(0)
