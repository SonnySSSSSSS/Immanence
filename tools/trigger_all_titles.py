import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"

def get_api_workflow(positive_prompt, prefix, height=400):
    return {
      "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "text, watermark, blurry, distorted, low quality, messy, complex background", "clip": ["4", 1] } },
      "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
      "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": height, "batch_size": 1 } },
      "3": {
        "class_type": "KSampler",
        "inputs": {
          "seed": int(uuid.uuid4().int % (2**32)),
          "steps": 25,
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
      "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "z_image_turbo_bf16.safetensors" } }
    }

def queue_prompt(workflow):
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            return res['prompt_id']
    except Exception as e:
        print(f"Failed to queue: {e}")
        return None

# Prompts setup
prompts = [
    ("Ember_Light", "A flat 2D vector graphic of the word 'EMBER'. The letters are constructed from sleek, geometric orange and amber facets with subtle paper-cut shadows for a 2.5D minimalist feel. Cream background. Clean serif typography. Single accent of charcoal grey."),
    ("Beacon_Dark", "The word BEACON in elegant, tall serif typography. The letters are made of translucent blue sapphire with trapped celestial light. Intense cyan glow from within. Dark void background. Spiritual, cosmic energy. High details. 4k."),
    ("Beacon_Light", "A minimalist 2D graphic of the word 'BEACON'. The letters use a clean, modern serif font in shades of cerulean and sky blue. Simple geometric linework overlays. Cream background. Professional and zen aesthetic."),
    ("Stellar_Dark", "The word STELLAR in bold, ancient-feeling typography. The letters are forged from deep purple nebula gas and stardust. Violet shimmering particles. Black space background. Mystical, vast, awe-inspiring. High resolution."),
    ("Stellar_Light", "A minimalist 2D graphic of the word 'STELLAR'. The letters are rendered in soft lavender and deep royal purple. Simple geometric celestial symbols (stars, orbits) integrated into the typography. Cream background. Clean, light, premium feel.")
]

print(f"Connecting to ComfyUI at {COMFYUI_URL}...")
for prefix, text in prompts:
    prompt_id = queue_prompt(get_api_workflow(text, prefix))
    if prompt_id:
        print(f"Queued {prefix} (ID: {prompt_id})")
    time.sleep(0.5)

print("---")
print("ALL_QUEUED")
print("Protocol: Fire-and-Forget. User handles placement.")
