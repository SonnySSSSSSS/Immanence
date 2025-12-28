#!/usr/bin/env python3
"""
Universal ComfyUI Asset Generator for Immanence OS

This script provides a unified CLI for generating assets using ComfyUI.
It replaces the many one-off batch_gen_*.py scripts.

Usage:
    python tools/comfy_gen.py "mystical golden lotus on cream background" --output public/lotus.png
    python tools/comfy_gen.py "swirling clouds" --width 512 --height 512 --steps 4
    python tools/comfy_gen.py "sacred geometry" --negative "text, watermark" --prefix "sacred_geo"
"""

import json
import urllib.request
import urllib.parse
import argparse
import time
import uuid
import sys
from pathlib import Path

# Configuration
COMFYUI_URL = "http://127.0.0.1:8188"
PROJECT_ROOT = Path(__file__).parent.parent  # d:\Unity Apps\immanence-os
DEFAULT_CKPT = "z-image-turbo-fp8-aio.safetensors"
DEFAULT_NEGATIVE = "text, letters, watermark, blurry, low quality, photorealistic, harsh edges"


def check_comfyui():
    """Check if ComfyUI is running."""
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/system_stats", timeout=2) as response:
            return True
    except Exception:
        return False


def queue_prompt(positive_prompt, negative_prompt, width, height, steps, cfg, sampler, scheduler, ckpt, prefix):
    """Queue a generation request to ComfyUI."""
    workflow = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": ckpt}
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": positive_prompt, "clip": ["4", 1]}
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative_prompt, "clip": ["4", 1]}
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1}
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": int(uuid.uuid4().int % (2**32)),
                "steps": steps,
                "cfg": cfg,
                "sampler_name": sampler,
                "scheduler": scheduler,
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]}
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": prefix, "images": ["8", 0]}
        }
    }

    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('prompt_id')
    except Exception as e:
        print(f"❌ Error queuing prompt: {e}", file=sys.stderr)
        return None


def poll_and_download(prompt_id, output_path, timeout=300):
    """Poll ComfyUI for completion and download the result."""
    print(f"⏳ Polling for completion (ID: {prompt_id})...")
    start_time = time.time()
    last_status = None
    
    while time.time() - start_time < timeout:
        # Check queue status
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/queue", timeout=5) as response:
                queue_data = json.loads(response.read())
                
                # Check if running
                if any(item[1] == prompt_id for item in queue_data.get('queue_running', [])):
                    if last_status != "running":
                        print("🔥 Generation in progress...")
                        last_status = "running"
                # Check if pending
                elif any(item[1] == prompt_id for item in queue_data.get('queue_pending', [])):
                    if last_status != "pending":
                        print("⏸️  In queue, waiting...")
                        last_status = "pending"
        except Exception as e:
            print(f"⚠️  Queue check failed: {e}", file=sys.stderr)
        
        # Check history for completion
        try:
            with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}", timeout=5) as response:
                history = json.loads(response.read())
                
                if prompt_id in history:
                    outputs = history[prompt_id].get('outputs', {})
                    if outputs and '9' in outputs:
                        # Success! Download the image
                        images = outputs['9'].get('images', [])
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
                    
                    # Check for errors
                    status = history[prompt_id].get('status', {})
                    if status.get('completed') and not outputs:
                        print(f"❌ Generation completed but produced no output", file=sys.stderr)
                        print(f"   Status: {json.dumps(status)}", file=sys.stderr)
                        return False
        except Exception as e:
            # History endpoint may not exist yet, continue polling
            pass
        
        time.sleep(2)
    
    print(f"⏰ Timeout after {timeout}s", file=sys.stderr)
    return False


def main():
    parser = argparse.ArgumentParser(
        description="Universal ComfyUI Asset Generator for Immanence OS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python tools/comfy_gen.py "mystical golden lotus on cream background" --output public/lotus.png
  python tools/comfy_gen.py "swirling clouds" --width 512 --height 512 --steps 4
  python tools/comfy_gen.py "sacred geometry" --negative "text, watermark" --prefix "sacred"
        """
    )
    
    parser.add_argument('prompt', help='Positive prompt describing what to generate')
    parser.add_argument('--output', '-o', type=Path, help='Output file path (relative to project root)')
    parser.add_argument('--negative', '-n', default=DEFAULT_NEGATIVE, help='Negative prompt')
    parser.add_argument('--width', '-w', type=int, default=1024, help='Image width (default: 1024)')
    parser.add_argument('--height', '-H', type=int, default=1024, help='Image height (default: 1024)')
    parser.add_argument('--steps', '-s', type=int, default=9, help='Generation steps (default: 9)')
    parser.add_argument('--cfg', '-c', type=float, default=1.0, help='CFG scale (default: 1.0)')
    parser.add_argument('--sampler', default='euler_ancestral', help='Sampler name (default: euler_ancestral)')
    parser.add_argument('--scheduler', default='simple', help='Scheduler (default: simple)')
    parser.add_argument('--ckpt', default=DEFAULT_CKPT, help=f'Checkpoint name (default: {DEFAULT_CKPT})')
    parser.add_argument('--prefix', '-p', default='ComfyUI', help='Filename prefix for ComfyUI output')
    parser.add_argument('--timeout', '-t', type=int, default=300, help='Timeout in seconds (default: 300)')
    parser.add_argument('--no-download', action='store_true', help='Queue only, do not wait for completion')
    
    args = parser.parse_args()
    
    # Check ComfyUI status
    print("🔍 Checking ComfyUI status...")
    if not check_comfyui():
        print("❌ ComfyUI is not running at http://127.0.0.1:8188", file=sys.stderr)
        print("   Please start ComfyUI and try again.", file=sys.stderr)
        sys.exit(1)
    
    print("✅ ComfyUI is running")
    
    # Determine output path
    if args.output:
        output_path = PROJECT_ROOT / args.output
    else:
        # Generate a default filename in public/generated/
        timestamp = int(time.time())
        output_path = PROJECT_ROOT / "public" / "generated" / f"{args.prefix}_{timestamp}.png"
    
    # Queue the prompt
    print("\n📤 Queuing generation...")
    print(f"   Prompt: {args.prompt}")
    print(f"   Size: {args.width}x{args.height}")
    print(f"   Steps: {args.steps} | CFG: {args.cfg}")
    print(f"   Output: {output_path.relative_to(PROJECT_ROOT)}")
    
    prompt_id = queue_prompt(
        positive_prompt=args.prompt,
        negative_prompt=args.negative,
        width=args.width,
        height=args.height,
        steps=args.steps,
        cfg=args.cfg,
        sampler=args.sampler,
        scheduler=args.scheduler,
        ckpt=args.ckpt,
        prefix=args.prefix
    )
    
    if not prompt_id:
        print("❌ Failed to queue prompt", file=sys.stderr)
        sys.exit(1)
    
    print(f"✅ Queued with ID: {prompt_id}")
    
    # Download result (unless --no-download)
    if args.no_download:
        print("\n🚀 Fire-and-forget mode enabled. Exiting without waiting.")
        print(f"   Check ComfyUI output folder for result with prefix: {args.prefix}")
        sys.exit(0)
    
    print()
    success = poll_and_download(prompt_id, output_path, args.timeout)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
