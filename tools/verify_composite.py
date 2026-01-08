
from PIL import Image
import os

def create_composite():
    base_dir = r"d:\Unity Apps\immanence-os\public\assets\avatar_v2"
    
    # Load assets
    frame = Image.open(os.path.join(base_dir, "avatar_frame_light.png")).convert("RGBA")
    instrument = Image.open(os.path.join(base_dir, "avatar_instrument_light.png")).convert("RGBA")
    orb = Image.open(os.path.join(base_dir, "orb_loop_light_0001.png")).convert("RGBA")
    
    # Create background (parchment)
    bg_color = (240, 234, 214, 255) # Eggshell
    canvas = Image.new("RGBA", (320, 320), bg_color)
    
    # Composite
    # Layer order: Instrument (bottom) -> Particles -> Frame -> Orb (top)
    # Wait, particles are usually INSIDE the orb, so Instrument -> Particles -> Frame -> Orb
    particles = Image.open(os.path.join(base_dir, "orb_particles_light_0001.png")).convert("RGBA")
    
    canvas.alpha_composite(instrument)
    canvas.alpha_composite(particles)
    canvas.alpha_composite(frame)
    canvas.alpha_composite(orb)
    
    # Scale to 96x96
    small = canvas.resize((96, 96), Image.Resampling.LANCZOS)
    
    # Save
    output_path = os.path.join(base_dir, "avatar_composite_check.png")
    small.save(output_path)
    print(f"Composite saved to {output_path}")

if __name__ == "__main__":
    create_composite()
