#!/usr/bin/env python3
"""
ComfyUI MCP Server - Z-IMAGE TURBO VERSION
Uses separate loaders for diffusion model, CLIP, and VAE
"""

import json
import sys
import urllib.request
import urllib.error
import urllib.parse
import random
import asyncio
import websockets
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
COMFYUI_WS = "ws://127.0.0.1:8188/ws"
PROJECT_ROOT = Path(r"D:\Unity Apps\immanence-os")

def check_comfyui():
    """Check if ComfyUI is running"""
    try:
        urllib.request.urlopen(f"{COMFYUI_URL}/system_stats", timeout=2)
        return True, "ComfyUI is running"
    except:
        return False, "ComfyUI is not running at http://127.0.0.1:8188"

def queue_prompt_simple(workflow):
    """Submit workflow to ComfyUI"""
    prompt_data = {"prompt": workflow}
    data = json.dumps(prompt_data).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    try:
        response = urllib.request.urlopen(req, timeout=10)
        result = json.loads(response.read())
        return result
    except Exception as e:
        return {"error": str(e)}

def get_image_sync(filename, subfolder, folder_type):
    """Download image from ComfyUI"""
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen(f"{COMFYUI_URL}/view?{url_values}") as response:
        return response.read()

async def wait_for_completion_ws(prompt_id, timeout=300):
    """Wait for completion using WebSocket"""
    try:
        async with websockets.connect(COMFYUI_WS) as websocket:
            start_time = asyncio.get_event_loop().time()
            
            while asyncio.get_event_loop().time() - start_time < timeout:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(message)
                    
                    if data.get("type") == "executed":
                        output = data.get("data", {}).get("output", {})
                        
                        if "images" in output and output["images"]:
                            img_info = output["images"][0]
                            return get_image_sync(
                                img_info["filename"],
                                img_info.get("subfolder", ""),
                                img_info.get("type", "output")
                            )
                    
                    if data.get("type") == "execution_error":
                        error_msg = data.get('data', {}).get('exception_message', 'Unknown error')
                        raise RuntimeError(f"ComfyUI error: {error_msg}")
                        
                except asyncio.TimeoutError:
                    continue
                    
            raise TimeoutError(f"Timed out after {timeout}s")
            
    except Exception as e:
        raise RuntimeError(f"WebSocket error: {str(e)}")

def create_zimage_workflow(positive_prompt):
    """Create Z-Image Turbo workflow with separate loaders"""
    
    seed = random.randint(0, 0xffffffffffffffff)
    
    workflow = {
        "1": {
            "inputs": {
                "unet_name": "z_image_turbo_bf16.safetensors",
                "weight_dtype": "default"
            },
            "class_type": "UNETLoader"
        },
        "2": {
            "inputs": {
                "clip_name1": "qwen_3_4b.safetensors",
                "type": "lumina_next2"
            },
            "class_type": "CLIPLoader"
        },
        "3": {
            "inputs": {
                "vae_name": "ae.safetensors"
            },
            "class_type": "VAELoader"
        },
        "4": {
            "inputs": {
                "text": positive_prompt,
                "clip": ["2", 0]
            },
            "class_type": "CLIPTextEncode"
        },
        "5": {
            "inputs": {
                "width": 1024,
                "height": 1024,
                "batch_size": 1
            },
            "class_type": "EmptyLatentImage"
        },
        "6": {
            "inputs": {
                "seed": seed,
                "steps": 8,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "beta",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["4", 0],
                "negative": ["4", 0],
                "latent_image": ["5", 0]
            },
            "class_type": "KSampler"
        },
        "7": {
            "inputs": {
                "samples": ["6", 0],
                "vae": ["3", 0]
            },
            "class_type": "VAEDecode"
        },
        "8": {
            "inputs": {
                "filename_prefix": "ZImage",
                "images": ["7", 0]
            },
            "class_type": "SaveImage"
        }
    }
    
    return workflow

def generate_asset_sync(positive_prompt, negative_prompt=None, output_path=None):
    """Generate image using Z-Image Turbo"""
    
    running, msg = check_comfyui()
    if not running:
        return {"success": False, "error": msg}
    
    try:
        workflow = create_zimage_workflow(positive_prompt)
    except Exception as e:
        return {"success": False, "error": f"Workflow creation failed: {str(e)}"}
    
    result = queue_prompt_simple(workflow)
    
    if "error" in result:
        return {"success": False, "error": f"Queue failed: {result['error']}"}
    
    if "prompt_id" not in result:
        return {"success": False, "error": f"No prompt_id: {result}"}
    
    prompt_id = result["prompt_id"]
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        image_data = loop.run_until_complete(wait_for_completion_ws(prompt_id, timeout=300))
        loop.close()
        
        if output_path:
            output_file = PROJECT_ROOT / output_path
        else:
            output_file = PROJECT_ROOT / "public" / "generated" / f"{prompt_id}.png"
        
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'wb') as f:
            f.write(image_data)
        
        relative_path = str(output_file.relative_to(PROJECT_ROOT)).replace('\\', '/')
        
        return {
            "success": True,
            "output_path": relative_path,
            "full_path": str(output_file),
            "prompt_id": prompt_id,
            "message": f"Generated with Z-Image Turbo, saved to {relative_path}"
        }
        
    except Exception as e:
        return {"success": False, "error": f"Generation failed: {str(e)}"}

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
                "serverInfo": {"name": "comfyui-zimage", "version": "4.0.0"}
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
                        "description": "Generate image using Z-Image Turbo. Fast 8-step generation. Optimized for your setup.",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "positive_prompt": {
                                    "type": "string",
                                    "description": "What to generate"
                                },
                                "output_path": {
                                    "type": "string",
                                    "description": "Output path relative to project"
                                }
                            },
                            "required": ["positive_prompt"]
                        }
                    },
                    {
                        "name": "check_comfyui_status",
                        "description": "Check if ComfyUI is running",
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
            result = json.dumps({
                "running": running,
                "status": status,
                "model": "Z-Image Turbo (separate loaders)"
            }, indent=2)
        
        elif name == "generate_comfyui_asset":
            result_dict = generate_asset_sync(
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