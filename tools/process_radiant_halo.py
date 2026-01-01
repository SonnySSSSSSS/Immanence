import numpy as np
from PIL import Image
import os

def black_to_alpha(image_path, output_path):
    img = Image.open(image_path).convert('RGBA')
    data = np.array(img)
    
    # Simple luminosity to alpha
    # We take the max of R, G, B as the alpha value
    rgb = data[:, :, :3]
    alpha = np.max(rgb, axis=2)
    
    # Put the alpha back into the data
    data[:, :, 3] = alpha
    
    # Save the result
    new_img = Image.fromarray(data)
    new_img.save(output_path)
    print(f"Processed {image_path} -> {output_path}")

if __name__ == "__main__":
    input_file = "d:/Unity Apps/immanence-os/public/assets/radiant_halo_raw.png"
    output_file = "d:/Unity Apps/immanence-os/public/assets/radiant_halo.png"
    
    if os.path.exists(input_file):
        black_to_alpha(input_file, output_file)
    else:
        print(f"Error: {input_file} not found")
