#!/usr/bin/env python3
"""
ComfyUI img2img Generator for Photic UI Wallpapers
Uses low denoise to refine base plates without hallucinating geometry.
"""

import json
import urllib.request
import urllib.parse
import argparse
import time
import uuid
import sys
import shutil
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_ROOT = Path(__file__).parent.parent

def check_comfyui():
    """Check if ComfyUI is running."""
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/system_stats", timeout=2) as response:
            return True
    except Exception:
        return False

def copy_to_comfyui_input(base_plate_path):
    """Copy base plate to ComfyUI's input folder with unique timestamped filename."""
    # Try common ComfyUI paths
    possible_paths = [
        Path("D:/AI/ComfyUI/input"),
        Path("C:/ComfyUI/input"),
        Path.home() / "ComfyUI" / "input",
    ]
    
    # Generate unique filename with timestamp
    timestamp = int(time.time() * 1000)  # milliseconds for uniqueness
    unique_filename = f"{base_plate_path.stem}_{timestamp}{base_plate_path.suffix}"
    
    for comfy_input in possible_paths:
        if comfy_input.exists():
            dest = comfy_input / unique_filename
            shutil.copy2(base_plate_path, dest)
            
            # Verify copy
            if dest.exists() and dest.stat().st_size > 0:
                print(f"📋 Copied base plate to: {dest}")
                print(f"   File size: {dest.stat().st_size} bytes")
                return unique_filename
            else:
                print(f"⚠️  Copy verification failed for {dest}")
    
    print("⚠️  Could not find ComfyUI input folder, using direct filename reference")
    return base_plate_path.name

def queue_prompt(base_plate_path, base_plate_filename, positive_prompt, negative_prompt, denoise, cfg, sampler, scheduler, ckpt, steps, verify=False):
    """Queue an img2img generation request."""
    
    workflow = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": ckpt}
        },
        "5": {
            "class_type": "LoadImage",
            "inputs": {"image": base_plate_filename}
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": positive_prompt, "clip": ["4", 1]}
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative_prompt, "clip": ["4", 1]}
        },
        "8": {
            "class_type": "VAEEncode",
            "inputs": {"pixels": ["5", 0], "vae": ["4", 2]}
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": steps,
                "cfg": cfg,
                "sampler_name": sampler,
                "scheduler": scheduler,
                "denoise": denoise,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["8", 0]
            }
        },
        "9": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]}
        },
        "10": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "photic_img2img", "images": ["9", 0]}
        }
    }
    
    if verify:
        print("\n📋 WORKFLOW BEING SENT:")
        print(json.dumps(workflow, indent=2))
    
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            prompt_id = result.get('prompt_id')
            
            if verify:
                print(f"\n✅ POST /prompt response: {json.dumps(result, indent=2)}")
            
            return prompt_id
    except Exception as e:
        print(f"❌ Error queuing prompt: {e}", file=sys.stderr)
        return None

def poll_and_download(prompt_id, output_path, timeout=300, verify=False):
    """Poll ComfyUI for completion and download the result."""
    print(f"⏳ Polling for completion (ID: {prompt_id})...")
    start_time = time.time()
    last_status = None
    
    while time.time() - start_time < timeout:
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/queue", timeout=5) as response:
                queue_data = json.loads(response.read())
                
                if any(item[1] == prompt_id for item in queue_data.get('queue_running', [])):
                    if last_status != "running":
                        print("🔥 Generation in progress...")
                        last_status = "running"
                elif any(item[1] == prompt_id for item in queue_data.get('queue_pending', [])):
                    if last_status != "pending":
                        print("⏸️  In queue, waiting...")
                        last_status = "pending"
        except Exception as e:
            pass
        
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}", timeout=5) as response:
                history = json.loads(response.read())
                
                if prompt_id in history:
                    hist_entry = history[prompt_id]
                    
                    if verify:
                        print("\n🔍 GROUND TRUTH - What ComfyUI Actually Executed:")
                        print("=" * 80)
                        
                        # Show prompt that was executed (index 2 of the prompt array)
                        prompt_array = hist_entry.get('prompt', [])
                        prompt_data = prompt_array[2] if len(prompt_array) > 2 else {}
                        
                        # Check LoadImage
                        if '5' in prompt_data:
                            load_img_node = prompt_data['5']
                            print(f"\n📸 LoadImage (Node 5):")
                            print(f"   Filename: {load_img_node.get('inputs', {}).get('image', 'N/A')}")
                        
                        # Check Checkpoint
                        if '4' in prompt_data:
                            ckpt_node = prompt_data['4']
                            print(f"\n🎯 Checkpoint (Node 4):")
                            print(f"   Model: {ckpt_node.get('inputs', {}).get('ckpt_name', 'N/A')}")
                        
                        # Check positive prompt
                        if '6' in prompt_data:
                            pos_node = prompt_data['6']
                            pos_text = pos_node.get('inputs', {}).get('text', '')
                            print(f"\n✅ Positive CLIP (Node 6):")
                            print(f"   Text: {pos_text[:200]}{'...' if len(pos_text) > 200 else ''}")
                        
                        # Check negative prompt
                        if '7' in prompt_data:
                            neg_node = prompt_data['7']
                            neg_text = neg_node.get('inputs', {}).get('text', '')
                            print(f"\n🚫 Negative CLIP (Node 7):")
                            print(f"   Text: {neg_text[:200]}{'...' if len(neg_text) > 200 else ''}")
                        
                        # Check KSampler
                        if '3' in prompt_data:
                            ksampler_node = prompt_data['3']
                            ksampler_inputs = ksampler_node.get('inputs', {})
                            print(f"\n⚙️  KSampler (Node 3):")
                            print(f"   Steps: {ksampler_inputs.get('steps', 'N/A')}")
                            print(f"   CFG: {ksampler_inputs.get('cfg', 'N/A')}")
                            print(f"   Sampler: {ksampler_inputs.get('sampler_name', 'N/A')}")
                            print(f"   Scheduler: {ksampler_inputs.get('scheduler', 'N/A')}")
                            print(f"   Denoise: {ksampler_inputs.get('denoise', 'N/A')}")
                            print(f"   Seed: {ksampler_inputs.get('seed', 'N/A')}")
                        
                        print("\n" + "=" * 80)
                    
                    outputs = hist_entry.get('outputs', {})
                    if outputs and '10' in outputs:
                        images = outputs['10'].get('images', [])
                        if images:
                            img_info = images[0]
                            filename = urllib.parse.quote(img_info['filename'])
                            subfolder = urllib.parse.quote(img_info.get('subfolder', ''))
                            img_type = urllib.parse.quote(img_info.get('type', 'output'))
                            
                            img_url = f"{COMFYUI_URL}/view?filename={filename}&subfolder={subfolder}&type={img_type}"
                            
                            print(f"📥 Downloading result...")
                            with urllib.request.urlopen(img_url, timeout=30) as img_response:
                                output_path.parent.mkdir(parents=True, exist_ok=True)
                                with open(output_path, 'wb') as f:
                                    f.write(img_response.read())
                            
                            print(f"✅ Success! Saved to: {output_path}")
                            return True
                    
                    status = hist_entry.get('status', {})
                    if status.get('completed') and not outputs:
                        print(f"❌ Generation completed but produced no output", file=sys.stderr)
                        return False
        except Exception:
            pass
        
        time.sleep(2)
    
    print(f"⏰ Timeout after {timeout}s", file=sys.stderr)
    return False

def main():
    parser = argparse.ArgumentParser(
        description="img2img Wallpaper Generator for Immanence OS (Photic UI)"
    )
    
    parser.add_argument('base_plate', help='Path to base plate image (relative to project root)')
    parser.add_argument('--output', '-o', type=Path, required=True, help='Output file path')
    parser.add_argument('--positive', '-p', required=True, help='Positive prompt')
    parser.add_argument('--negative', '-n', help='Negative prompt')
    parser.add_argument('--denoise', '-d', type=float, default=0.60, help='Denoise strength (0.55-0.65, default 0.60)')
    parser.add_argument('--cfg', '-c', type=float, default=7.0, help='CFG scale (6.5-7.5, default 7.0)')
    parser.add_argument('--sampler', default='dpmpp_2m_sde', help='Sampler (default: dpmpp_2m_sde)')
    parser.add_argument('--scheduler', default='karras', help='Scheduler (default: karras)')
    parser.add_argument('--ckpt', default='z-image-turbo-bf16-aio.safetensors', help='Checkpoint name')
    parser.add_argument('--steps', '-s', type=int, default=32, help='Steps (28-36, default 32)')
    parser.add_argument('--timeout', '-t', type=int, default=300, help='Timeout in seconds')
    parser.add_argument('--verify', '-v', action='store_true', help='Print diagnostic info about what ComfyUI actually executed')
    parser.add_argument('--probe', action='store_true', help='Add probe mutations (odd dimensions, low steps) to verify workflow control')
    
    args = parser.parse_args()
    
    # Check ComfyUI
    print("🔍 Checking ComfyUI status...")
    if not check_comfyui():
        print("❌ ComfyUI is not running at http://127.0.0.1:8188", file=sys.stderr)
        sys.exit(1)
    
    print("✅ ComfyUI is running")
    
    # Resolve paths
    base_plate_path = PROJECT_ROOT / args.base_plate
    output_path = PROJECT_ROOT / args.output
    
    if not base_plate_path.exists():
        print(f"❌ Base plate not found: {base_plate_path}", file=sys.stderr)
        sys.exit(1)
    
    # Copy to ComfyUI input folder
    print(f"\n📋 Preparing base plate...")
    base_plate_filename = copy_to_comfyui_input(base_plate_path)
    
    # Apply probe mutations if requested
    if args.probe:
        print("\n🔬 PROBE MODE: Applying mutations to verify workflow control")
        args.steps = 3
        args.cfg = 1.0
        args.denoise = 0.95
        args.positive = "PROBE_TEXT_SHOULD_NOT_BE_IGNORED " + args.positive
        print(f"   Modified steps: {args.steps}")
        print(f"   Modified CFG: {args.cfg}")
        print(f"   Modified denoise: {args.denoise}")
        print(f"   Added probe text to positive prompt")
    
    print(f"📤 Queuing img2img generation...")
    print(f"   Base plate: {base_plate_filename}")
    print(f"   Steps: {args.steps} | Denoise: {args.denoise} | CFG: {args.cfg}")
    
    prompt_id = queue_prompt(
        base_plate_path=base_plate_path,
        base_plate_filename=base_plate_filename,
        positive_prompt=args.positive,
        negative_prompt=args.negative or "",
        denoise=args.denoise,
        cfg=args.cfg,
        sampler=args.sampler,
        scheduler=args.scheduler,
        ckpt=args.ckpt,
        steps=args.steps,
        verify=args.verify
    )
    
    if not prompt_id:
        print("❌ Failed to queue prompt", file=sys.stderr)
        sys.exit(1)
    
    print(f"✅ Queued with ID: {prompt_id}\n")
    success = poll_and_download(prompt_id, output_path, args.timeout, verify=args.verify)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
