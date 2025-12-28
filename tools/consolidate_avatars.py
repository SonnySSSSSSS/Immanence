#!/usr/bin/env python3
"""
Consolidate all avatar assets from AvatarMatrix to public/avatars/
Ensures everything is in one place with clean naming.
"""

from pathlib import Path
import shutil

PROJECT_ROOT = Path(__file__).parent.parent
SOURCE_ROOT = PROJECT_ROOT / "AvatarMatrix" / "Sanskrit_Matrix"
DEST_DIR = PROJECT_ROOT / "public" / "avatars"

def consolidate():
    """Copy all Sanskrit Matrix assets to public/avatars/"""
    
    if not SOURCE_ROOT.exists():
        print(f"✅ No AvatarMatrix folder found - all assets already in public/avatars/")
        return
    
    print("="*80)
    print("CONSOLIDATING AVATAR ASSETS")
    print("="*80)
    print(f"Source: {SOURCE_ROOT}")
    print(f"Destination: {DEST_DIR}")
    print()
    
    copied = 0
    skipped = 0
    
    # Walk through all PNG files in Sanskrit_Matrix
    for png_file in SOURCE_ROOT.rglob("*.png"):
        # Parse the filename: {stage}_{vector}_{path}_seed{n}.png
        stem = png_file.stem
        
        # New naming: avatar-{stage}-{path}-{vector}_seed{n}.png
        # (or just use the existing name from Sanskrit_Matrix)
        dest_file = DEST_DIR / png_file.name
        
        if dest_file.exists():
            skipped += 1
            print(f"  ⏭️  Already exists: {png_file.name}")
        else:
            DEST_DIR.mkdir(parents=True, exist_ok=True)
            shutil.copy2(png_file, dest_file)
            copied += 1
            print(f"  ✅ Copied: {png_file.name}")
            
            # Also copy JSON metadata if it exists
            json_file = png_file.with_suffix(".json")
            if json_file.exists():
                shutil.copy2(json_file, dest_file.with_suffix(".json"))
    
    print()
    print(f"✅ Consolidation complete!")
    print(f"   Copied: {copied} files")
    print(f"   Skipped (already exist): {skipped} files")
    print(f"   Total in public/avatars/: {len(list(DEST_DIR.glob('*.png')))} PNG files")
    print()
    print(f"You can now safely delete the AvatarMatrix folder if desired.")

if __name__ == "__main__":
    consolidate()
