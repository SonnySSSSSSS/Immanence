import json
import urllib.request
import urllib.parse
from pathlib import Path
import os
from datetime import datetime

COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_ROOT = Path(r"D:\Unity Apps\immanence-os")
OUTPUT_DIR = PROJECT_ROOT / "public" / "titles" / "light"

def get_image(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(f"{COMFYUI_URL}/view?{url_values}") as response:
        return response.read()

def scan_and_save():
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/history") as response:
            history = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching history: {e}")
        return

    stages = ["EMBER", "FLAME", "BEACON", "STELLAR"]
    
    for prompt_id, data in history.items():
        # Scrape all strings from the entire prompt data to find stage names
        prompt_str = json.dumps(data.get("prompt", "")).upper()

        found_stage = None
        for stage in stages:
            if stage in prompt_str:
                found_stage = stage.lower()
                break
        
        if found_stage:
            outputs = data.get("outputs", {})
            for node_id, node_output in outputs.items():
                if isinstance(node_output, dict) and "images" in node_output:
                    for img_info in node_output["images"]:
                        filename = f"stage-{found_stage}.png"
                        try:
                            img_data = get_image(img_info["filename"], img_info.get("subfolder", ""), img_info.get("type", "output"))
                        except:
                            continue
                        
                        out_path = OUTPUT_DIR / filename
                        out_path.parent.mkdir(parents=True, exist_ok=True)
                        
                        # Save and report
                        with open(out_path, "wb") as f:
                            f.write(img_data)
                        
                        mtime = datetime.fromtimestamp(os.path.getmtime(out_path)).strftime('%H:%M:%S')
                        print(f"SAVED: {filename} (PID: {prompt_id}) | Time: {mtime}")
                        break

if __name__ == "__main__":
    scan_and_save()
