import os
from PIL import Image, ImageOps
import numpy as np

def process_highlight(input_path, output_path):
    # For white highlights on black: use brightness as alpha
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img)
    
    # Calculate alpha based on RGB brightness
    rgb = data[:, :, :3]
    alpha = np.max(rgb, axis=2)
    
    # Apply alpha
    data[:, :, 3] = alpha
    
    new_img = Image.fromarray(data)
    new_img.save(output_path)
    print(f"Processed highlight: {output_path}")

def process_lens(input_path, output_path):
    # For glass lens on black: 
    # We want to keep the subtle refractions but make the background transparent
    img = Image.open(input_path).convert('RGBA')
    data = np.array(img).astype(float)
    
    rgb = data[:, :, :3]
    # Use max brightness for alpha
    alpha = np.max(rgb, axis=2)
    
    # For glass, we might want a slightly higher base alpha to keep it visible
    # but let's see how simple max works first. Actually, let's normalize it.
    alpha = (alpha / 255.0) * 0.8 * 255.0 # cap at 80% opacity for the lens surface
    
    data[:, :, 3] = alpha.astype(np.uint8)
    
    new_img = Image.fromarray(data.astype(np.uint8))
    new_img.save(output_path)
    print(f"Processed lens: {output_path}")

def process_shadow(input_path, output_path):
    # For black shadow on white background:
    # Use 255 - brightness as alpha, and make the color black
    img = Image.open(input_path).convert('L') # Greyscale
    data = np.array(img)
    
    # Invert for alpha (white becomes 0, black becomes 255)
    alpha = 255 - data
    
    # Create new RGBA image (all black, with alpha from inversion)
    new_data = np.zeros((data.shape[0], data.shape[1], 4), dtype=np.uint8)
    new_data[:, :, 3] = alpha
    
    new_img = Image.fromarray(new_data)
    new_img.save(output_path)
    print(f"Processed shadow: {output_path}")

if __name__ == "__main__":
    base_dir = r"d:\Unity Apps\immanence-os\public\assets\avatar_v2"
    
    process_lens(os.path.join(base_dir, "optical_lens_raw.png"), os.path.join(base_dir, "optical_lens.png"))
    process_highlight(os.path.join(base_dir, "optical_highlight_raw.png"), os.path.join(base_dir, "optical_highlight.png"))
    process_shadow(os.path.join(base_dir, "optical_shadow_raw.png"), os.path.join(base_dir, "optical_shadow.png"))
