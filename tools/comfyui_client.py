#!/usr/bin/env python3
"""
ComfyUI API Client for IMMANENCE
Usage: python comfyui_client.py --prompt "mystical avatar" --output avatars/test.png
"""

import json
import urllib.request
import urllib.error
import time
import argparse
from pathlib import Path
import uuid

COMFYUI_URL = "http://127.0.0.1:8188"

def check_comfyui_running():
    """Check if ComfyUI server is running"""
    try:
        urllib.request.urlopen(f"{COMFYUI_URL}/system_stats", timeout=2)
        return True
    except:
        return False

def queue_prompt(workflow):
    """Submit a workflow to ComfyUI"""
    prompt_id = str(uuid.uuid4())
    data = json.dumps({"prompt": workflow, "client_id": prompt_id}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    try:
        response = urllib.request.urlopen(req)
        return json.loads(response.read())
    except urllib.error.URLError as e:
        print(f"Error queuing prompt: {e}")
        return None

def get_history(prompt_id):
    """Get the generation history for a prompt"""
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as response:
            return json.loads(response.read())
    except:
        return {}

def get_image(filename, subfolder, folder_type):
    """Download generated image from ComfyUI"""
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    
    with urllib.request.urlopen(f"{COMFYUI_URL}/view?{url_values}") as response:
        return response.read()

def wait_for_completion(prompt_id, timeout=300):
    """Wait for a prompt to complete and return image data"""
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        history = get_history(prompt_id)
        
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            for node_id, node_output in outputs.items():
                if "images" in node_output:
                    images = node_output["images"]
                    if images:
                        img_info = images[0]
                        return get_image(
                            img_info["filename"],
                            img_info.get("subfolder", ""),
                            img_info.get("type", "output")
                        )
        
        time.sleep(1)
    
    raise TimeoutError(f"Generation timed out after {timeout} seconds")

def convert_ui_to_api_workflow(ui_workflow):
    """Convert UI workflow format to API format"""
    api_workflow = {}
    
    for node in ui_workflow.get("nodes", []):
        node_id = str(node["id"])
        api_workflow[node_id] = {
            "class_type": node["type"],
            "inputs": {}
        }
        
        # Add widget values as inputs
        if "widgets_values" in node:
            # Get list of inputs that have widget configurations
            # NOTE: This conversion is heuristic. UI format has more values than API format expects.
            input_names = [inp["name"] for inp in node.get("inputs", []) if "widget" in inp]
            
            # Filter out known UI-only sidecar values from widgets_values
            # e.g., "randomize", "fixed", "increment" following a seed
            filtered_values = []
            for i, val in enumerate(node["widgets_values"]):
                # Simple heuristic: if the current value is a known UI sidecar string 
                # following a numeric value, it's likely a control, not a functional input.
                if i > 0 and isinstance(val, str) and val in ["randomize", "fixed", "increment", "decrement"]:
                    continue
                filtered_values.append(val)
                
            for i, value in enumerate(filtered_values):
                if i < len(input_names):
                    api_workflow[node_id]["inputs"][input_names[i]] = value
        
        # Add linked inputs
        for inp in node.get("inputs", []):
            if inp.get("link") is not None:
                link_id = inp["link"]
                for link in ui_workflow.get("links", []):
                    if link[0] == link_id:
                        source_node_id = str(link[1])
                        source_output_index = link[2]
                        api_workflow[node_id]["inputs"][inp["name"]] = [source_node_id, source_output_index]
    
    return api_workflow

def generate_image(positive_prompt, negative_prompt=None, workflow_file=None, output_path=None):
    """Main function to generate an image using ComfyUI"""
    
    if not check_comfyui_running():
        print("❌ ComfyUI is not running!")
        print(f"Please start ComfyUI first (usually at {COMFYUI_URL})")
        return False
    
    print("✅ ComfyUI is running")
    
    if workflow_file is None:
        workflow_file = "comfyui_workflow.json"
    
    print(f"📄 Loading workflow from {workflow_file}")
    
    with open(workflow_file, 'r', encoding='utf-8') as f:
        ui_workflow = json.load(f)
    
    api_workflow = convert_ui_to_api_workflow(ui_workflow)
    
    print(f"🎨 Positive prompt: {positive_prompt}")
    if negative_prompt:
        print(f"🚫 Negative prompt: {negative_prompt}")
    
    # Update text encode nodes
    positive_set = False
    negative_set = False
    for node_id, node in api_workflow.items():
        if node["class_type"] == "CLIPTextEncode":
            if not positive_set:
                node["inputs"]["text"] = positive_prompt
                positive_set = True
            elif negative_prompt and not negative_set:
                node["inputs"]["text"] = negative_prompt
                negative_set = True
    
    print("📤 Submitting to ComfyUI...")
    result = queue_prompt(api_workflow)
    
    if not result:
        print("❌ Failed to queue prompt")
        return False
    
    prompt_id = result.get("prompt_id")
    print(f"⏳ Generating image (ID: {prompt_id})...")
    
    try:
        image_data = wait_for_completion(prompt_id)
        print("✅ Generation complete!")
        
        if output_path is None:
            output_path = f"generated_{prompt_id}.png"
        
        with open(output_path, 'wb') as f:
            f.write(image_data)
        
        print(f"💾 Saved to: {output_path}")
        return True
        
    except TimeoutError as e:
        print(f"❌ {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate images using ComfyUI")
    parser.add_argument("--prompt", "-p", required=True, help="Positive prompt")
    parser.add_argument("--negative", "-n", help="Negative prompt")
    parser.add_argument("--workflow", "-w", help="Path to workflow JSON file")
    parser.add_argument("--output", "-o", help="Output path")
    
    args = parser.parse_args()
    
    success = generate_image(
        positive_prompt=args.prompt,
        negative_prompt=args.negative,
        workflow_file=args.workflow,
        output_path=args.output
    )
    
    exit(0 if success else 1)
