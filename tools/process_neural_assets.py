import os
import sys
import json
import glob
from PIL import Image, ImageChops

def black_to_alpha(img_path):
    """Converts a black background image to a transparent one with purity filter."""
    try:
        img = Image.open(img_path).convert("RGBA")
        
        # Split into R, G, B, A
        r, g, b, a = img.split()
        
        # Calculate luminosity to use as the new alpha channel
        # Formula: L = 0.299R + 0.587G + 0.114B
        l = Image.merge("RGB", (r, g, b)).convert("L")
        
        # Apply purity filter: power curve + hard threshold
        # This kills floor noise (grey boxes in light mode)
        def purity_filter(p):
            # Hard threshold: anything below 10 is pure black (alpha=0)
            if p < 10:
                return 0
            # Power curve for smooth glow: A = L^1.8 (amplifies mid-tones)
            normalized = p / 255.0
            alpha_val = int((normalized ** 1.8) * 255)
            return min(255, alpha_val)
        
        alpha = l.point(purity_filter)
        
        # Merge back with the new alpha
        new_img = Image.merge("RGBA", (r, g, b, alpha))
        
        out_path = img_path.replace("_black.png", "_alpha.png")
        new_img.save(out_path, "PNG")
        print(f"Processed: {os.path.basename(img_path)} -> {os.path.basename(out_path)}")
        return True
    except Exception as e:
        print(f"Error processing {img_path}: {e}")
        return False

if __name__ == "__main__":
    # This script will be called after I generate the images using the tool
    target_dir = r"d:\Unity Apps\immanence-os\public\stats\tracking_card"
    targets = [
        "gem_active_black.png",
        "gem_low_black.png",
        "gem_empty_black.png",
        "filament_silk_black.png"
    ]
    for t in targets:
        p = os.path.join(target_dir, t)
        if os.path.exists(p):
            black_to_alpha(p)
