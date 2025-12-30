import os
import glob
from PIL import Image, ImageChops

def black_to_alpha(img_path, output_path):
    """
    Converts a black background image to a transparent one.
    Uses the luminosity of the pixels as the alpha channel.
    """
    try:
        img = Image.open(img_path).convert("RGBA")
        
        # Split into R, G, B, A
        r, g, b, a = img.split()
        
        # Calculate luminosity to use as the new alpha channel
        # This keeps the glow but makes black fully transparent
        # Formula: L = 0.299R + 0.587G + 0.114B
        l = Image.merge("RGB", (r, g, b)).convert("L")
        
        # Amplify alpha slightly for better visibility of faint glows
        alpha = l.point(lambda p: min(255, int(p * 1.2)))
        
        # Merge back with the new alpha
        new_img = Image.merge("RGBA", (r, g, b, alpha))
        
        new_img.save(output_path, "PNG")
        print(f"Processed: {os.path.basename(img_path)} -> {os.path.basename(output_path)}")
        return True
    except Exception as e:
        print(f"Error processing {img_path}: {e}")
        return False

def main():
    target_dir = r"d:\Unity Apps\immanence-os\public\stats\tracking_card"
    files = glob.glob(os.path.join(target_dir, "*_black.png"))
    
    if not files:
        print("No files ending in '_black.png' found in the target directory.")
        return

    print(f"Found {len(files)} files to process...")
    
    for f in files:
        output_name = f.replace("_black.png", "_alpha.png")
        black_to_alpha(f, output_name)
    
    # Also specifically target any others that might not follow the suffix but were generated
    specifics = [
        "wave_ribbon.png",
        "plasma_stream_dark.png",
        "plasma_stream_light.png"
    ]
    for s in specifics:
        p = os.path.join(target_dir, s)
        if os.path.exists(p):
            output_name = os.path.join(target_dir, s.replace(".png", "_alpha.png"))
            black_to_alpha(p, output_name)

if __name__ == "__main__":
    main()
