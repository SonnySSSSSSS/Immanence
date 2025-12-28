#!/usr/bin/env python3
"""
Rename and organize ComfyUI output files for Jewel Lock matrix.

Renames files from ComfyUI output to clean format:
- Remove timestamp/number suffixes
- Keep only: {stage}_{path}_{vector}.png
- Organize into proper folder structure

Usage:
    python tools/organize_jewel_output.py
"""

import re
from pathlib import Path
import shutil

# ComfyUI output directory
COMFYUI_OUTPUT = Path("D:/AI/ComfyUI/output")

# Project output directory
PROJECT_OUTPUT = Path(__file__).parent.parent / "AvatarMatrix" / "FullMatrix"

# Expected patterns
STAGES = ["seedling", "ember", "flame", "beacon", "stellar"]
PATHS = ["ekagrata", "sahaja", "vigilance"]
VECTORS = ["neutral", "jittered", "diffused"]

def parse_filename(filename):
    """Extract stage, path, vector from filename."""
    name_lower = filename.lower()
    
    # Find stage
    stage = None
    for s in STAGES:
        if s in name_lower:
            stage = s
            break
    
    # Find path
    path = None
    for p in PATHS:
        if p in name_lower:
            path = p
            break
    
    # Find vector
    vector = None
    for v in VECTORS:
        if v in name_lower:
            vector = v
            break
    
    return stage, path, vector

def organize_files(dry_run=False):
    """Rename and organize files from ComfyUI output."""
    
    if not COMFYUI_OUTPUT.exists():
        print(f"❌ ComfyUI output directory not found: {COMFYUI_OUTPUT}")
        return
    
    # Find all PNG files
    png_files = list(COMFYUI_OUTPUT.glob("*.png"))
    
    print(f"Found {len(png_files)} PNG files in ComfyUI output")
    print(f"{'='*80}\n")
    
    processed = 0
    skipped = 0
    
    for png_file in png_files:
        stage, path, vector = parse_filename(png_file.name)
        
        if not all([stage, path, vector]):
            print(f"⚠️  Skipping (couldn't parse): {png_file.name}")
            skipped += 1
            continue
        
        # Create clean filename
        clean_name = f"{stage}_{path}_{vector}.png"
        
        # Create destination directory
        dest_dir = PROJECT_OUTPUT / stage.capitalize() / path.capitalize() / vector.capitalize()
        dest_path = dest_dir / clean_name
        
        # Check if file already exists
        if dest_path.exists():
            print(f"⚠️  Already exists: {clean_name}")
            skipped += 1
            continue
        
        if dry_run:
            print(f"[DRY RUN] Would copy:")
            print(f"  From: {png_file.name}")
            print(f"  To:   {dest_dir.relative_to(PROJECT_OUTPUT.parent)}/{clean_name}")
        else:
            # Create directory
            dest_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy file
            shutil.copy2(png_file, dest_path)
            print(f"✅ {clean_name}")
            print(f"   → {dest_dir.relative_to(PROJECT_OUTPUT.parent)}/")
        
        processed += 1
    
    print(f"\n{'='*80}")
    print(f"Processed: {processed}")
    print(f"Skipped: {skipped}")
    print(f"Total: {len(png_files)}")
    
    if not dry_run:
        print(f"\nFiles organized in: {PROJECT_OUTPUT}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Rename and organize ComfyUI jewel output files"
    )
    parser.add_argument('--dry-run', action='store_true',
                       help='Preview changes without copying files')
    
    args = parser.parse_args()
    
    print("="*80)
    print("JEWEL OUTPUT ORGANIZER")
    print("="*80)
    print(f"Source: {COMFYUI_OUTPUT}")
    print(f"Destination: {PROJECT_OUTPUT}")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE'}")
    print()
    
    organize_files(args.dry_run)

if __name__ == "__main__":
    main()
