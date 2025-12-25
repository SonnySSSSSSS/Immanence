import urllib.request
import json

COMFYUI_URL = "http://127.0.0.1:8188"

try:
    print(f"Querying ComfyUI for available models at {COMFYUI_URL}...")
    with urllib.request.urlopen(f"{COMFYUI_URL}/object_info/CheckpointLoaderSimple") as response:
        data = json.loads(response.read().decode('utf-8'))
        models = data['CheckpointLoaderSimple']['input']['required']['ckpt_name'][0]
        print("\nAvailable Checkpoints:")
        for m in models:
            print(f" - {m}")
except Exception as e:
    print(f"Error: {e}")
