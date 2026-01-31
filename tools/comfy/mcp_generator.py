#!/usr/bin/env python3
"""
MCP-based ComfyUI Image Generator
Registry-driven asset generation using MCP proxy - no more one-off scripts!

Usage:
    python mcp_generator.py --asset forest/background
    python mcp_generator.py --asset forest/all
    python mcp_generator.py --asset all --model z-image-base
    python mcp_generator.py --asset city/midground --dry-run
    python mcp_generator.py --asset sakshi_scenes/all --parallel 2
"""

import argparse
import json
import os
import random
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional
from urllib.parse import urljoin

import requests
import yaml


class ComfyMCPGenerator:
    """Registry-driven ComfyUI generator using MCP proxy."""

    def __init__(self, config_dir: Path):
        self.config_dir = config_dir
        self.presets = self._load_yaml(config_dir / "presets.yml")
        self.assets = self._load_yaml(config_dir / "assets.yml")
        self.mcp_endpoint = self.presets["mcp"]["endpoint"]
        self.submit_timeout = self.presets["mcp"]["submit_timeout"]

    def _load_yaml(self, path: Path) -> Dict[str, Any]:
        """Load and parse YAML configuration file."""
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def _build_workflow(
        self,
        preset_name: str,
        positive_prompt: str,
        negative_prompt: str,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Build ComfyUI workflow JSON from preset and prompts."""
        preset = self.presets["presets"][preset_name]
        
        # Use random seed if not specified
        if seed is None:
            seed = random.randint(0, 2**32 - 1)

        # Build workflow with explicit CLIP loader (critical for z-image models)
        workflow = {
            "1": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": preset["checkpoint"]},
            },
            "2": {
                "class_type": "CLIPLoader",
                "inputs": {
                    "clip_name": preset["clip"]["name"],
                    "type": preset["clip"]["type"],
                },
            },
            "3": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": positive_prompt,
                    "clip": ["2", 0],  # Use explicit CLIP loader
                },
            },
            "4": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": negative_prompt,
                    "clip": ["2", 0],
                },
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": preset["latent"]["width"],
                    "height": preset["latent"]["height"],
                    "batch_size": preset["latent"]["batch_size"],
                },
            },
            "6": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": seed,
                    "steps": preset["sampler"]["steps"],
                    "cfg": preset["sampler"]["cfg"],
                    "sampler_name": preset["sampler"]["name"],
                    "scheduler": preset["sampler"]["scheduler"],
                    "denoise": 1.0,
                    "model": ["1", 0],
                    "positive": ["3", 0],
                    "negative": ["4", 0],
                    "latent_image": ["5", 0],
                },
            },
            "7": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["6", 0],
                    "vae": ["1", 2],
                },
            },
            "8": {
                "class_type": "SaveImage",
                "inputs": {
                    "images": ["7", 0],
                    "filename_prefix": "mcp_output",
                },
            },
        }

        return {"prompt": workflow}

    def _submit_job(self, workflow: Dict[str, Any]) -> str:
        """Submit job to MCP proxy and return prompt_id."""
        try:
            response = requests.post(
                self.mcp_endpoint,
                json=workflow,
                timeout=self.submit_timeout,
            )
            response.raise_for_status()
            result = response.json()
            return result["prompt_id"]
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Failed to submit job to MCP proxy: {e}")

    def _poll_job(self, prompt_id: str, timeout: int, interval: int) -> Dict[str, Any]:
        """Poll job status until completion or timeout."""
        backend = self.presets["mcp"]["comfyui_backend"]
        history_url = urljoin(backend, f"/history/{prompt_id}")
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get(history_url, timeout=10)
                response.raise_for_status()
                history = response.json()

                if prompt_id in history:
                    return history[prompt_id]

                time.sleep(interval)
            except requests.exceptions.RequestException as e:
                print(f"Warning: Polling error: {e}", file=sys.stderr)
                time.sleep(interval)

        raise TimeoutError(f"Job {prompt_id} did not complete within {timeout}s")

    def _download_image(self, prompt_id: str, output_path: Path) -> None:
        """Download generated image from ComfyUI backend."""
        backend = self.presets["mcp"]["comfyui_backend"]
        
        # Query history to get output filename
        history_url = urljoin(backend, f"/history/{prompt_id}")
        response = requests.get(history_url, timeout=10)
        response.raise_for_status()
        history = response.json()

        if prompt_id not in history:
            raise RuntimeError(f"No history found for prompt {prompt_id}")

        outputs = history[prompt_id].get("outputs", {})
        if not outputs:
            raise RuntimeError(f"No outputs found for prompt {prompt_id}")

        # Find SaveImage node output
        save_image_output = None
        for node_output in outputs.values():
            if "images" in node_output:
                save_image_output = node_output["images"][0]
                break

        if not save_image_output:
            raise RuntimeError("No image output found in job results")

        # Download image
        filename = save_image_output["filename"]
        subfolder = save_image_output.get("subfolder", "")
        image_url = urljoin(
            backend,
            f"/view?filename={filename}&subfolder={subfolder}&type=output",
        )

        response = requests.get(image_url, timeout=30)
        response.raise_for_status()

        # Write to output path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(response.content)

    def _save_metadata(
        self,
        output_path: Path,
        preset_name: str,
        prompt: str,
        negative_prompt: str,
        seed: int,
        prompt_id: str,
    ) -> None:
        """Save generation metadata alongside image."""
        metadata_path = output_path.with_suffix(".json")
        metadata = {
            "preset": preset_name,
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "seed": seed,
            "prompt_id": prompt_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "output": str(output_path),
        }
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    def generate_asset(
        self,
        asset_spec: Dict[str, Any],
        preset_override: Optional[str] = None,
        dry_run: bool = False,
    ) -> None:
        """Generate single asset from specification."""
        preset_name = preset_override or asset_spec["preset"]
        preset = self.presets["presets"][preset_name]
        
        positive_prompt = asset_spec["prompt"]
        negative_prompt = asset_spec.get(
            "negative_prompt",
            self.presets["default_negative_prompt"],
        )
        seed = asset_spec.get("seed")
        output_path = Path(asset_spec["output_path"])

        print(f"Generating: {output_path}")
        print(f"  Preset: {preset_name}")
        print(f"  Prompt: {positive_prompt[:80]}...")

        if dry_run:
            print("  [DRY RUN] Skipping actual generation")
            return

        # Build workflow
        workflow = self._build_workflow(preset_name, positive_prompt, negative_prompt, seed)
        actual_seed = workflow["prompt"]["6"]["inputs"]["seed"]

        # Submit job
        print(f"  Submitting job...")
        prompt_id = self._submit_job(workflow)
        print(f"  Job ID: {prompt_id}")

        # Poll for completion
        timeout = preset["timeout"]["job"]
        interval = preset["timeout"]["polling_interval"]
        print(f"  Polling (timeout: {timeout}s)...")
        
        try:
            self._poll_job(prompt_id, timeout, interval)
        except TimeoutError as e:
            print(f"  ERROR: {e}", file=sys.stderr)
            return

        # Download image
        print(f"  Downloading...")
        self._download_image(prompt_id, output_path)

        # Save metadata
        self._save_metadata(
            output_path,
            preset_name,
            positive_prompt,
            negative_prompt,
            actual_seed,
            prompt_id,
        )

        print(f"  ✓ Complete: {output_path}")

    def resolve_assets(self, asset_path: str) -> list[tuple[str, Dict[str, Any]]]:
        """Resolve asset path to list of (name, spec) tuples."""
        parts = asset_path.split("/")
        
        if len(parts) == 1:
            # Top-level: generate all groups
            if parts[0] == "all":
                results = []
                for group_name, group_assets in self.assets.items():
                    for scene_name, scene_assets in group_assets.items():
                        for layer_name, layer_spec in scene_assets.items():
                            name = f"{group_name}/{scene_name}/{layer_name}"
                            results.append((name, layer_spec))
                return results
            else:
                raise ValueError(f"Unknown top-level asset: {parts[0]}")

        elif len(parts) == 2:
            # Group/scene or group/all
            group_name, scene_name = parts
            if group_name not in self.assets:
                raise ValueError(f"Unknown asset group: {group_name}")

            if scene_name == "all":
                results = []
                for scene, scene_assets in self.assets[group_name].items():
                    for layer_name, layer_spec in scene_assets.items():
                        name = f"{group_name}/{scene}/{layer_name}"
                        results.append((name, layer_spec))
                return results
            elif scene_name in self.assets[group_name]:
                results = []
                for layer_name, layer_spec in self.assets[group_name][scene_name].items():
                    name = f"{group_name}/{scene_name}/{layer_name}"
                    results.append((name, layer_spec))
                return results
            else:
                raise ValueError(f"Unknown scene: {group_name}/{scene_name}")

        elif len(parts) == 3:
            # Group/scene/layer or group/scene/all
            group_name, scene_name, layer_name = parts
            if group_name not in self.assets:
                raise ValueError(f"Unknown asset group: {group_name}")
            if scene_name not in self.assets[group_name]:
                raise ValueError(f"Unknown scene: {group_name}/{scene_name}")
            
            if layer_name == "all":
                # Generate all layers in this scene
                results = []
                for layer, layer_spec in self.assets[group_name][scene_name].items():
                    name = f"{group_name}/{scene_name}/{layer}"
                    results.append((name, layer_spec))
                return results
            elif layer_name in self.assets[group_name][scene_name]:
                spec = self.assets[group_name][scene_name][layer_name]
                return [(asset_path, spec)]
            else:
                raise ValueError(f"Unknown layer: {group_name}/{scene_name}/{layer_name}")

        else:
            raise ValueError(f"Invalid asset path: {asset_path}")


def main():
    parser = argparse.ArgumentParser(
        description="MCP-based ComfyUI asset generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python mcp_generator.py --asset sakshi_scenes/forest/background
  python mcp_generator.py --asset sakshi_scenes/forest/all
  python mcp_generator.py --asset sakshi_scenes/all --model z-image-base
  python mcp_generator.py --asset all --dry-run
        """,
    )
    parser.add_argument(
        "--asset",
        required=True,
        help="Asset path: group/scene/layer, group/scene/all, group/all, or all",
    )
    parser.add_argument(
        "--model",
        help="Preset override (e.g., z-image-base, z-image-turbo)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be generated without actually running jobs",
    )
    parser.add_argument(
        "--parallel",
        type=int,
        default=1,
        help="Number of parallel jobs (default: 1, sequential)",
    )

    args = parser.parse_args()

    # Find config directory
    script_dir = Path(__file__).parent
    config_dir = script_dir

    # Initialize generator
    generator = ComfyMCPGenerator(config_dir)

    # Resolve assets
    try:
        assets = generator.resolve_assets(args.asset)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    print(f"Resolved {len(assets)} asset(s) to generate")
    print()

    # Generate assets (sequential for now, parallel TODO)
    if args.parallel > 1:
        print(f"Warning: --parallel {args.parallel} not yet implemented, using sequential")

    for name, spec in assets:
        try:
            generator.generate_asset(spec, args.model, args.dry_run)
            print()
        except Exception as e:
            print(f"Error generating {name}: {e}", file=sys.stderr)
            print()
            continue

    print("Generation complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
