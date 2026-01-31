#!/usr/bin/env python3
"""
ComfyUI API Client for IMMANENCE
Usage: python comfyui_client.py --prompt "mystical avatar" --output avatars/test.png
"""

import json
import urllib.request
import urllib.error
import urllib.parse
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

def load_workflow(workflow_file="comfyui_workflow.json"):
    """Load workflow JSON and convert from UI format to API format if needed"""
    if not Path(workflow_file).exists():
        print(f"Workflow file not found: {workflow_file}")
        return None
    with open(workflow_file) as f:
        ui_wf = json.load(f)
    
    # If it's UI format (has "nodes" array), convert to API format (dict with node IDs as keys)
    if isinstance(ui_wf.get("nodes"), list):
        api_wf = {}
        for node in ui_wf["nodes"]:
            node_id = str(node["id"])
            
            # Build inputs dict from node's inputs by looking up links
            inputs = {}
            for input_item in node.get("inputs", []):
                input_name = input_item.get("name")
                if input_item.get("link") is not None:
                    link_id = input_item["link"]
                    # Find which link this is and get source node
                    for link in ui_wf.get("links", []):
                        if link[0] == link_id:
                            # link format: [id, from_node, from_slot, to_node, to_slot, type]
                            from_node, from_slot = link[1], link[2]
                            inputs[input_name] = [from_node, from_slot]
                            break
            
            api_node = {
                "class_type": node.get("type"),
                "inputs": inputs,
                "widgets_values": node.get("widgets_values", [])
            }
            api_wf[node_id] = api_node
        return api_wf
    
    return ui_wf

def queue_prompt(workflow):
    """Submit a workflow to ComfyUI"""
    prompt_id = str(uuid.uuid4())
    data = json.dumps({"prompt": workflow, "client_id": prompt_id}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    try:
        response = urllib.request.urlopen(req)
        result = json.loads(response.read())
        return result.get("prompt_id", prompt_id)
    except urllib.error.URLError as e:
        print(f"❌ Error queuing prompt: {e}")
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

def apply_overrides(workflow, overrides):
    """Apply parameter overrides to workflow nodes"""
    if not overrides:
        return workflow
    
    # Update node 5 (EmptyLatentImage) for width/height/batch_size
    if "width" in overrides or "height" in overrides or "batch_size" in overrides:
        if "5" in workflow:
            w = overrides.get("width", workflow["5"]["widgets_values"][0])
            h = overrides.get("height", workflow["5"]["widgets_values"][1])
            b = overrides.get("batch_size", workflow["5"]["widgets_values"][2])
            workflow["5"]["widgets_values"] = [w, h, b]
    
    # Update node 3 (KSampler) for seed, steps, cfg, sampler, scheduler, denoise
    if any(k in overrides for k in ["seed", "steps", "cfg", "sampler", "scheduler", "denoise"]):
        if "3" in workflow:
            seed = overrides.get("seed", workflow["3"]["widgets_values"][0])
            steps = overrides.get("steps", workflow["3"]["widgets_values"][2])
            cfg = overrides.get("cfg", workflow["3"]["widgets_values"][3])
            sampler = overrides.get("sampler", workflow["3"]["widgets_values"][4])
            scheduler = overrides.get("scheduler", workflow["3"]["widgets_values"][5])
            denoise = overrides.get("denoise", workflow["3"]["widgets_values"][6])
            workflow["3"]["widgets_values"] = [seed, "fixed", steps, cfg, sampler, scheduler, denoise]
    
    return workflow

def generate_image(positive_prompt, negative_prompt=None, workflow_file=None, output_path=None, overrides=None):
    """Main generation function"""
    
    if not check_comfyui_running():
        print("ComfyUI is not running on 127.0.0.1:8188")
        return False
    
    print("ComfyUI is running")
    
    if not workflow_file:
        workflow_file = "comfyui_workflow.json"
    
    print(f"Loading workflow from {workflow_file}")
    workflow = load_workflow(workflow_file)
    if not workflow:
        return False
    
    # Update prompts in workflow (nodes 6=positive, 7=negative)
    if "6" in workflow:
        workflow["6"]["widgets_values"] = [positive_prompt]
        print(f"Positive prompt: {positive_prompt[:80]}...")
    
    if "7" in workflow:
        neg = negative_prompt or "text, watermark"
        workflow["7"]["widgets_values"] = [neg]
        print(f"Negative prompt: {neg[:80]}...")
    
    if "9" in workflow and output_path:
        filename = Path(output_path).stem
        workflow["9"]["widgets_values"] = [filename]
    
    # Apply parameter overrides
    workflow = apply_overrides(workflow, overrides)
    
    print("Submitting to ComfyUI...")
    prompt_id = queue_prompt(workflow)
    if not prompt_id:
        return False
    
    print(f"Generating image (ID: {prompt_id})...")
    
    try:
        image_data = wait_for_completion(prompt_id)
        print("Generation complete!")
        
        if output_path:
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(image_data)
            print(f"Saved to: {output_path}")
        
        return True
    except TimeoutError as e:
        print(f"{e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--prompt", required=True, help="Positive prompt")
    parser.add_argument("--negative", help="Negative prompt")
    parser.add_argument("--output", required=True, help="Output file path")
    parser.add_argument("--workflow", default="comfyui_workflow.json", help="Workflow JSON file")
    parser.add_argument("--seed", type=int, help="Seed value")
    parser.add_argument("--steps", type=int, help="Number of steps")
    parser.add_argument("--cfg", type=float, help="CFG scale")
    parser.add_argument("--sampler", help="Sampler name")
    parser.add_argument("--scheduler", help="Scheduler name")
    parser.add_argument("--denoise", type=float, help="Denoise value")
    parser.add_argument("--width", type=int, help="Image width")
    parser.add_argument("--height", type=int, help="Image height")
    
    args = parser.parse_args()
    
    overrides = {}
    if args.seed is not None:
        overrides["seed"] = args.seed
    if args.steps is not None:
        overrides["steps"] = args.steps
    if args.cfg is not None:
        overrides["cfg"] = args.cfg
    if args.sampler:
        overrides["sampler"] = args.sampler
    if args.scheduler:
        overrides["scheduler"] = args.scheduler
    if args.denoise is not None:
        overrides["denoise"] = args.denoise
    if args.width is not None:
        overrides["width"] = args.width
    if args.height is not None:
        overrides["height"] = args.height
    
    success = generate_image(
        args.prompt,
        args.negative,
        args.workflow,
        args.output,
        overrides if overrides else None
    )
    
    exit(0 if success else 1)
