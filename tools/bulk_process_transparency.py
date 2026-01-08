
import numpy as np
from PIL import Image
import os
import glob

def process_transparency(image_path, output_path):
    img = Image.open(image_path).convert('RGBA')
    data = np.array(img)
    
    # We use the max of R, G, B as the alpha channel
    # This works well for additive/transparent objects on black
    rgb = data[:, :, :3]
    alpha = np.max(rgb, axis=2)
    
    # Optional: Boost alpha slightly to ensure light colors aren't too translucent
    # alpha = np.clip(alpha * 1.2, 0, 255).astype(np.uint8)
    
    data[:, :, 3] = alpha
    
    new_img = Image.fromarray(data)
    new_img.save(output_path)
    print(f"Processed: {os.path.basename(image_path)} -> {os.path.basename(output_path)}")

def main():
    base_dirs = [
        r"d:\Unity Apps\immanence-os\public\assets\avatar_v2",
        r"d:\Unity Apps\immanence-os\public\avatars"
    ]
    
    for base_dir in base_dirs:
        raw_files = glob.glob(os.path.join(base_dir, "*_raw*"))
        
        for raw_file in raw_files:
            # Create output name by removing _raw
            output_name = os.path.basename(raw_file).replace("_raw", "")
            output_path = os.path.join(base_dir, output_name)
            process_transparency(raw_file, output_path)

if __name__ == "__main__":
    main()
