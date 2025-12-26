import sys
from pathlib import Path

# Add the tools directory to path so we can import comfyui_client
sys.path.append(str(Path(__file__).parent))
import comfyui_client

PROMPT = """
A high-resolution seamless horizontal texture strip of flowing liquid gold energy, 
ethereal luminous golden plasma, soft volumetric glow, fine-grained cosmic texture, 
golden ripples, sacred spiritual light, 1024x256 resolution, cinematic lighting, 
premium modern aesthetic. 
"""

NEGATIVE = """
clutter, busy, sharp contrast, bright highlights, stars, galaxies, nebula, 
figurative, text, logos, low-res, grainy noise, harsh edges, black background frame.
"""

def generate_texture():
    print("🚀 Generating Liquid Gold texture...")
    output_path = Path("public/ui/liquid_gold_texture.png")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Using the existing comfyui_client but directing it to save at the correct path
    success = comfyui_client.generate_image(
        positive_prompt=PROMPT,
        negative_prompt=NEGATIVE,
        output_path=str(output_path)
    )
    
    if success:
        print(f"✅ Texture generated: {output_path}")
    else:
        print("❌ Generation failed.")

if __name__ == "__main__":
    generate_texture()
