#!/usr/bin/env python3
"""
Jewel Lock Path Deformation Test Generator

Generates test variations for each Path (Ekagrata, Sahaja, Vigilance)
across all 5 Stages to validate deformation-only approach.

Usage:
    python tools/jewel_path_test.py --path Ekagrata --seeds 2
    python tools/jewel_path_test.py --all --seeds 2
"""

import sys
from pathlib import Path

# Add parent directory to path to import avatar_matrix_gen
sys.path.insert(0, str(Path(__file__).parent))

from avatar_matrix_gen import STAGES, build_prompt, generate_asset, PROJECT_ROOT
from datetime import datetime

OUTPUT_ROOT = PROJECT_ROOT / "AvatarMatrix" / "JewelLock_PathTests"

def generate_path_variations(path_name, seeds=2, dry_run=False):
    """Generate variations for a specific path across all stages."""
    print(f"\n{'='*80}")
    print(f"PATH DEFORMATION TEST: {path_name}")
    print(f"{'='*80}")
    print(f"Goal: Verify {path_name} deformation is applied to jewel, not new form")
    print(f"Method: Fix Vector=Neutral, Vary Stage (5 stages × {seeds} seeds)")
    print()
    
    path_dir = OUTPUT_ROOT / f"Path_{path_name}"
    
    for stage in STAGES:
        stage_name = stage["name"]
        stage_dir = path_dir / f"Stage_{stage_name}"
        
        print(f"\nGenerating {stage_name} + {path_name} ({seeds} seeds)...")
        
        for seed_idx in range(seeds):
            prompt = build_prompt(stage_name, path_name, "Neutral")
            output_path = stage_dir / f"{stage_name.lower()}_{path_name.lower()}_seed{seed_idx:03d}.png"
            
            metadata = {
                "test": "Path Deformation",
                "path": path_name,
                "stage": stage_name,
                "vector": "Neutral",
                "seed": seed_idx,
                "timestamp": datetime.now().isoformat(),
                "prompt": prompt,
                "validation": {
                    "jewelAuthority": "PENDING",
                    "sameTopology": "PENDING",
                    "smoothSilhouette": "PENDING",
                    "pathIdentifiable": "PENDING"
                }
            }
            
            generate_asset(prompt, output_path, metadata, dry_run, wait=True)
            
            if not dry_run:
                import time
                time.sleep(1)
    
    print(f"\n✅ {path_name} test complete. Results in: {path_dir}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Jewel Lock Path Deformation Test Generator"
    )
    
    parser.add_argument('--path', choices=['Ekagrata', 'Sahaja', 'Vigilance'], 
                       help='Generate specific path variations')
    parser.add_argument('--all', action='store_true', 
                       help='Generate all 3 path variations')
    parser.add_argument('--seeds', type=int, default=2, 
                       help='Number of seeds per combination (default: 2)')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Preview structure without generating')
    
    args = parser.parse_args()
    
    if not args.path and not args.all:
        parser.error("Must specify either --path NAME or --all")
    
    print("="*80)
    print("JEWEL LOCK PATH DEFORMATION TEST")
    print("="*80)
    print(f"Output Directory: {OUTPUT_ROOT}")
    print(f"Seeds per combo: {args.seeds}")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE GENERATION'}")
    
    if args.all:
        print("\nGenerating all 3 path variations...")
        for path in ['Ekagrata', 'Sahaja', 'Vigilance']:
            generate_path_variations(path, args.seeds, args.dry_run)
    else:
        generate_path_variations(args.path, args.seeds, args.dry_run)
    
    print("\n" + "="*80)
    print("PATH DEFORMATION TEST COMPLETE")
    print("="*80)
    print(f"\nResults saved to: {OUTPUT_ROOT}")
    print("\nValidation checklist:")
    print("1. Is this recognizably the SAME jewel as the stage baseline?")
    print("2. Can you identify the path by cut style alone?")
    print("3. Does topology remain unchanged?")
    print("4. Is silhouette smooth (no protrusions)?")


if __name__ == "__main__":
    main()
