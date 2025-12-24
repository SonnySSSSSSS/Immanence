import json
import urllib.request
import urllib.error
import time
import uuid
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_ROOT = Path(r"D:\Unity Apps\immanence-os")

def get_api_workflow(positive_prompt, negative_prompt="text, watermark"):
    return {
      "7": { "class_type": "CLIPTextEncode", "inputs": { "text": negative_prompt, "clip": ["4", 1] } },
      "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
      "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 512, "batch_size": 1 } },
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
      "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "ComfyUI", "images": ["8", 0] } },
      "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "z_image_turbo_bf16.safetensors" } }
    }

def queue_prompt(workflow):
    # Fixed: wrap workflow in "prompt" key
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            print(f"Queued prompt ID: {res['prompt_id']}")
            return res['prompt_id']
    except urllib.error.HTTPError as e:
        print(f"Queue Error {e.code}: {e.read().decode('utf-8')}")
        return None

def get_history(prompt_id):
    try:
        req = urllib.request.Request(f"{COMFYUI_URL}/history/{prompt_id}")
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except:
        return {}

def get_image(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(f"{COMFYUI_URL}/view?{url_values}") as response:
        return response.read()

def generate_one(prompt, filename):
    print(f"--- Generating {filename} ---")
    workflow = get_api_workflow(prompt)
    pid = queue_prompt(workflow)
    if not pid: return False
    
    start_wait = time.time()
    while time.time() - start_wait < 600: # 10 min timeout
        hist = get_history(pid)
        if pid in hist:
            print(f"Prompt {pid} finished.")
            outputs = hist[pid].get("outputs", {})
            for node_id, node_output in outputs.items():
                if "images" in node_output:
                    img_info = node_output["images"][0]
                    img_data = get_image(img_info["filename"], img_info.get("subfolder", ""), img_info.get("type", "output"))
                    out_p = PROJECT_ROOT / "public" / "titles" / "light" / filename
                    out_p.parent.mkdir(parents=True, exist_ok=True)
                    with open(out_p, "wb") as f: f.write(img_data)
                    print(f"Successfully saved {filename}")
                    return True
        time.sleep(5)
    print(f"Timed out waiting for {filename}")
    return False

# Prompt for EMBER
ember_prompt = "A flat 2D graphic of the word \"EMBER\". The letters are filled with a mosaic pattern of sharp, triangular shards in varying shades of amber, bright orange, and deep charcoal. The arrangement creates a sense of \"glowing heat\" through flat color blocking rather than gradients. Thin black outline on the letters. Centered on a cream background."
generate_one(ember_prompt, "stage-ember.png")
