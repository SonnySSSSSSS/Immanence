import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"

def get_api_workflow(positive_prompt, height=400):
    return {
      "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "text, watermark, blurry, distorted, low quality", "clip": ["4", 1] } },
      "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
      "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": height, "batch_size": 1 } },
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
      "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "EMBER_GEN", "images": ["8", 0] } },
      "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "z_image_turbo_bf16.safetensors" } }
    }

def queue_prompt(workflow):
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode('utf-8'))
        return res['prompt_id']

# Dark Mode Prompt
p1 = "The word EMBER rendered in large, bold, elegant serif typography. The letters are made of black obsidian rock with glowing orange and red magma cracks. Spiritual, mystical, cinematic lighting, black background. Volcanic heat aesthetic. High details. Ultra high resolution. 4k."
# Light Mode Prompt
p2 = "A flat 2D graphic of the word \"EMBER\". The letters are filled with a mosaic pattern of sharp, triangular shards in varying shades of amber, bright orange, and deep charcoal. The arrangement creates a sense of \"glowing heat\" through flat color blocking rather than gradients. Thin black outline on the letters. Centered on a cream background."

try:
    id1 = queue_prompt(get_api_workflow(p1))
    print(f"Triggered Dark Mode Ember (ID: {id1})")
    time.sleep(1)
    id2 = queue_prompt(get_api_workflow(p2))
    print(f"Triggered Light Mode Ember (ID: {id2})")
    print("ALL_QUEUED")
except Exception as e:
    print(f"ERROR: {e}")
