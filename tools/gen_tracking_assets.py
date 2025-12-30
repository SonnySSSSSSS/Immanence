import json
import urllib.request
import urllib.parse
import random
import time
import os
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_ROOT = Path(r"D:\Unity Apps\immanence-os")
CKPT_NAME = "z-image-turbo-fp8-aio.safetensors"

def log(msg):
    print(f"[*] {msg}")

def queue_prompt(positive_prompt, width, height, prefix):
    seed = random.randint(0, 0xffffffffffffffff)
    workflow = {
        "1": {"inputs": {"ckpt_name": CKPT_NAME}, "class_type": "CheckpointLoaderSimple"},
        "2": {"inputs": {"text": positive_prompt, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "3": {"inputs": {"width": width, "height": height, "batch_size": 1}, "class_type": "EmptyLatentImage"},
        "4": {
            "inputs": {
                "seed": seed, "steps": 8, "cfg": 1.0, "sampler_name": "euler", 
                "scheduler": "beta", "denoise": 1.0, "model": ["1", 0], 
                "positive": ["2", 0], "negative": ["2", 0], "latent_image": ["3", 0]
            },
            "class_type": "KSampler"
        },
        "5": {"inputs": {"samples": ["4", 0], "vae": ["1", 2]}, "class_type": "VAEDecode"},
        "6": {"inputs": {"filename_prefix": prefix, "images": ["5", 0]}, "class_type": "SaveImage"}
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    with urllib.request.urlopen(req, timeout=10) as r:
        res = json.loads(r.read())
        return res.get("prompt_id")

def wait_for_prompt(prompt_id, target_path, timeout=300):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}", timeout=5) as r:
                history = json.loads(r.read())
                if prompt_id in history:
                    outputs = history[prompt_id].get("outputs", {})
                    for node_id, node_output in outputs.items():
                        if "images" in node_output:
                            img_info = node_output["images"][0]
                            params = urllib.parse.urlencode({
                                "filename": img_info["filename"], 
                                "subfolder": img_info.get("subfolder", ""), 
                                "type": img_info.get("type", "output")
                            })
                            with urllib.request.urlopen(f"{COMFYUI_URL}/view?{params}", timeout=10) as img_r:
                                data = img_r.read()
                                target_path.parent.mkdir(parents=True, exist_ok=True)
                                with open(target_path, "wb") as f:
                                    f.write(data)
                                return True
        except:
            pass
        time.sleep(2)
    return False

def run_batch():
    tasks = [
        ("flowing energy wave ribbon, teal to gold gradient, plasma energy, cosmic dust, soft glow, transparent background, highly detailed, 1024x256", 1024, 256, "wave_ribbon.png"),
        ("glowing energy orb, bright gold, white hot center, intense aura, transparent background, 256x256", 256, 256, "orb_peak.png"),
        ("glowing energy orb, warm gold, soft aura, transparent background, 256x256", 256, 256, "orb_high.png"),
        ("glowing energy orb, teal and gold mix, transparent background, 256x256", 256, 256, "orb_medium.png"),
        ("glowing energy orb, soft teal, dim aura, transparent background, 256x256", 256, 256, "orb_low.png"),
        ("dim silver orb, gray crystal sphere, faint glow, transparent background, 256x256", 256, 256, "orb_empty.png"),
        ("organic liquid progress bar texture, glowing gold inner plasma, glass capsule, transparent background, 512x64", 512, 64, "progress_texture.png")
    ]
    
    asset_dir = PROJECT_ROOT / "src" / "assets" / "tracking_card"
    asset_dir.mkdir(parents=True, exist_ok=True)
    
    for prompt, w, h, filename in tasks:
        target = asset_dir / filename
        log(f"Generating {filename}...")
        pid = queue_prompt(prompt, w, h, filename.split('.')[0])
        if pid:
            if wait_for_prompt(pid, target):
                log(f"Success: {filename}")
            else:
                log(f"Timeout: {filename}")
        else:
            log(f"Failed to queue: {filename}")

if __name__ == "__main__":
    run_batch()
