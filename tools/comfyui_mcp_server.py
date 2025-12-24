#!/usr/bin/env python3
"""
ComfyUI MCP Server for IMMANENCE
Provides tools for AI assistants to generate images via ComfyUI
"""

import json
import sys
import urllib.request
import urllib.error
import time
import uuid
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_ROOT = Path(r"D:\Unity Apps\immanence-os")

def check_comfyui():
    """Check if ComfyUI is running"""
    try:
        urllib.request.urlopen(f"{COMFYUI_URL}/system_stats", timeout=2)
        return True, "ComfyUI is running"
    except:
        return False, "ComfyUI is not running. Please start ComfyUI first."

def queue_prompt(workflow):
    """Submit workflow to ComfyUI"""
    prompt_id = str(uuid.uuid4())
    data = json.dumps({"prompt": workflow, "client_id": prompt_id}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    try:
        response = urllib.request.urlopen(req)
        return json.loads(response.read())
    except Exception as e:
        return {"error": str(e)}

def get_history(prompt_id):
    """Get generation history"""
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as response:
            return json.loads(response.read())
    except:
        return {}

def get_image(filename, subfolder, folder_type):
    """Download image from ComfyUI"""
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(f"{COMFYUI_URL}/view?{url_values}") as response:
        return response.read()

def wait_for_completion(prompt_id, timeout=300):
    """Wait for generation to complete"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        history = get_history(prompt_id)
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            for node_id, node_output in outputs.items():
                if "images" in node_output and node_output["images"]:
                    img_info = node_output["images"][0]
                    return get_image(
                        img_info["filename"],
                        img_info.get("subfolder", ""),
                        img_info.get("type", "output")
                    )
        time.sleep(1)
    raise TimeoutError("Generation timed out")

def convert_workflow(ui_workflow):
    """Convert UI workflow to API format"""
    api_workflow = {}
    for node in ui_workflow.get("nodes", []):
        node_id = str(node["id"])
        api_workflow[node_id] = {"class_type": node["type"], "inputs": {}}
        
        if "widgets_values" in node:
            input_names = [inp["name"] for inp in node.get("inputs", []) if "widget" in inp]
            for i, value in enumerate(node["widgets_values"]):
                if i < len(input_names):
                    api_workflow[node_id]["inputs"][input_names[i]] = value
        
        for inp in node.get("inputs", []):
            if inp.get("link") is not None:
                for link in ui_workflow.get("links", []):
                    if link[0] == inp["link"]:
                        api_workflow[node_id]["inputs"][inp["name"]] = [str(link[1]), link[2]]
    return api_workflow

def generate_asset(positive_prompt, negative_prompt=None, output_path=None):
    """Generate an image asset using ComfyUI"""
    
    # Check ComfyUI
    running, msg = check_comfyui()
    if not running:
        return {"success": False, "error": msg}
    
    # Load workflow
    workflow_file = PROJECT_ROOT / "comfyui_workflow.json"
    if not workflow_file.exists():
        return {"success": False, "error": f"Workflow file not found: {workflow_file}"}
    
    with open(workflow_file, 'r', encoding='utf-8') as f:
        ui_workflow = json.load(f)
    
    api_workflow = convert_workflow(ui_workflow)
    
    # Update prompts
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
    
    # Submit
    result = queue_prompt(api_workflow)
    if "error" in result:
        return {"success": False, "error": result["error"]}
    
    prompt_id = result.get("prompt_id")
    
    # Wait for completion
    try:
        image_data = wait_for_completion(prompt_id)
        
        # Save
        if output_path:
            output_file = PROJECT_ROOT / output_path
        else:
            output_file = PROJECT_ROOT / "public" / "generated" / f"{prompt_id}.png"
        
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'wb') as f:
            f.write(image_data)
        
        relative_path = str(output_file.relative_to(PROJECT_ROOT))
        return {
            "success": True,
            "output_path": relative_path,
            "full_path": str(output_file),
            "prompt_id": prompt_id
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def handle(msg):
    """Handle MCP protocol messages"""
    method = msg.get("method")
    mid = msg.get("id")
    
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": mid,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "comfyui-generator", "version": "1.0.0"}
            }
        }
    
    if method == "notifications/initialized":
        return None
    
    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": mid,
            "result": {
                "tools": [
                    {
                        "name": "generate_comfyui_asset",
                        "description": "Generate an image asset using ComfyUI. Requires ComfyUI to be running at http://127.0.0.1:8188",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "positive_prompt": {
                                    "type": "string",
                                    "description": "The positive prompt describing what to generate"
                                },
                                "negative_prompt": {
                                    "type": "string",
                                    "description": "Optional negative prompt for what to avoid"
                                },
                                "output_path": {
                                    "type": "string",
                                    "description": "Output path relative to project root (e.g., 'public/avatars/test.png'). If not specified, saves to public/generated/"
                                }
                            },
                            "required": ["positive_prompt"]
                        }
                    },
                    {
                        "name": "check_comfyui_status",
                        "description": "Check if ComfyUI server is running and accessible",
                        "inputSchema": {
                            "type": "object",
                            "properties": {}
                        }
                    }
                ]
            }
        }
    
    if method == "tools/call":
        params = msg.get("params", {})
        name = params.get("name")
        args = params.get("arguments", {})
        
        if name == "check_comfyui_status":
            running, status = check_comfyui()
            result = json.dumps({"running": running, "status": status}, indent=2)
        
        elif name == "generate_comfyui_asset":
            result_dict = generate_asset(
                positive_prompt=args["positive_prompt"],
                negative_prompt=args.get("negative_prompt"),
                output_path=args.get("output_path")
            )
            result = json.dumps(result_dict, indent=2)
        
        else:
            result = json.dumps({"error": "Unknown tool"})
        
        return {
            "jsonrpc": "2.0",
            "id": mid,
            "result": {
                "content": [{"type": "text", "text": result}]
            }
        }
    
    if mid is not None:
        return {"jsonrpc": "2.0", "id": mid, "result": {}}
    return None

def main():
    """Main MCP server loop"""
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break
            
            response = handle(json.loads(line))
            if response:
                print(json.dumps(response), flush=True)
        except:
            pass

if __name__ == "__main__":
    main()
