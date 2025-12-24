import json
import urllib.request
import urllib.parse
import time
import uuid
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_ROOT = Path(r"D:\Unity Apps\immanence-os")

def get_available_checkpoint():
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/object_info") as response:
            data = json.loads(response.read())
            if "CheckpointLoaderSimple" in data:
                return data["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0][0]
    except: return None

def generate(prompt, filename):
    ckpt = get_available_checkpoint()
    print(f"STATUS: Using model {ckpt}")
    
    workflow = {
        "3": { "inputs": { "seed": 42, "steps": 20, "cfg": 8, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
        "4": { "inputs": { "ckpt_name": ckpt }, "class_type": "CheckpointLoaderSimple" },
        "5": { "inputs": { "width": 1024, "height": 512, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "6": { "inputs": { "text": prompt, "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
        "7": { "inputs": { "text": "text, watermark", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
        "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
        "9": { "inputs": { "filename_prefix": "ComfyUI", "images": ["8", 0] }, "class_type": "SaveImage" }
    }

    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    with urllib.request.urlopen(req) as r:
        pid = json.loads(r.read())['prompt_id']
    
    print(f"STATUS: Queued {filename} (ID: {pid})")
    
    start = time.time()
    while time.time() - start < 300:
        # Check queue status
        with urllib.request.urlopen(f"{COMFYUI_URL}/queue") as r:
            q = json.loads(r.read())
            if any(item[1] == pid for item in q['queue_running']):
                print(f"STATUS: {filename} is SAMPLING...")
            elif any(item[1] == pid for item in q['queue_pending']):
                print(f"STATUS: {filename} is WAITING in queue...")
        
        # Check history
        with urllib.request.urlopen(f"{COMFYUI_URL}/history/{pid}") as r:
            h = json.loads(r.read())
            if pid in h:
                print(f"STATUS: {filename} FINISHED. Downloading...")
                img_info = h[pid]['outputs']['9']['images'][0]
                img_url = f"{COMFYUI_URL}/view?filename={img_info['filename']}&subfolder={img_info['subfolder']}&type={img_info['type']}"
                with urllib.request.urlopen(img_url) as r_img:
                    out_path = PROJECT_ROOT / "public" / "titles" / "light" / filename
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(out_path, "wb") as f: f.write(r_img.read())
                print(f"DONE: Saved to {out_path}")
                return True
        time.sleep(5)
    return False

# Start with EMBER
generate("glowing ember, warm orange light, spiritual", "stage-ember.png")
