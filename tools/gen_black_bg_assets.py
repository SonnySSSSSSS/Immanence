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

def queue_prompt(positive_prompt, width, height, prefix):
    # Use seed 42 for consistency if needed, or random
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
        return json.loads(r.read()).get("prompt_id")

def wait_for_prompt(prompt_id, target_path, timeout=300):
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}", timeout=5) as r:
                history = json.loads(r.read())
                if prompt_id in history:
                    node_outputs = history[prompt_id].get("outputs", {})
                    # Find SaveImage node
                    for node_id in node_outputs:
                        if "images" in node_outputs[node_id]:
                            img_info = node_outputs[node_id]["images"][0]
                            params = urllib.parse.urlencode({
                                "filename": img_info["filename"], 
                                "subfolder": img_info.get("subfolder", ""), 
                                "type": img_info.get("type", "output")
                            })
                            with urllib.request.urlopen(f"{COMFYUI_URL}/view?{params}", timeout=10) as img_r:
                                target_path.parent.mkdir(parents=True, exist_ok=True)
                                with open(target_path, "wb") as f:
                                    f.write(img_r.read())
                                return True
        except Exception as e:
            pass
        time.sleep(2)
    return False

def run_batch():
    # FOCUS: SOLID BLACK BACKGROUNDS for SCREEN BLENDING
    # This is the industry standard for glowing magic orbs in UI without alpha issues.
    tasks = [
        # DARK MODE (Teal Plasma)
        ("ethereal plasma energy stream, teal flow, cyan currents, glowing cosmic dust, threads of energy, PURE SOLID BLACK BACKGROUND, highly detailed, 1024x128", 1024, 128, "stream_teal_black.png"),
        ("intense plasma orb, teal nebula core, glowing cyan atmosphere, energy sparks, PURE SOLID BLACK BACKGROUND, 256x256", 256, 256, "orb_peak_teal_black.png"),
        ("dim plasma orb, faint teal glow, dying energy, PURE SOLID BLACK BACKGROUND, 256x256", 256, 256, "orb_low_teal_black.png"),
        
        # LIGHT MODE (Golden Fire)
        ("ethereal golden energy stream, amber flow, sun currents, glowing dust, threads of gold, PURE SOLID BLACK BACKGROUND, highly detailed, 1024x128", 1024, 128, "stream_gold_black.png"),
        ("intense sun orb, golden hot core, solar flares, amber atmosphere, fire sparks, PURE SOLID BLACK BACKGROUND, 256x256", 256, 256, "orb_peak_gold_black.png"),
        ("dim amber orb, faint golden glow, cooling sun, PURE SOLID BLACK BACKGROUND, 256x256", 256, 256, "orb_low_gold_black.png"),
        
        # SHARED
        ("orb of frozen energy, silver core, ice crystals, PURE SOLID BLACK BACKGROUND, 256x256", 256, 256, "orb_empty_black.png"),
        ("liquid glowing gold plasma texture, flowing in glass tube, PURE SOLID BLACK BACKGROUND, 512x64", 512, 64, "progress_glow_black.png")
    ]
    
    asset_dir = PROJECT_ROOT / "public" / "stats" / "tracking_card"
    asset_dir.mkdir(parents=True, exist_ok=True)
    
    for prompt, w, h, filename in tasks:
        target = asset_dir / filename
        print(f"Generating {filename}...")
        pid = queue_prompt(prompt, w, h, "BLK_" + filename.split('.')[0])
        if pid:
            if wait_for_prompt(pid, target):
                print(f"Success: {filename}")
            else:
                print(f"Timeout: {filename}")
        time.sleep(1)

if __name__ == "__main__":
    run_batch()
