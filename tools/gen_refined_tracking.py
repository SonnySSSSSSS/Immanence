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
                    img_info = history[prompt_id]["outputs"]["6"]["images"][0]
                    params = urllib.parse.urlencode({"filename": img_info["filename"], "subfolder": img_info.get("subfolder", ""), "type": img_info.get("type", "output")})
                    with urllib.request.urlopen(f"{COMFYUI_URL}/view?{params}", timeout=10) as img_r:
                        target_path.parent.mkdir(parents=True, exist_ok=True)
                        with open(target_path, "wb") as f:
                            f.write(img_r.read())
                        return True
        except:
            pass
        time.sleep(2)
    return False

def run_batch():
    # Focused on DARK mode assets first (teal plasma)
    tasks = [
        # The connector ribbon - needs to be "wispy" and "connecting"
        ("wispy plasma energy stream, teal and cyan currents, flowing cosmic dust, ethereal threads, transparent background, highly detailed, 1024x128", 1024, 128, "plasma_stream_dark.png"),
        # The progress bar texture - "liquid glow"
        ("liquid teal plasma flowing in a tube, bioluminescent currents, glowing core, transparent background, 512x64", 512, 64, "progress_flow_dark.png"),
        # The orbs - internal complexity like galaxies/nebulae
        ("glowing energy orb, internal teal nebula, star core, plasma aura, transparent background, 256x256", 256, 256, "orb_peak_dark.png"),
        ("dim teal energy orb, fading plasma, transparent background, 256x256", 256, 256, "orb_low_dark.png"),
        
        # LIGHT mode assets (gold/bronze)
        ("wispy golden energy stream, amber currents, flowing sun dust, ethereal threads, transparent background, highly detailed, 1024x128", 1024, 128, "plasma_stream_light.png"),
        ("liquid gold flowing in a tube, sun-like currents, glowing core, transparent background, 512x64", 512, 64, "progress_flow_light.png"),
        ("glowing energy orb, internal golden sun, amber core, fire aura, transparent background, 256x256", 256, 256, "orb_peak_light.png"),
        ("dim golden energy orb, fading amber, transparent background, 256x256", 256, 256, "orb_low_light.png"),
    ]
    
    asset_dir = PROJECT_ROOT / "public" / "stats" / "tracking_card"
    asset_dir.mkdir(parents=True, exist_ok=True)
    
    for prompt, w, h, filename in tasks:
        target = asset_dir / filename
        print(f"Generating {filename}...")
        pid = queue_prompt(prompt, w, h, "REF_" + filename.split('.')[0])
        if pid:
            if wait_for_prompt(pid, target):
                print(f"Success: {filename}")
        time.sleep(1)

if __name__ == "__main__":
    run_batch()
