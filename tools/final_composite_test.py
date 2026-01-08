from PIL import Image
import os

def create_final_composite():
    base_dir = r"d:\Unity Apps\immanence-os\public\assets\avatar_v2"
    
    # Parchment background
    bg_color = (240, 234, 214, 255)
    canvas = Image.new("RGBA", (320, 320), bg_color)
    
    # Load approved assets
    frame = Image.open(os.path.join(base_dir, "avatar_frame_light.png")).convert("RGBA")
    instrument = Image.open(os.path.join(base_dir, "avatar_instrument_light.png")).convert("RGBA")
    orb = Image.open(os.path.join(base_dir, "orb_loop_light_0003.png")).convert("RGBA")
    
    # Assembly order (EXACT):
    # 1. Frame ring
    # 2. Instrument ring
    # 3. Orb loop
    # (No particles for this static test)
    
    canvas.alpha_composite(frame)
    canvas.alpha_composite(instrument)
    canvas.alpha_composite(orb)
    
    # Save full size
    full_output = os.path.join(base_dir, "avatar_final_test_320.png")
    canvas.save(full_output)
    print(f"Full size saved: {full_output}")
    
    # Scale to 96x96 for sanity check
    small = canvas.resize((96, 96), Image.Resampling.LANCZOS)
    small_output = os.path.join(base_dir, "avatar_final_test_96.png")
    small.save(small_output)
    print(f"96x96 saved: {small_output}")
    
    print("\nSANITY CHECK:")
    print("Does this feel calm, intentional, expensive?")

if __name__ == "__main__":
    create_final_composite()
