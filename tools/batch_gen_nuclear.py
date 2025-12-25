import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_nuclear_sharp(positive_prompt, prefix):
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "blurry, low quality, grainy, artifacts, soft focus, bokeh, glow, bloom, blur, depth of field, fuzzy, text noise, motion blur, out of focus", "clip": ["4", 1] } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } }, 
        "10": { "class_type": "VAELoader", "inputs": { "vae_name": "ae.safetensors" } },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": 12,
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
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["10", 0] } },
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": prefix, "images": ["8", 0] } }
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=10) as response:
        res = json.loads(response.read().decode('utf-8'))
        return res['prompt_id']

def run_batch(tasks):
    print(f"--- IMMANENCE NATIVE BASELINE BATCH (V11) ---")
    print(f"Settings: 1024x1024 | 12 Steps | CFG 1.5 | External VAE")
    print(f"Model: {CKPT_NAME}\n")

    for prompt, prefix in tasks:
        try:
            pid = queue_nuclear_sharp(prompt, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("The word 'EMBER' in plain bold black serif font on a solid white background. Perfectly sharp, high resolution, clinical vector style. Black on white. 1024x1024.", "V11_NATIVE_EMBER"),
        ("The word 'BEACON' in plain bold black serif font on a solid white background. Perfectly sharp, high resolution, clinical vector style. Black on white. 1024x1024.", "V11_NATIVE_BEACON"),
        ("The word 'STELLAR' in plain bold black serif font on a solid white background. Perfectly sharp, high resolution, clinical vector style. Black on white. 1024x1024.", "V11_NATIVE_STELLAR")
    ]
    run_batch(example_tasks)
