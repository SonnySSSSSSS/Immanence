import urllib.request
import json

COMFYUI_URL = "http://127.0.0.1:8188"

try:
    print(f"Querying ComfyUI for available Upscalers at {COMFYUI_URL}...")
    with urllib.request.urlopen(f"{COMFYUI_URL}/object_info/UpscaleModelLoader") as response:
        data = json.loads(response.read().decode('utf-8'))
        upscalers = data['UpscaleModelLoader']['input']['required']['model_name'][0]
        print("\nAvailable Upscale Models:")
        for u in upscalers:
            print(f" - {u}")
except Exception as e:
    print(f"Error: {e}")
