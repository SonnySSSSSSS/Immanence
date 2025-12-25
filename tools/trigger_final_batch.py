import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
# The user specified Z-Image Turbo AIO (FP8)
CKPT_NAME = "z-image-turbo-fp8-aio.safetensors"

def trigger_one(positive_prompt, prefix):
    workflow = {
      "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "text, watermark, blurry, distorted, low quality", "clip": ["4", 1] } },
      "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
      "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 400, "batch_size": 1 } },
      "3": {
        "class_type": "KSampler",
        "inputs": {
          "seed": int(uuid.uuid4().int % (2**32)),
          "steps": 20,
          "cfg": 8,
          "sampler_name": "euler",
          "scheduler": "normal",
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
            print(f"Queued {prefix} (ID: {res['prompt_id']})")
    except Exception as e:
        print(f"Failed to queue {prefix}: {e}")

tasks = [
  ("A flat 2D vector graphic of the word 'EMBER'. The letters are constructed from sleek, geometric orange and amber facets with subtle paper-cut shadows for a 2.5D minimalist feel. Cream background. Clean serif typography. Single accent of charcoal grey.", "EMBER_LIGHT"),
  ("A minimalist 2D graphic of the word 'BEACON'. The letters use a clean, modern serif font in shades of cerulean and sky blue. Simple geometric linework overlays. Cream background. Professional and zen aesthetic.", "BEACON_LIGHT"),
  ("The word BEACON in elegant, tall serif typography. The letters are made of translucent blue sapphire with trapped celestial light. Intense cyan glow from within. Dark void background. Spiritual, cosmic energy. High details. 4k.", "BEACON_DARK"),
  ("A minimalist 2D graphic of the word 'STELLAR'. The letters are rendered in soft lavender and deep royal purple. Simple geometric celestial symbols (stars, orbits) integrated into the typography. Cream background. Clean, light, premium feel.", "STELLAR_LIGHT"),
  ("The word STELLAR in bold, ancient-feeling typography. The letters are forged from deep purple nebula gas and stardust. Violet shimmering particles. Black space background. Mystical, vast, awe-inspiring. High resolution.", "STELLAR_DARK")
]

print(f"Connecting to ComfyUI at {COMFYUI_URL} using model: {CKPT_NAME}")
for prompt, prefix in tasks:
    trigger_one(prompt, prefix)
    time.sleep(3) # Wait for stability

print("---")
print("ALL_QUEUED")
print("Protocol: Fire-and-Forget. User handles placement.")
