import json
import urllib.request
import urllib.parse
import time
import uuid
import os
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_ROOT = Path(r"D:\Unity Apps\immanence-os")

def get_ckpt():
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/object_info") as r:
            data = json.loads(r.read())
            return data["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0][0]
    except: return "z_image_turbo_bf16.safetensors"

def generate_one(prompt, filename):
    print(f"PROGRESS: Starting {filename} (Abstract)...")
    ckpt = get_ckpt()
    
    workflow = {
        "3": { "inputs": { "seed": int(time.time()), "steps": 20, "cfg": 8, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] }, "class_type": "KSampler" },
        "4": { "inputs": { "ckpt_name": ckpt }, "class_type": "CheckpointLoaderSimple" },
        "5": { "inputs": { "width": 1024, "height": 512, "batch_size": 1 }, "class_type": "EmptyLatentImage" },
        "6": { "inputs": { "text": prompt, "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
        "7": { "inputs": { "text": "text, letters, watermark, blurry, low quality", "clip": ["4", 1] }, "class_type": "CLIPTextEncode" },
        "8": { "inputs": { "samples": ["3", 0], "vae": ["4", 2] }, "class_type": "VAEDecode" },
        "9": { "inputs": { "filename_prefix": "ComfyUI", "images": ["8", 0] }, "class_type": "SaveImage" }
    }

    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    with urllib.request.urlopen(req) as r:
        pid = json.loads(r.read())['prompt_id']
    
    print(f"PROGRESS: Queued {filename} (ID: {pid})")
    
    start_wait = time.time()
    while time.time() - start_wait < 300:
        # Check queue
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/queue") as r:
                q = json.loads(r.read())
                if any(item[1] == pid for item in q['queue_running']):
                    print(f"PROGRESS: Sampling {filename}...")
                elif any(item[1] == pid for item in q['queue_pending']):
                    print(f"PROGRESS: {filename} in queue...")
        except: pass
        
        # Check history
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/history/{pid}") as r:
                h = json.loads(r.read())
                if pid in h:
                    img_info = h[pid]['outputs']['9']['images'][0]
                    img_url = f"{COMFYUI_URL}/view?filename={img_info['filename']}&subfolder={img_info['subfolder']}&type={img_info['type']}"
                    with urllib.request.urlopen(img_url) as r_img:
                        out_path = PROJECT_ROOT / "public" / "titles" / "light" / filename
                        out_path.parent.mkdir(parents=True, exist_ok=True)
                        with open(out_path, "wb") as f: f.write(r_img.read())
                    print(f"PROGRESS: SUCCESS - Saved {filename}")
                    return True
        except: pass
        time.sleep(5)
    print(f"PROGRESS: TIMEOUT - {filename}")
    return False

# Mapping Options A-D to Stage assets
stages = [
    ("Flat 2D abstract background image. Center focal point radiating sharp geometric triangular rays outward in a sunburst pattern. Color palette: deep orange core transitioning to bright yellow tips with touches of vermillion red. Highly structured, symmetrical radial design. Clean vector aesthetic. Horizontal rectangular composition on cream background. Minimalist, energetic, sacred geometry style.", "stage-ember.png"),
    ("Flat 2D abstract background image. Concentric circular waves pulsing outward from a bright central point. Color palette: bright yellow-white center, graduated rings of orange, burnt orange, and deep amber moving outward. Sharp-edged geometric circles, not smooth gradients. Horizontal rectangular composition on cream background. Rhythmic, pulsing energy. Clean vector aesthetic.", "stage-flame.png"),
    ("Flat 2D abstract background image. Intricate geometric mandala pattern radiating from center. Pattern uses sharp angular shapes suggesting stylized flames arranged in precise rotational symmetry. Color palette: gold, bright orange, deep red, touches of yellow. Flat color blocks, no gradients. Horizontal rectangular composition on cream background. Refined, structured energy.", "stage-beacon.png"),
    ("Flat 2D abstract background image. Flowing ribbon-like shapes spiraling outward from a central point, suggesting energy in motion. Color palette: bright yellows, vivid oranges, deep reds layered in flat overlapping shapes. Organic curves but still graphic and flat. Horizontal rectangular composition on cream background. Dynamic movement, flowing energy.", "stage-stellar.png")
]

for p, f in stages:
    generate_one(p, f)
    time.sleep(2)

print("PROGRESS: ALL_ABSTRACT_COMPLETE")
