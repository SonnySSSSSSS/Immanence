#!/usr/bin/env python3
"""
Create a contact sheet of all moon phases for visual review.
"""

from PIL import Image
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
PHASES_DIR = PROJECT_ROOT / "public" / "bg" / "moon-phases"
OUTPUT_FILE = PHASES_DIR / "contact_sheet.png"

def create_contact_sheet():
    """Create a 4x4 grid showing all 16 moon phases."""
    
    # Load all phases
    phases = []
    for i in range(16):
        phase_file = PHASES_DIR / f"moon_phase_{i:02d}.png"
        if phase_file.exists():
            phases.append(Image.open(phase_file).convert("RGBA"))
        else:
            print(f"⚠️  Missing: {phase_file.name}")
            # Create placeholder
            phases.append(Image.new("RGBA", (256, 256), (255, 0, 0, 128)))
    
    if len(phases) != 16:
        print(f"❌ Expected 16 phases, found {len(phases)}")
        return False
    
    # Create checkerboard background pattern
    tile_size = 256
    grid_cols = 4
    grid_rows = 4
    margin = 20
    
    canvas_width = (tile_size * grid_cols) + (margin * (grid_cols + 1))
    canvas_height = (tile_size * grid_rows) + (margin * (grid_rows + 1))
    
    # Create checkerboard
    checker_size = 16
    checkerboard = Image.new("RGB", (canvas_width, canvas_height), (40, 40, 40))
    
    for y in range(0, canvas_height, checker_size):
        for x in range(0, canvas_width, checker_size):
            if (x // checker_size + y // checker_size) % 2 == 0:
                for dy in range(checker_size):
                    for dx in range(checker_size):
                        px = x + dx
                        py = y + dy
                        if px < canvas_width and py < canvas_height:
                            checkerboard.putpixel((px, py), (50, 50, 50))
    
    # Convert to RGBA for compositing
    canvas = checkerboard.convert("RGBA")
    
    # Paste each phase onto the grid
    for idx, phase_img in enumerate(phases):
        row = idx // grid_cols
        col = idx % grid_cols
        
        x = margin + (col * (tile_size + margin))
        y = margin + (row * (tile_size + margin))
        
        # Composite the phase image
        canvas.paste(phase_img, (x, y), phase_img)
    
    # Save
    canvas.save(OUTPUT_FILE, "PNG")
    print(f"✅ Contact sheet saved: {OUTPUT_FILE}")
    print(f"   Size: {canvas_width}x{canvas_height}px")
    print(f"   Grid: {grid_cols}x{grid_rows} (16 phases)")
    
    return True


if __name__ == "__main__":
    print("🎨 Creating moon phase contact sheet...")
    if create_contact_sheet():
        print("✅ Done!")
    else:
        print("❌ Failed!")
