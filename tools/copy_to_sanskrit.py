#!/usr/bin/env python3
"""
Copy Jewel Lock files to Sanskrit-named structure.

Creates new folder structure with Sanskrit names instead of renaming in place.

Usage:
    python tools/copy_to_sanskrit.py --dry-run
    python tools/copy_to_sanskrit.py
"""

from pathlib import Path
import shutil

PROJECT_ROOT = Path(__file__).parent.parent
OLD_ROOT = PROJECT_ROOT / "AvatarMatrix" / "FullMatrix"
NEW_ROOT = PROJECT_ROOT / "AvatarMatrix" / "FullMatrix_Sanskrit"

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

def copy_to_sanskrit(dry_run=False):
    """Copy files to new structure with Sanskrit names."""
    
    if not OLD_ROOT.exists():
        print(f"❌ Source not found: {OLD_ROOT}")
        return
    
    print(f"{'='*80}")
    print("COPYING TO SANSKRIT STRUCTURE")
    print(f"{'='*80}")
    print(f"Source: {OLD_ROOT}")
    print(f"Destination: {NEW_ROOT}")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print()
    
    count = 0
    
    for stage_dir in OLD_ROOT.iterdir():
        if not stage_dir.is_dir():
            continue
        
        stage_name = stage_dir.name
        
        for path_dir in stage_dir.iterdir():
            if not path_dir.is_dir():
                continue
            
            old_path_name = path_dir.name
            new_path_name = PATH_MAP.get(old_path_name, old_path_name)
            
            for vector_dir in path_dir.iterdir():
                if not vector_dir.is_dir():
                    continue
                
                old_vector_name = vector_dir.name
                new_vector_name = VECTOR_MAP.get(old_vector_name, old_vector_name)
                
                # Create destination directory
                dest_dir = NEW_ROOT / stage_name / new_path_name / new_vector_name
                
                for file_path in vector_dir.glob("*.png"):
                    old_filename = file_path.stem
                    
                    # Replace path and vector names in filename
                    new_filename = old_filename
                    for eng, san in PATH_MAP.items():
                        new_filename = new_filename.replace(eng.lower(), san.lower())
                    for eng, san in VECTOR_MAP.items():
                        new_filename = new_filename.replace(eng.lower(), san.lower())
                    
                    dest_file = dest_dir / f"{new_filename}.png"
                    
                    if dry_run:
                        print(f"  [DRY] {stage_name}/{new_path_name}/{new_vector_name}/{new_filename}.png")
                    else:
                        dest_dir.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(file_path, dest_file)
                        count += 1
    
    if not dry_run:
        print(f"\n✅ Copied {count} files to {NEW_ROOT}")
        print("\nTo replace old structure:")
        print(f"1. Delete: {OLD_ROOT}")
        print(f"2. Rename: {NEW_ROOT} → FullMatrix")
    
    print(f"\n{'='*80}")
    print("New naming:")
    print("- Paths: Dhyana (meditation), Prana (breath), Drishti (gaze)")
    print("- Vectors: Sama (equanimous), Chala (fluctuating), Vikshipa (scattered)")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Copy Jewel Lock files to Sanskrit-named structure"
    )
    parser.add_argument('--dry-run', action='store_true',
                       help='Preview changes without copying')
    
    args = parser.parse_args()
    
    copy_to_sanskrit(args.dry_run)

if __name__ == "__main__":
    main()
