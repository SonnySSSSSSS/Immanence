#!/usr/bin/env python3
"""
Full Jewel Lock Matrix Generator

Generates all combinations of Stage × Path × Vector with object-isolation constraints.

Matrix:
- 5 Stages (Seedling, Ember, Flame, Beacon, Stellar)
- 3 Paths (Ekagrata, Sahaja, Vigilance)
- 3 Vectors (Neutral, Jittered, Diffused)
- 2 Seeds per combination
= 90 total images

Usage:
    python tools/jewel_full_matrix.py --seeds 2
    python tools/jewel_full_matrix.py --seeds 2 --dry-run
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from avatar_matrix_gen import STAGES, build_prompt, generate_asset, PROJECT_ROOT
from datetime import datetime

OUTPUT_ROOT = PROJECT_ROOT / "AvatarMatrix" / "FullMatrix"

PATHS = ["Ekagrata", "Sahaja", "Vigilance"]
VECTORS = ["Neutral", "Jittered", "Diffused"]

def generate_full_matrix(seeds=2, dry_run=False):
    """Generate all Stage × Path × Vector combinations."""
    total = len(STAGES) * len(PATHS) * len(VECTORS) * seeds
    
    print(f"\n{'='*80}")
    print("FULL JEWEL LOCK MATRIX GENERATION")
    print(f"{'='*80}")
    print(f"Combinations: {len(STAGES)} stages × {len(PATHS)} paths × {len(VECTORS)} vectors × {seeds} seeds")
    print(f"Total images: {total}")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE GENERATION'}")
    print()
    
    count = 0
    
    for stage in STAGES:
        stage_name = stage["name"]
        
        for path_name in PATHS:
            for vector_name in VECTORS:
                combo_dir = OUTPUT_ROOT / f"{stage_name}" / f"{path_name}" / f"{vector_name}"
                
                print(f"\n[{count+1}/{total//seeds}] {stage_name} + {path_name} + {vector_name} ({seeds} seeds)...")
                
                for seed_idx in range(seeds):
                    count += 1
                    prompt = build_prompt(stage_name, path_name, vector_name)
                    filename = f"{stage_name.lower()}_{path_name.lower()}_{vector_name.lower()}_seed{seed_idx:03d}.png"
                    output_path = combo_dir / filename
                    
                    metadata = {
                        "matrix": "Full Jewel Lock",
                        "stage": stage_name,
                        "path": path_name,
                        "vector": vector_name,
                        "seed": seed_idx,
                        "timestamp": datetime.now().isoformat(),
                        "prompt": prompt,
                        "validation": {
                            "jewelAuthority": "PENDING",
                            "sameTopology": "PENDING",
                            "smoothSilhouette": "PENDING",
                            "pathIdentifiable": "PENDING",
                            "vectorBlindTest": "PENDING",
                            "noBackground": "PENDING"
                        }
                    }
                    
                    generate_asset(prompt, output_path, metadata, dry_run, wait=True)
                    
                    if not dry_run:
                        import time
                        time.sleep(1)
    
    print(f"\n{'='*80}")
    print("FULL MATRIX GENERATION COMPLETE")
    print(f"{'='*80}")
    print(f"\nGenerated {count} images")
    print(f"Results saved to: {OUTPUT_ROOT}")
    print("\nValidation checklist:")
    print("1. Jewel authority (manufactured, not illustrated)")
    print("2. Same topology as baseline")
    print("3. Smooth silhouette (no protrusions)")
    print("4. Path identifiable by cut style")
    print("5. Vector passes blind test (not visible in grayscale silhouette)")
    print("6. No background/shadows/scene context")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Full Jewel Lock Matrix Generator"
    )
    
    parser.add_argument('--seeds', type=int, default=2,
                       help='Number of seeds per combination (default: 2)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Preview structure without generating')
    
    args = parser.parse_args()
    
    generate_full_matrix(args.seeds, args.dry_run)


if __name__ == "__main__":
    main()
