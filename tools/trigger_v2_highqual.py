import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-fp8-aio.safetensors"

def trigger_one(positive_prompt, prefix):
    # OPTIMIZED FOR TURBO AIO: Lower CFG, Moderate Steps
    workflow = {
      "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "blurry, pixelated, noise, artifacts, low resolution, messy, distorted text, ugly, grainy", "clip": ["4", 1] } },
      "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
      "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 400, "batch_size": 1 } },
      "3": {
        "class_type": "KSampler",
        "inputs": {
          "seed": int(uuid.uuid4().int % (2**32)),
          "steps": 10,       # Increased for definition
          "cfg": 2.0,        # Standard for Turbo AIO - prevents the "fried" look
          "sampler_name": "dpmpp_2m_sde", # Better for crisp results
          "scheduler": "karras",          # Smooth convergence
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        }
      },
      "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
      "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": prefix, "images": ["8", 0] } },
      "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } }
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            print(f"Queued High-Qual {prefix} (ID: {res['prompt_id']})")
    except Exception as e:
        print(f"Failed to queue {prefix}: {e}")

tasks = [
  ("Professional 2D graphic of the word 'EMBER'. Bold, sharp serif typography. Solid fills of burnt orange and amber. Clean white/cream background. Premium minimalist aesthetic. Vector-style sharpness. High resolution.", "EMBER_LIGHT_V2"),
  ("Minimalist 2D graphic of the word 'BEACON'. The letters are a clean, modern serif font in solid cerulean blue. Perfectly sharp edges. Cream background. Zen aesthetic. Professional branding style.", "BEACON_LIGHT_V2"),
  ("Mystical word 'STELLAR' in ancient, sharp serif typography. The letters are made of glowing deep purple nebula gas and sharp crystal shards. Black void background. Cinematic lighting. Ultra high fidelity. 8k.", "STELLAR_DARK_V2"),
  ("A clean, minimalist 2D graphic of the word 'STELLAR'. Sharp modern serif font in soft lavender. Perfectly smooth edges. Cream background. Premium light feel. Professional typography.", "STELLAR_LIGHT_V2")
]

print(f"Connecting to ComfyUI at {COMFYUI_URL}")
print(f"Using Optimized Turbo Parameters: Steps=10, CFG=2.0, Sampler=dpmpp_2m_sde")

for prompt, prefix in tasks:
    trigger_one(prompt, prefix)
    time.sleep(2)

print("---")
print("V2_HIGH_QUAL_QUEUED")
