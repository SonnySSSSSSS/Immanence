#!/usr/bin/env python3
"""
Rename Jewel Lock categories to Sanskrit names.

Maps:
- Paths: Ekagrata/Sahaja/Vigilance → Dhyana/Prana/Drishti
- Vectors: Neutral/Jittered/Diffused → Sama/Chala/Vikshipa

Usage:
    python tools/rename_to_sanskrit.py --dry-run
    python tools/rename_to_sanskrit.py
"""

from pathlib import Path
import shutil

PROJECT_ROOT = Path(__file__).parent.parent
MATRIX_ROOT = PROJECT_ROOT / "AvatarMatrix" / "FullMatrix"

# Mapping from English to Sanskrit
PATH_MAP = {
    "Ekagrata": "Dhyana",      # Single-pointed → Meditation
    "Sahaja": "Prana",         # Natural flow → Breath
    "Vigilance": "Drishti"     # Multi-faceted → Gaze/Vision
}

VECTOR_MAP = {
    "Neutral": "Sama",         # Stable → Equanimous
    "Jittered": "Chala",       # Variable → Moving/Fluctuating
    "Diffused": "Vikshipa"     # Diffuse → Scattered
}

def rename_folders_and_files(dry_run=False):
    """Rename all folders and files to Sanskrit names."""
    
    if not MATRIX_ROOT.exists():
        print(f"❌ Matrix root not found: {MATRIX_ROOT}")
        return
    
    print(f"{'='*80}")
    print("RENAMING TO SANSKRIT NAMES")
    print(f"{'='*80}")
    print(f"Root: {MATRIX_ROOT}")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print()
    
    # Step 1: Rename Vector folders (innermost)
    print("Step 1: Renaming Vector folders...")
    for stage_dir in MATRIX_ROOT.iterdir():
        if not stage_dir.is_dir():
            continue
        for path_dir in stage_dir.iterdir():
            if not path_dir.is_dir():
                continue
            for vector_dir in path_dir.iterdir():
                if not vector_dir.is_dir():
                    continue
                
                old_vector_name = vector_dir.name
                if old_vector_name in VECTOR_MAP:
                    new_vector_name = VECTOR_MAP[old_vector_name]
                    new_vector_dir = vector_dir.parent / new_vector_name
                    
                    if dry_run:
                        print(f"  [DRY] {stage_dir.name}/{path_dir.name}/{old_vector_name} → {new_vector_name}")
                    else:
                        if not new_vector_dir.exists():
                            vector_dir.rename(new_vector_dir)
                            print(f"  ✅ {stage_dir.name}/{path_dir.name}/{old_vector_name} → {new_vector_name}")
    
    # Step 2: Rename Path folders
    print("\nStep 2: Renaming Path folders...")
    for stage_dir in MATRIX_ROOT.iterdir():
        if not stage_dir.is_dir():
            continue
        for path_dir in stage_dir.iterdir():
            if not path_dir.is_dir():
                continue
            
            old_path_name = path_dir.name
            if old_path_name in PATH_MAP:
                new_path_name = PATH_MAP[old_path_name]
                new_path_dir = path_dir.parent / new_path_name
                
                if dry_run:
                    print(f"  [DRY] {stage_dir.name}/{old_path_name} → {new_path_name}")
                else:
                    if not new_path_dir.exists():
                        path_dir.rename(new_path_dir)
                        print(f"  ✅ {stage_dir.name}/{old_path_name} → {new_path_name}")
    
    # Step 3: Rename files
    print("\nStep 3: Renaming files...")
    count = 0
    for stage_dir in MATRIX_ROOT.iterdir():
        if not stage_dir.is_dir():
            continue
        for path_dir in stage_dir.iterdir():
            if not path_dir.is_dir():
                continue
            for vector_dir in path_dir.iterdir():
                if not vector_dir.is_dir():
                    continue
                for file_path in vector_dir.glob("*.png"):
                    old_name = file_path.stem
                    
                    # Replace path names
                    new_name = old_name
                    for eng, san in PATH_MAP.items():
                        new_name = new_name.replace(eng.lower(), san.lower())
                    
                    # Replace vector names
                    for eng, san in VECTOR_MAP.items():
                        new_name = new_name.replace(eng.lower(), san.lower())
                    
                    if new_name != old_name:
                        new_file_path = file_path.parent / f"{new_name}.png"
                        
                        if dry_run:
                            print(f"  [DRY] {old_name}.png → {new_name}.png")
                        else:
                            if not new_file_path.exists():
                                file_path.rename(new_file_path)
                                count += 1
    
    if not dry_run:
        print(f"\n  ✅ Renamed {count} files")
    
    print(f"\n{'='*80}")
    print("RENAMING COMPLETE")
    print(f"{'='*80}")
    print("\nNew structure:")
    print("- Paths: Dhyana (meditation), Prana (breath), Drishti (gaze)")
    print("- Vectors: Sama (equanimous), Chala (fluctuating), Vikshipa (scattered)")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Rename Jewel Lock categories to Sanskrit names"
    )
    parser.add_argument('--dry-run', action='store_true',
                       help='Preview changes without renaming')
    
    args = parser.parse_args()
    
    rename_folders_and_files(args.dry_run)

if __name__ == "__main__":
    main()
