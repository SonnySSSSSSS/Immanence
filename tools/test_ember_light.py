import json
import urllib.request
import uuid

COMFYUI_URL = "http://127.0.0.1:8188"

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
      "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "z_image_turbo_bf16.safetensors" } }
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            print(f"Queued {prefix} (ID: {res['prompt_id']})")
    except Exception as e:
        print(f"Failed: {e}")

p = "A flat 2D vector graphic of the word 'EMBER'. The letters are constructed from sleek, geometric orange and amber facets with subtle paper-cut shadows for a 2.5D minimalist feel. Cream background. Clean serif typography. Single accent of charcoal grey."

trigger_one(p, "EMBER_LIGHT")
