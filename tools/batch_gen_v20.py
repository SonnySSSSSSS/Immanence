import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_v20(positive_prompt, negative_prompt, prefix):
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": negative_prompt, "clip": ["4", 1] } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 1024, "batch_size": 1 } }, 
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
    print(f"--- IMMANENCE V20 DRAMATIC MICRO-TEXTURE BATCH ---")
    print(f"Settings: 1024x1024 | 9 Steps | CFG 1.0 | Final Polish Detail")
    print(f"Model: {CKPT_NAME}\n")

    neg = "photorealistic, 3d, realistic mountains, clouds, space photography, blurry, messy lines, low quality"

    for prompt, prefix in tasks:
        try:
            pid = queue_v20(prompt, neg, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("Dramatic ancient star chart of a spiral galaxy. Glowing white and gold stars connected by thin white lines. Intense paper texture with fine grain and weathered edges. Added intricate secondary micro-lines and faint star trails for rich texture. Dramatic celestial lighting with radial star rays emanating from a luminous center. Chiaroscuro depth. Lavender background (#D4C5D8). 1024x1024.", "V20_POLISH_PRACTICE"),
        ("Dramatic ancient sacred geometry of Flower of Life. Glowing gold and white stars at intersections. Heavy paper patina and weathered manuscript texture. Added complex internal micro-geometric lines and nested patterns. Dramatic side-lighting creating depth and subtle star-bloom. High technical detail. Sage blue background (#C5D8D4). 1024x1024.", "V20_POLISH_WISDOM"),
        ("Dramatic ancient star chart of three majestic mountain peaks. Glowing white and gold stars forming ridgelines. Weathered parchment texture with age spots. Added fine topographical micro-lines and secondary celestial guide-paths. Majestic lighting with deep shadows and bright celestial highlights. Ancient mountaineering map aesthetic. Lavender grey background (#D0CFD4). 1024x1024.", "V20_POLISH_APPLICATION"),
        ("Dramatic ancient maritime astrolabe. 8-pointed compass star with glowing gold and white stars at cardinal points. Antique nautical chart texture with ink bleeds and grain. Added intricate nested micro-circles and fine radial coordinate lines. Shimmering golden lighting with a brilliant center glow. Highly intricate navigational instrument. Warm grey background (#D4D0C5). 1024x1024.", "V20_POLISH_NAVIGATION")
    ]
    run_batch(example_tasks)
