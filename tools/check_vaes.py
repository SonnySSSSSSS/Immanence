import urllib.request
import json

COMFYUI_URL = "http://127.0.0.1:8188"

try:
    print(f"Querying ComfyUI for available VAEs at {COMFYUI_URL}...")
    with urllib.request.urlopen(f"{COMFYUI_URL}/object_info/VAELoader") as response:
        data = json.loads(response.read().decode('utf-8'))
        vaes = data['VAELoader']['input']['required']['vae_name'][0]
        print("\nAvailable VAEs:")
        for v in vaes:
            print(f" - {v}")
except Exception as e:
    print(f"Error: {e}")
