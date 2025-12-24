#!/usr/bin/env python3
"""
Get available checkpoints from ComfyUI
"""
import urllib.request
import json

try:
    response = urllib.request.urlopen("http://127.0.0.1:8188/object_info")
    data = json.loads(response.read())
    
    if "CheckpointLoaderSimple" in data:
        checkpoints = data["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0]
        print("Available checkpoints:")
        for ckpt in checkpoints:
            print(f"  - {ckpt}")
    else:
        print("Could not find checkpoint info")
        
except Exception as e:
    print(f"Error: {e}")
