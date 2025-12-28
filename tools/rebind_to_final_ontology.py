#!/usr/bin/env python3
"""
Rebind existing Jewel Lock assets to the final Sanskrit ontology.

Mapping:
- English Paths (Geometries) -> Sanskrit Paths (Modes)
  - Ekagrata -> Dhyana
  - Sahaja -> Prana
  - Vigilance -> Drishti
- English Vectors -> Sanskrit Vectors (Attentional Orientations)
  - Neutral -> Ekagrata
  - Jittered -> Vigilance
  - Diffused -> Sahaja

Naming format: {stage}_{attentionVector}_{path}_seed{n}.png
"""

from pathlib import Path
import shutil

PROJECT_ROOT = Path(__file__).parent.parent
SOURCE_ROOT = PROJECT_ROOT / "AvatarMatrix" / "FullMatrix"
DEST_ROOT = PROJECT_ROOT / "AvatarMatrix" / "Sanskrit_Matrix"

# Path Mapping (Geometry -> Mode)
PATH_MAP = {
    "Ekagrata": "Dhyana",
    "Sahaja": "Prana",
    "Vigilance": "Drishti"
}

# Vector Mapping (Light Physics -> Attentional Orientation)
VECTOR_MAP = {
    "Neutral": "Ekagrata",
    "Jittered": "Vigilance",
    "Diffused": "Sahaja"
}

def rebind(dry_run=False):
    if not SOURCE_ROOT.exists():
        print(f"❌ Source not found: {SOURCE_ROOT}")
        return

    print("="*80)
    print("REBINDING ASSETS TO FINAL ONTOLOGY")
    print("="*80)
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print()

    count = 0
    for stage_dir in SOURCE_ROOT.iterdir():
        if not stage_dir.is_dir(): continue
        stage = stage_dir.name.lower()
        
        for eng_path_dir in stage_dir.iterdir():
            if not eng_path_dir.is_dir(): continue
            eng_path = eng_path_dir.name
            path = PATH_MAP.get(eng_path, eng_path).lower()
            
            for eng_vec_dir in eng_path_dir.iterdir():
                if not eng_vec_dir.is_dir(): continue
                eng_vec = eng_vec_dir.name
                vector = VECTOR_MAP.get(eng_vec, eng_vec).lower()
                
                # New destination: Stage / Path / Vector
                dest_dir = DEST_ROOT / stage.capitalize() / path.capitalize() / vector.capitalize()
                
                for png_file in eng_vec_dir.glob("*.png"):
                    # Original name might have seeds
                    # We want: {stage}_{vector}_{path}_seed{n}.png
                    # Find seed
                    import re
                    match = re.search(r"seed(\d+)", png_file.name)
                    seed = match.group(1) if match else "000"
                    
                    new_filename = f"{stage}_{vector}_{path}_seed{seed}.png"
                    dest_path = dest_dir / new_filename
                    
                    if dry_run:
                        # print(f"  [DRY] {png_file.name} -> {new_filename}")
                        pass
                    else:
                        dest_dir.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(png_file, dest_path)
                        # Also copy json metadata if exists
                        json_file = png_file.with_suffix(".json")
                        if json_file.exists():
                            shutil.copy2(json_file, dest_path.with_suffix(".json"))
                    count += 1
    
    print(f"\n✅ Rebound {count} assets to {DEST_ROOT}")
    if not dry_run:
        print("\nStructure correctly maps:")
        print("  - Path: participate mode (Dhyana, Prana, Drishti)")
        print("  - Vector: energy flavor (Ekagrata, Sahaja, Vigilance)")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    rebind(args.dry_run)
