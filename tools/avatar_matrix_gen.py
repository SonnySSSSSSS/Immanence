#!/usr/bin/env python3
"""
Avatar Matrix Batch Generator for Immanence OS

Orchestrates the 5 orthogonal passes defined in the Matrix Exploration Playbook.
Uses tools/comfy_gen.py underneath for individual generations.

Usage:
    python tools/avatar_matrix_gen.py --pass 1 --seeds 5
    python tools/avatar_matrix_gen.py --pass 2 --seeds 10
    python tools/avatar_matrix_gen.py --all --seeds 3
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path
from datetime import datetime

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# Output directory
MATRIX_ROOT = PROJECT_ROOT / "AvatarMatrix"

# Stage definitions
STAGES = [
    {
        "name": "SEEDLING",
        "rings": "6-7 rings",
        "palette": "#818cf8 (Indigo), #6366f1",
        "character": "Faint, soft glow, slow pulse, fragile and nascent"
    },
    {
        "name": "EMBER",
        "rings": "5-6 rings",
        "palette": "#fb923c (Orange), #f97316",
        "character": "Medium glow, faster pulse, awakening"
    },
    {
        "name": "FLAME",
        "rings": "4-5 rings",
        "palette": "#fcd34d (Gold), #f59e0b",
        "character": "Sharper geometry, deliberate pulse, purpose"
    },
    {
        "name": "BEACON",
        "rings": "3-4 rings",
        "palette": "#22d3ee (Cyan), #06b6d4",
        "character": "Multi-color halo, faceted edges, precision"
    },
    {
        "name": "STELLAR",
        "rings": "2-3 rings",
        "palette": "#a78bfa (Violet), #8b5cf6",
        "character": "Fractal spirals, cosmic complexity, transcendence"
    }
]

# Path definitions (Participation Modes)
# All 6 Paths are available at all Stages.
PATHS = {
    "Dhyana": """Precision geometry family.
Perfect radial symmetry, minimal internal turbulence, single-pointed focus.
Rings are perfectly concentric and coherent.""",
    
    "Prana": """Flowing geometry family.
Directional curves, circulatory energy currents, vital and organic flow.
Geometry implies movement and vitality.""",
    
    "Drishti": """Faceted geometry family.
Multi-faceted analytical cuts, complex faceting, orienting quality.
Multiple internal lenses and varied angular faces.""",
    
    "Jnana": """Precision geometry family (base Dhyana).
Sharp light boundaries, extreme clarity, internal crystal contrast.
Focus on transparency and "knowing" illumination.""",
    
    "Soma": """Flowing geometry family (base Prana).
Soft enveloping glow, restorative bloom, diffuse restorative energy.
Reduced edge emphasis, ambient restorative quality.""",
    
    "Samyoga": """Balanced/Integrated family (any base).
Harmonized light behavior, integrated energy, balanced internal radiance.
Integration of all features into a non-biased whole."""
}

# Attention Vector definitions (Energy Behavior)
VECTORS = {
    "Ekagrata": """Stable/Coherent focus.
Steady internal glow, constant intensity, perfectly periodic 1Hz pulse.
Long light coherence, no jitter, centered motion.""",
    
    "Sahaja": """Natural/Flowing breath.
Breathing glow, soft undulations, organic 0.5Hz modulation.
Fluid continuous glow, gentle drift, undulating light paths.""",
    
    "Vigilance": """Scanning/Analytical awareness.
Scintillating angular light, searching internal energy, fragmented pulse.
High-frequency exploratory jitter, angular light shifting."""
}

# Jewel Lock Constraints (Mandatory Negatives)
JEWEL_LOCK_FORBIDDEN = """No mandalas, no sigils, no symbolic diagrams
No flat glyphs, no sacred geometry patterns
No spiritual symbols, no text, no inscriptions
No multiple objects, no fragmentation
No protrusions, no spokes, no radial appendages"""

JEWEL_LOCK_REQUIRED = """Single continuous jewel-like object
Subsurface light refraction
Polished energy crystal
Three-dimensional volumetric form
External silhouette may only change via smooth deformation
Lighting originates entirely from within the object
Internal subsurface illumination only"""

# Object Isolation (Force void background, no scene context)
OBJECT_ISOLATION_BG = """Isolated object
Pure black void or transparent background
No environment
No surface
No horizon"""

OBJECT_ISOLATION_SHADOW = """No cast shadows
No ground shadows
No contact shadows
No ambient occlusion on background
No contact with any surface"""

OBJECT_ISOLATION_FORBIDDEN = """No scene context
No studio backdrop
No atmospheric depth
No external light sources"""


def build_prompt(stage, path, vector):
    """Build a Jewel Lock-compliant prompt with object-isolation constraints."""
    stage_info = next(s for s in STAGES if s["name"] == stage)
    
    prompt = f"""[STAGE]: {stage}
Material: {stage_info['palette']}, {stage_info['rings']} internal rings
Refinement: {stage_info['character']}

[PATH]: {path}
Deformation: {PATHS[path]}

[VECTOR]: {vector}
Light Physics: {VECTORS[vector]}

[OBJECT LOCK]:
{JEWEL_LOCK_REQUIRED}

[BACKGROUND]:
{OBJECT_ISOLATION_BG}

[SHADOWS]:
{OBJECT_ISOLATION_SHADOW}

[FORBIDDEN]:
{JEWEL_LOCK_FORBIDDEN}
{OBJECT_ISOLATION_FORBIDDEN}
Stage-appropriate color palette only: {stage_info['palette']}"""
    
    return prompt


def generate_asset(prompt, output_path, metadata, dry_run=False, wait=True):
    """Generate a single asset using comfy_gen.py."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save metadata
    meta_path = output_path.with_suffix('.json')
    with open(meta_path, 'w') as f:
        json.dump(metadata, indent=2, fp=f)
    
    if dry_run:
        print(f"  [DRY RUN] Would generate: {output_path.name}")
        print(f"  Metadata saved to: {meta_path.name}")
        return True
    
    # Build command
    cmd = [
        sys.executable,
        str(PROJECT_ROOT / "tools" / "comfy_gen.py"),
        prompt,
        "--output", str(output_path.relative_to(PROJECT_ROOT)),
        "--negative", "text, watermark, blurry, photorealistic, harsh edges, spiritual symbols",
        "--steps", "9",
        "--cfg", "1.0",
        "--prefix", output_path.stem
    ]
    
    if not wait:
        cmd.append("--no-download")
    
    print(f"  Queuing: {output_path.name}")
    
    try:
        # Run without capturing output to see it in real-time
        result = subprocess.run(cmd, text=True, cwd=PROJECT_ROOT)
        if result.returncode == 0:
            # print(f"  ✅ Finished: {output_path.name}")
            return True
        else:
            print(f"  ❌ Command failed with return code {result.returncode}")
            return False
    except Exception as e:
        print(f"  ❌ Exception during subprocess: {e}")
        return False


def run_pass_1(seeds=5, dry_run=False, wait=True):
    """
    PASS 1 — Stage Baseline Lock (No Path, No Vector)
    
    Goal: Verify that Stages alone communicate increasing duration/consistency.
    Method: Fix Path=neutral, Vector=neutral, Vary Stage (all 5)
    """
    print("\n" + "="*80)
    print("PASS 1: Stage Baseline Lock")
    print("="*80)
    print("Goal: Verify Stages communicate time + consistency without superiority")
    print(f"Method: Path=Neutral, Vector=Neutral, Vary Stage (5 stages × {seeds} seeds)")
    print()
    
    pass_dir = MATRIX_ROOT / "Pass_1_StageBaseline"
    
    for stage in STAGES:
        stage_name = stage["name"]
        stage_dir = pass_dir / f"Stage_{stage_name}"
        
        print(f"\nGenerating {stage_name} ({seeds} seeds)...")
        
        for seed_idx in range(seeds):
            prompt = build_prompt(stage_name, "Neutral", "Neutral")
            output_path = stage_dir / f"{stage_name.lower()}_neutral_seed{seed_idx:03d}.png"
            
            metadata = {
                "pass": 1,
                "passName": "Stage Baseline Lock",
                "stage": stage_name,
                "path": "Neutral",
                "attentionVector": "Neutral",
                "seed": seed_idx,
                "timestamp": datetime.now().isoformat(),
                "prompt": prompt,
                "axisIntegrity": "PENDING_REVIEW",
                "resonance": None,
                "confusionRisk": None
            }
            
            generate_asset(prompt, output_path, metadata, dry_run, wait)
            
            if not dry_run:
                time.sleep(1)  # Throttle to avoid hammering ComfyUI socket
    
    print(f"\n✅ Pass 1 complete. Results in: {pass_dir}")


def run_pass_2(seeds=10, dry_run=False, wait=True):
    """
    PASS 2 — Path Expression Within a Fixed Stage
    
    Goal: Verify Paths are legible as behavioral shapes, independent of progress.
    Method: Fix Stage=FLAME, Vector=neutral, Vary Path (3 paths)
    """
    print("\n" + "="*80)
    print("PASS 2: Path Expression Within a Fixed Stage")
    print("="*80)
    print("Goal: Verify Paths feel like different ways of showing up, not levels")
    print(f"Method: Stage=FLAME, Vector=Neutral, Vary Path (3 paths × {seeds} seeds)")
    print()
    
    pass_dir = MATRIX_ROOT / "Pass_2_PathIsolation" / "Stage_FLAME"
    fixed_stage = "FLAME"
    
    for path_name in ["Ekagrata", "Sahaja", "Vigilance"]:
        path_dir = pass_dir / f"Path_{path_name}"
        
        print(f"\nGenerating {path_name} ({seeds} seeds)...")
        
        for seed_idx in range(seeds):
            prompt = build_prompt(fixed_stage, path_name, "Neutral")
            output_path = path_dir / f"flame_{path_name.lower()}_seed{seed_idx:03d}.png"
            
            metadata = {
                "pass": 2,
                "passName": "Path Isolation",
                "stage": fixed_stage,
                "path": path_name,
                "attentionVector": "Neutral",
                "seed": seed_idx,
                "timestamp": datetime.now().isoformat(),
                "prompt": prompt,
                "axisIntegrity": "PENDING_REVIEW",
                "resonance": None,
                "confusionRisk": None
            }
            
            generate_asset(prompt, output_path, metadata, dry_run, wait)
            
            if not dry_run and wait:
                time.sleep(2)
    
    print(f"\n✅ Pass 2 complete. Results in: {pass_dir}")


def run_pass_3(seeds=10, dry_run=False, wait=True):
    """
    PASS 3 — Attention Vector Texture Isolation
    
    Goal: Ensure vectors read as energy behavior, not personality.
    Method: Fix Stage=FLAME, Path=Ekagrata, Vary Vector (3 vectors)
    """
    print("\n" + "="*80)
    print("PASS 3: Attention Vector Texture Isolation")
    print("="*80)
    print("Goal: Verify structure remains identical while energy changes")
    print(f"Method: Stage=FLAME, Path=Ekagrata, Vary Vector (3 vectors × {seeds} seeds)")
    print()
    
    pass_dir = MATRIX_ROOT / "Pass_3_VectorIsolation" / "Stage_FLAME" / "Path_Ekagrata"
    fixed_stage = "FLAME"
    fixed_path = "Ekagrata"
    
    for vector_name in ["Neutral", "Jittered", "Diffused"]:
        vector_dir = pass_dir / f"Vector_{vector_name}"
        
        print(f"\nGenerating {vector_name} ({seeds} seeds)...")
        
        for seed_idx in range(seeds):
            prompt = build_prompt(fixed_stage, fixed_path, vector_name)
            output_path = vector_dir / f"flame_ekagrata_{vector_name.lower()}_seed{seed_idx:03d}.png"
            
            metadata = {
                "pass": 3,
                "passName": "Vector Isolation",
                "stage": fixed_stage,
                "path": fixed_path,
                "attentionVector": vector_name,
                "seed": seed_idx,
                "timestamp": datetime.now().isoformat(),
                "prompt": prompt,
                "axisIntegrity": "PENDING_REVIEW",
                "resonance": None,
                "confusionRisk": None
            }
            
            generate_asset(prompt, output_path, metadata, dry_run, wait)
            
            if not dry_run and wait:
                time.sleep(2)
    
    print(f"\n✅ Pass 3 complete. Results in: {pass_dir}")


def run_pass_4(seeds=5, dry_run=False, wait=True):
    """
    PASS 4 — Path × Vector Interaction
    
    Goal: Test whether vectors modulate paths without redefining them.
    Method: Fix Stage=FLAME, Cross all paths × all vectors (9 combinations)
    """
    print("\n" + "="*80)
    print("PASS 4: Path × Vector Interaction")
    print("="*80)
    print("Goal: Verify Path remains identifiable when energy texture changes")
    print(f"Method: Stage=FLAME, Cross 3 paths × 3 vectors (9 combos × {seeds} seeds)")
    print()
    
    pass_dir = MATRIX_ROOT / "Pass_4_PathVectorCross" / "Stage_FLAME"
    fixed_stage = "FLAME"
    
    for path_name in ["Ekagrata", "Sahaja", "Vigilance"]:
        for vector_name in ["Neutral", "Jittered", "Diffused"]:
            combo_dir = pass_dir / f"{path_name}_x_{vector_name}"
            
            print(f"\nGenerating {path_name} × {vector_name} ({seeds} seeds)...")
            
            for seed_idx in range(seeds):
                prompt = build_prompt(fixed_stage, path_name, vector_name)
                output_path = combo_dir / f"flame_{path_name.lower()}_{vector_name.lower()}_seed{seed_idx:03d}.png"
                
                metadata = {
                    "pass": 4,
                    "passName": "Path × Vector Cross",
                    "stage": fixed_stage,
                    "path": path_name,
                    "attentionVector": vector_name,
                    "seed": seed_idx,
                    "timestamp": datetime.now().isoformat(),
                    "prompt": prompt,
                    "axisIntegrity": "PENDING_REVIEW",
                    "resonance": None,
                    "confusionRisk": None
                }
                
                generate_asset(prompt, output_path, metadata, dry_run, wait)
                
                if not dry_run and wait:
                    time.sleep(2)
    
    print(f"\n✅ Pass 4 complete. Results in: {pass_dir}")


def run_pass_5(seeds=5, dry_run=False, wait=True):
    """
    PASS 5 — Vertical Consistency Check
    
    Goal: Ensure Stage progression remains legible across all Paths.
    Method: Fix Path=Sahaja, Vector=Neutral, Vary Stage (all 5)
    """
    print("\n" + "="*80)
    print("PASS 5: Vertical Consistency Check")
    print("="*80)
    print("Goal: Verify stage progression reads as capacity-building across paths")
    print(f"Method: Path=Sahaja, Vector=Neutral, Vary Stage (5 stages × {seeds} seeds)")
    print()
    
    pass_dir = MATRIX_ROOT / "Pass_5_VerticalConsistency" / "Path_Sahaja" / "Vector_Neutral"
    fixed_path = "Sahaja"
    fixed_vector = "Neutral"
    
    for stage in STAGES:
        stage_name = stage["name"]
        stage_dir = pass_dir / f"Stage_{stage_name}"
        
        print(f"\nGenerating {stage_name} ({seeds} seeds)...")
        
        for seed_idx in range(seeds):
            prompt = build_prompt(stage_name, fixed_path, fixed_vector)
            output_path = stage_dir / f"{stage_name.lower()}_sahaja_seed{seed_idx:03d}.png"
            
            metadata = {
                "pass": 5,
                "passName": "Vertical Consistency",
                "stage": stage_name,
                "path": fixed_path,
                "attentionVector": fixed_vector,
                "seed": seed_idx,
                "timestamp": datetime.now().isoformat(),
                "prompt": prompt,
                "axisIntegrity": "PENDING_REVIEW",
                "resonance": None,
                "confusionRisk": None
            }
            
            generate_asset(prompt, output_path, metadata, dry_run, wait)
            
            if not dry_run and wait:
                time.sleep(2)
    
    print(f"\n✅ Pass 5 complete. Results in: {pass_dir}")


def run_sanskrit_matrix(seeds=2, dry_run=False, wait=True):
    """
    Generate the Full 5x6x3 Sanskrit Matrix.
    
    5 Stages x 6 Paths x 3 Vectors x N Seeds.
    """
    print("\n" + "="*80)
    print("SANSKRIT MATRIX GENERATION (5x6x3)")
    print("="*80)
    print(f"Goal: All 6 Paths × All Stages × 3 Vectors ({seeds} seeds)")
    print()
    
    pass_dir = MATRIX_ROOT / "Sanskrit_Matrix"
    
    path_names = list(PATHS.keys())
    vector_names = list(VECTORS.keys())
    
    total_combos = len(STAGES) * len(path_names) * len(vector_names)
    current = 0
    
    for stage_info in STAGES:
        stage_name = stage_info["name"]
        
        for path_name in path_names:
            for vector_name in vector_names:
                current += 1
                combo_dir = pass_dir / stage_name.capitalize() / path_name.capitalize() / vector_name.capitalize()
                
                print(f"\n[{current}/{total_combos}] {stage_name} + {path_name} + {vector_name}...")
                
                for seed_idx in range(seeds):
                    prompt = build_prompt(stage_name, path_name, vector_name)
                    # Filename: {stage}_{vector}_{path}_seed{n}.png
                    filename = f"{stage_name.lower()}_{vector_name.lower()}_{path_name.lower()}_seed{seed_idx:03d}.png"
                    output_path = combo_dir / filename
                    
                    # Skip if exists
                    if output_path.exists():
                        print(f"  ⏭️ Already exists: {filename}")
                        continue
                        
                    metadata = {
                        "model": "Sanskrit 6-Path",
                        "stage": stage_name,
                        "path": path_name,
                        "attentionVector": vector_name,
                        "seed": seed_idx,
                        "timestamp": datetime.now().isoformat(),
                        "prompt": prompt,
                        "validation": "PENDING"
                    }
                    
                    generate_asset(prompt, output_path, metadata, dry_run, wait)
                    
                    if not dry_run and wait:
                        time.sleep(1)
    
    print(f"\n✅ Sanskrit Matrix generation sync complete. Results in: {pass_dir}")


def main():
    parser = argparse.ArgumentParser(
        description="Avatar Matrix Batch Generator - Sanskrit 6-Path Model",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('--full', action='store_true', help='Generate full 5x6x3 Sanskrit matrix')
    parser.add_argument('--seeds', type=int, default=2, help='Number of seeds per combination (default: 2)')
    parser.add_argument('--dry-run', action='store_true', help='Preview structure without generating')
    parser.add_argument('--no-wait', action='store_true', help='Fire-and-forget mode')
    
    args = parser.parse_args()
    
    wait = not args.no_wait
    
    print("="*80)
    print("AVATAR SANSKRIT MATRIX GENERATOR")
    print("="*80)
    print(f"Project Root: {PROJECT_ROOT}")
    print(f"Output Directory: {MATRIX_ROOT / 'Sanskrit_Matrix'}")
    print(f"Seeds per combo: {args.seeds}")
    
    if args.full:
        run_sanskrit_matrix(args.seeds, args.dry_run, wait)
    else:
        # Default to full if no pass specified anymore
        run_sanskrit_matrix(args.seeds, args.dry_run, wait)
    
    print("\n" + "="*80)
    print("PROCESS COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()

