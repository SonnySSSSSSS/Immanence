import json
from pathlib import Path

def convert_workflow(ui_workflow):
    """Convert UI workflow to API format"""
    api_workflow = {}
    for node in ui_workflow.get("nodes", []):
        node_id = str(node["id"])
        api_workflow[node_id] = {"class_type": node["type"], "inputs": {}}
        
        if "widgets_values" in node:
            # Try to map widgets_values to actual input names
            # In some versions of ComfyUI, this is not straightforward
            input_names = [inp["name"] for inp in node.get("inputs", [])] # Simplified for test
            # If the node has widgets, they usually come first in widgets_values
            # but let's see what the JSON says
            
            # For CheckpointLoaderSimple, it has 1 input "ckpt_name"
            if node["type"] == "CheckpointLoaderSimple":
                api_workflow[node_id]["inputs"]["ckpt_name"] = node["widgets_values"][0]
            elif node["type"] == "CLIPTextEncode":
                api_workflow[node_id]["inputs"]["text"] = node["widgets_values"][0]
            elif node["type"] == "EmptyLatentImage":
                api_workflow[node_id]["inputs"]["width"] = node["widgets_values"][0]
                api_workflow[node_id]["inputs"]["height"] = node["widgets_values"][1]
                api_workflow[node_id]["inputs"]["batch_size"] = node["widgets_values"][2]
            elif node["type"] == "KSampler":
                api_workflow[node_id]["inputs"]["seed"] = node["widgets_values"][0]
                api_workflow[node_id]["inputs"]["steps"] = node["widgets_values"][2]
                api_workflow[node_id]["inputs"]["cfg"] = node["widgets_values"][3]
                api_workflow[node_id]["inputs"]["sampler_name"] = node["widgets_values"][4]
                api_workflow[node_id]["inputs"]["scheduler"] = node["widgets_values"][5]
                api_workflow[node_id]["inputs"]["denoise"] = node["widgets_values"][6]
            elif node["type"] == "SaveImage":
                api_workflow[node_id]["inputs"]["filename_prefix"] = node["widgets_values"][0]
        
        for inp in node.get("inputs", []):
            if inp.get("link") is not None:
                for link in ui_workflow.get("links", []):
                    if link[0] == inp["link"]:
                        api_workflow[node_id]["inputs"][inp["name"]] = [str(link[1]), link[2]]
    return api_workflow

ui_workflow = json.load(open("comfyui_workflow.json"))
api_workflow = convert_workflow(ui_workflow)
print(json.dumps(api_workflow, indent=2))
