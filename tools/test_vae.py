import json
import urllib.request
import uuid

COMFYUI_URL = "http://127.0.0.1:8188"
CKPT_NAME = "z-image-turbo-fp8-aio.safetensors"
VAE_NAME = "ae.safetensors"

def trigger_test(positive_prompt, prefix):
    # Workflow with separate VAE Loader
    workflow = {
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": CKPT_NAME } },
        "10": { "class_type": "VAELoader", "inputs": { "vae_name": VAE_NAME } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "text": positive_prompt, "clip": ["4", 1] } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "text, watermark, blurry, distorted, low quality, grainy, artifacts, soft focus, out of focus, bokeh", "clip": ["4", 1] } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 1024, "height": 400, "batch_size": 1 } },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": 28,
                "cfg": 7.5,
                "sampler_name": "dpmpp_2m_sde",
                "scheduler": "karras",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["10", 0] } }, # Using node 10
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": prefix, "images": ["8", 0] } }
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode('utf-8'))
            print(f"Queued VAE Test {prefix} (ID: {res['prompt_id']})")
    except Exception as e:
        print(f"Failed to queue {prefix}: {e}")

p = "Professional 2D graphic of the word 'EMBER'. Bold, sharp serif typography. Solid fills of burnt orange and amber. Clean white/cream background. Sharpness focus."
trigger_test(p, "VAE_TEST_EMBER")
