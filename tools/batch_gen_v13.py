import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_designer(positive_prompt, prefix, width=1024, height=384):
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "", "clip": ["4", 1] } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": width, "height": height, "batch_size": 1 } }, 
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": 9,
                "cfg": 1.0,
                "sampler_name": "euler_ancestral",
                "scheduler": "simple",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": prefix, "images": ["8", 0] } }
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req, timeout=10) as response:
        res = json.loads(response.read().decode('utf-8'))
        return res['prompt_id']

def run_batch(tasks):
    print(f"--- IMMANENCE V13 DESIGNER BATCH ---")
    print(f"Settings: 1024x384 | 9 Steps | CFG 1.0 | Euler Ancestral")
    print(f"Model: {CKPT_NAME}\n")

    for prompt, prefix in tasks:
        try:
            pid = queue_designer(prompt, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("The word 'EMBER' in elegant, sharp serif typography with subtle gold leaf accents on the edges. Solid white background. Clean 2D graphic. Minimalist premium branding.", "V13_DESIGNER_EMBER_LIGHT"),
        ("The word 'BEACON' in clean, modern celestial serif font. Sapphire blue ink on a cream paper texture. Perfectly sharp edges. Zen minimalist aesthetic.", "V13_DESIGNER_BEACON_LIGHT"),
        ("The word 'STELLAR' in ancient, razor-sharp serif typography. The letters are made of glowing crystalline purple nebula gas. Deep black void background. Ultra high fidelity.", "V13_DESIGNER_STELLAR_DARK"),
        ("The word 'FLAME' in aggressive, hand-painted neon pink brush strokes. Intense magenta and hot-red glow. Smoldering embers. Dark cinematic background. High contrast. Sharp brush stroke edges. Road Rage style.", "V13_DESIGNER_FLAME_DARK")
    ]
    run_batch(example_tasks)
