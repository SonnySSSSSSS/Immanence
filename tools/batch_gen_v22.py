import json
import urllib.request
import uuid
import time

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-bf16-aio.safetensors"

def queue_v22(positive_prompt, negative_prompt, prefix):
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
    print(f"--- IMMANENCE V22 CLOUD BACKGROUND BATCH ---")
    print(f"Settings: 1024x1024 | 9 Steps | CFG 1.0 | Ethereal Cloud Aesthetics")
    print(f"Model: {CKPT_NAME}\n")

    neg = "photorealistic, harsh edges, sharp details, high contrast, dark colors, blue tones, cold colors, gritty texture, noise"

    for prompt, prefix in tasks:
        try:
            pid = queue_v22(prompt, neg, prefix)
            print(f"Queued {prefix}")
            time.sleep(1.0)
        except Exception as e:
            print(f"Failed {prefix}: {e}")

if __name__ == "__main__":
    example_tasks = [
        ("Soft swirling clouds in cream and pale gold tones. Very subtle, ethereal wisps. Gentle gradients from warm cream (#F5F1E8) to pale golden beige. Minimal contrast, peaceful atmosphere. Delicate flowing patterns. Perfect for UI background. Painterly soft-focus aesthetic. 1024x1024.", "V22_CLOUD_SUBTLE"),
        ("Swirling luminous clouds in cream and golden tones. Soft billowing forms with subtle highlights. Warm gradients from cream (#F5F1E8) through pale gold to soft amber. Gentle radial flow pattern. Ethereal and dimensional but still clean. Painterly atmospheric quality. 1024x1024.", "V22_CLOUD_MEDIUM"),
        ("Rich swirling clouds in cream and golden tones with dramatic highlights. Billowing forms spiraling outward. Warm gradients from cream (#F5F1E8) through gold to amber. Luminous quality with depth. Ethereal mystical atmosphere. Painterly cinematic aesthetic. 1024x1024.", "V22_CLOUD_DRAMATIC"),
        ("Swirling cloud vortex spiraling outward from bright center. Cream and golden tones with luminous highlights. Dramatic spiral flow from center point. Warm gradients creating depth. Mystical ethereal quality. Painterly dynamic motion. 1024x1024.", "V22_CLOUD_VORTEX")
    ]
    run_batch(example_tasks)
