"""
Remove white backgrounds from all title images.
Requires Pillow: pip install Pillow
"""

from PIL import Image
import os
from pathlib import Path

def remove_white_background(input_path, output_path, tolerance=30):
    """
    Remove white/near-white background from an image.
    
    Args:
        input_path: Path to input image
        output_path: Path to save output image
        tolerance: How close to white (255) a pixel needs to be to be considered white
    """
    # Open image and convert to RGBA
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if pixel is close to white
        if item[0] > 255 - tolerance and item[1] > 255 - tolerance and item[2] > 255 - tolerance:
            # Make it transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    img.save(output_path, "PNG")

def main():
    titles_dir = Path(r"d:\Unity Apps\immanence-os\public\titles")
    backup_dir = titles_dir / "backup"
    
    # Create backup directory
    backup_dir.mkdir(exist_ok=True)
    print(f"Backup directory: {backup_dir}")
    
    # Get all PNG files
    png_files = [f for f in titles_dir.glob("*.png") if f.is_file()]
    print(f"Found {len(png_files)} PNG files to process\n")
    
    for file in png_files:
        backup_path = backup_dir / file.name
        
        # Backup original if not already backed up
        if not backup_path.exists():
            import shutil
            shutil.copy2(file, backup_path)
            print(f"Backed up: {file.name}")
        
        # Remove white background
        try:
            remove_white_background(file, file, tolerance=30)
            print(f"✓ Processed: {file.name}")
        except Exception as e:
            print(f"✗ Error processing {file.name}: {e}")
    
    print(f"\nDone! All images have been processed.")
    print(f"Originals backed up to: {backup_dir}")

if __name__ == "__main__":
    main()
