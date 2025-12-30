#!/usr/bin/env python3
"""
ComfyUI MCP Server - STABLE SYNC VERSION
Pure synchronous implementation to avoid Windows asyncio/stdin issues.
Uses HTTP polling for completion (no websockets).
"""

import json
import sys
import urllib.request
import urllib.error
import urllib.parse
import random
import time
import os
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_ROOT = Path(r"D:\Unity Apps\immanence-os")

def log(msg):
    """Log to stderr for debugging"""
    try:
        print(f"[*] {msg}", file=sys.stderr, flush=True)
    except:
        pass

def check_comfyui():
    """Check if ComfyUI is running"""
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/system_stats", timeout=2) as r:
            status = r.status == 200
            return status, "ComfyUI is running" if status else "ComfyUI returned non-200"
    except Exception as e:
        return False, f"ComfyUI check failed: {str(e)}"

def queue_prompt(positive_prompt, width, height):
    """Queue a generation task"""
    seed = random.randint(0, 0xffffffffffffffff)
    workflow = {
        "1": {"inputs": {"ckpt_name": "z-image-turbo-fp8-aio.safetensors"}, "class_type": "CheckpointLoaderSimple"},
        "2": {"inputs": {"text": positive_prompt, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "3": {"inputs": {"width": width, "height": height, "batch_size": 1}, "class_type": "EmptyLatentImage"},
        "4": {
            "inputs": {
                "seed": seed, "steps": 8, "cfg": 1.0, "sampler_name": "euler", 
                "scheduler": "beta", "denoise": 1.0, "model": ["1", 0], 
                "positive": ["2", 0], "negative": ["2", 0], "latent_image": ["3", 0]
            },
            "class_type": "KSampler"
        },
        "5": {"inputs": {"samples": ["4", 0], "vae": ["1", 2]}, "class_type": "VAEDecode"},
        "6": {"inputs": {"filename_prefix": "MCP_GEN", "images": ["5", 0]}, "class_type": "SaveImage"}
    }
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    with urllib.request.urlopen(req, timeout=10) as r:
        res = json.loads(r.read())
        return res.get("prompt_id")

def wait_for_prompt(prompt_id, timeout=300):
    """Poll history until task completion"""
    start_time = time.time()
    log(f"Starting poll for {prompt_id}")
    
    while time.time() - start_time < timeout:
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}", timeout=5) as r:
                history = json.loads(r.read())
                if prompt_id in history:
                    outputs = history[prompt_id].get("outputs", {})
                    for node_id, node_output in outputs.items():
                        if "images" in node_output:
                            img_info = node_output["images"][0]
                            filename = img_info["filename"]
                            subfolder = img_info.get("subfolder", "")
                            folder_type = img_info.get("type", "output")
                            
                            # Download image
                            params = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": folder_type})
                            with urllib.request.urlopen(f"{COMFYUI_URL}/view?{params}", timeout=10) as img_r:
                                return img_r.read()
        except Exception as e:
            log(f"Poll error (retrying): {e}")
        
        time.sleep(1.0)
    
    raise TimeoutError(f"Task {prompt_id} timed out after {timeout}s")

def handle_generate(args):
    """Main generation logic"""
    prompt = args.get("positive_prompt")
    output_path = args.get("output_path")
    width = args.get("width", 1024)
    height = args.get("height", 1024)
    
    if not prompt:
        return {"success": False, "error": "No positive_prompt provided"}
        
    try:
        log(f"Queuing: {prompt[:50]}...")
        prompt_id = queue_prompt(prompt, width, height)
        if not prompt_id:
            return {"success": False, "error": "Failed to queue prompt"}
            
        image_data = wait_for_prompt(prompt_id)
        
        # Determine output location
        if output_path:
            full_path = PROJECT_ROOT / output_path
        else:
            full_path = PROJECT_ROOT / "public" / "generated" / f"{prompt_id}.png"
            
        full_path.parent.mkdir(parents=True, exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(image_data)
            
        rel_path = str(full_path.relative_to(PROJECT_ROOT)).replace("\\", "/")
        return {
            "success": True,
            "output_path": rel_path,
            "prompt_id": prompt_id,
            "message": f"Successfully generated {width}x{height} image to {rel_path}"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def handle_mcp(msg):
    """Handle JSON-RPC message"""
    method = msg.get("method")
    mid = msg.get("id")
    params = msg.get("params", {})
    
    if method == "initialize":
        return {"jsonrpc": "2.0", "id": mid, "result": {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "comfyui-zimage-sync", "version": "7.0.0"}
        }}
    
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": mid, "result": {"tools": [
            {
                "name": "generate_comfyui_asset",
                "description": "Generate image via ComfyUI (Sync Polling)",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "positive_prompt": {"type": "string"},
                        "output_path": {"type": "string"},
                        "width": {"type": "integer", "default": 1024},
                        "height": {"type": "integer", "default": 1024}
                    },
                    "required": ["positive_prompt"]
                }
            },
            {
                "name": "check_comfyui_status",
                "description": "Check if ComfyUI is up",
                "inputSchema": {"type": "object"}
            }
        ]}}
    
    if method == "tools/call":
        tool_name = params.get("name")
        args = params.get("arguments", {})
        
        if tool_name == "check_comfyui_status":
            ok, status = check_comfyui()
            res = {"running": ok, "status": status}
        elif tool_name == "generate_comfyui_asset":
            res = handle_generate(args)
        else:
            res = {"error": f"Tool '{tool_name}' not found"}
            
        return {"jsonrpc": "2.0", "id": mid, "result": {
            "content": [{"type": "text", "text": json.dumps(res, indent=2)}]
        }}
    
    return {"jsonrpc": "2.0", "id": mid, "result": {}} if mid is not None else None

def main():
    """Main input loop"""
    log("Stable Sync Server started")
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            msg = json.loads(line)
            response = handle_mcp(msg)
            if response:
                print(json.dumps(response), flush=True)
        except Exception as e:
            log(f"Loop error: {e}")

if __name__ == "__main__":
    main()

