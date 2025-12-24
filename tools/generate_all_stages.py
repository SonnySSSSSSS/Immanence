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
      "7": {
        "class_type": "CLIPTextEncode",
        "inputs": { "text": negative_prompt, "clip": ["4", 1] }
      },
      "6": {
        "class_type": "CLIPTextEncode",
        "inputs": { "text": positive_prompt, "clip": ["4", 1] }
      },
      "5": {
        "class_type": "EmptyLatentImage",
        "inputs": { "width": 1024, "height": 512, "batch_size": 1 }
      },
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
      "8": {
        "class_type": "VAEDecode",
        "inputs": { "samples": ["3", 0], "vae": ["4", 2] }
      },
      "9": {
        "class_type": "SaveImage",
        "inputs": { "filename_prefix": "ComfyUI", "images": ["8", 0] }
      },
      "4": {
        "class_type": "CheckpointLoaderSimple",
        "inputs": { "ckpt_name": "z_image_turbo_bf16.safetensors" }
      }
    }

def queue_prompt(workflow):
    prompt_id = str(uuid.uuid4())
    data = json.dumps({"prompt": workflow, "client_id": prompt_id}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read())["prompt_id"]

def get_history(prompt_id):
    with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as response:
        return json.loads(response.read())

def get_image(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(f"{COMFYUI_URL}/view?{url_values}") as response:
        return response.read()

def generate_and_save(positive_prompt, output_filename):
    print(f"Generating {output_filename}...")
    workflow = get_api_workflow(positive_prompt)
    prompt_id = queue_prompt(workflow)
    
    # Wait for completion
    while True:
        history = get_history(prompt_id)
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            for node_id, node_output in outputs.items():
                if "images" in node_output and node_output["images"]:
                    img_info = node_output["images"][0]
                    img_data = get_image(img_info["filename"], img_info.get("subfolder", ""), img_info.get("type", "output"))
                    
                    output_path = PROJECT_ROOT / "public" / "titles" / "light" / output_filename
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(output_path, 'wb') as f:
                        f.write(img_data)
                    print(f"Saved to {output_path}")
                    return
        time.sleep(2)

stages = [
    ("A flat 2D graphic of the word \"EMBER\". The letters are filled with a mosaic pattern of sharp, triangular shards in varying shades of amber, bright orange, and deep charcoal. The arrangement creates a sense of \"glowing heat\" through flat color blocking rather than gradients. Thin black outline on the letters. Centered on a cream background.", "stage-ember.png"),
    ("A high-resolution, flat 2D graphic of the word \"FLAME\" for a mobile app title card. The typography is a clean, modern sans-serif font. The interior of the letters is filled with a dense, repeating grid pattern of stylized alchemical symbols for fire (upward-pointing triangles with a crossbar) in shades of deep orange and gold. The letters have a thin, bronze outline. Centered on a light cream background. Minimalist, clean aesthetic.", "stage-flame.png"),
    ("A high-resolution, flat 2D graphic of the word \"BEACON\" for a mobile app title card. The typography is a clean, modern sans-serif font. The interior of the letters is filled with a pattern of interconnected stars (small dots and thin lines) forming an arrow-like guide shape against a deep blue background, suggesting a celestial navigation signal. The letters have a thin, silver outline. Centered on a light cream background. Minimalist, clean aesthetic.", "stage-beacon.png"),
    ("A high-resolution, flat 2D vector graphic of the word \"STELLAR\" for a mobile app title card. The typography is an elegant, high-contrast stylish serif font with sophisticated curves and delicate terminals, directly inspired by the \"KESLIE\" typeface. The interior of the letters is filled with a rich, regal pattern of deep royal purple and cosmic indigo. Overlaid on the purple fill is a delicate network of thin gold constellation lines and tiny, pinprick white stars. The letters feature a crisp, thin gold outline to emphasize a regal, \"earned\" aesthetic. The entire graphic is centered on a light cream background, maintaining a minimalist, \"future-ancient\" look. No 3D effects, shadows, or gradients; entirely flat and sophisticated.", "stage-stellar.png")
]

for prompt, filename in stages:
    generate_and_save(prompt, filename)
