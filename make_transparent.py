#!/usr/bin/env python3
"""
Batch process PNG images to make white/black backgrounds transparent
Processes all title images in sets 2-5
"""

from PIL import Image
import os
from pathlib import Path

def make_transparent(image_path, background_color='white', tolerance=30):
    """
    Make white or black backgrounds transparent
    
    Args:
        image_path: Path to the image file
        background_color: 'white' or 'black'
        tolerance: Color tolerance (0-255)
    """
    print(f"Processing: {image_path} (removing {background_color})")
    
    # Open image and convert to RGBA
    img = Image.open(image_path).convert('RGBA')
    data = img.getdata()
    
    new_data = []
    
    for item in data:
        # Check if pixel is close to white or black
        if background_color == 'white':
            # Remove white pixels (all RGB values > 255-tolerance)
            if item[0] > (255 - tolerance) and item[1] > (255 - tolerance) and item[2] > (255 - tolerance):
                # Make transparent
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        else:  # black
            # Remove black pixels (all RGB values < tolerance)
            if item[0] < tolerance and item[1] < tolerance and item[2] < tolerance:
                # Make transparent
                new_data.append((0, 0, 0, 0))
            else:
                new_data.append(item)
    
    # Update image data
    img.putdata(new_data)
    
    # Save with transparency
    img.save(image_path, 'PNG')
    print(f"  ✓ Saved: {image_path}")

def main():
    base_path = Path('public/titles')
    
    # Process light mode images (remove white)
    print("\n=== Processing Light Mode Images (removing white) ===\n")
    for set_dir in ['set2', 'set3', 'set4', 'set5']:
        light_dir = base_path / set_dir / 'light'
        if light_dir.exists():
            for img_file in light_dir.glob('*.png'):
                try:
                    make_transparent(str(img_file), 'white', tolerance=30)
                except Exception as e:
                    print(f"  ✗ Error processing {img_file}: {e}")
    
    # Process dark mode images (remove black)
    print("\n=== Processing Dark Mode Images (removing black) ===\n")
    for set_dir in ['set2', 'set3', 'set4', 'set5']:
        dark_dir = base_path / set_dir / 'dark'
        if dark_dir.exists():
            for img_file in dark_dir.glob('*.png'):
                try:
                    make_transparent(str(img_file), 'black', tolerance=30)
                except Exception as e:
                    print(f"  ✗ Error processing {img_file}: {e}")
    
    print("\n=== Done! All images processed ===\n")

if __name__ == '__main__':
    main()
