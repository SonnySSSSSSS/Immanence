import sys
from pathlib import Path

# Add the tools directory to path so we can import comfyui_client
sys.path.append(str(Path(__file__).parent))
import comfyui_client

MOCKUP_PROMPT = """
A premium UI mockup of a meditation app's progress dashboard, 'regal mystic' aesthetic. 
The screen shows an elegant 'Daily Goals' section with thin, glowing gold progress bars. 
The background is a soft, warm white parchment texture (light mode). 
The progress bars have delicate sacred geometry filigree or 'Performance Vector' lines behind them. 
Text reads '15 / 30 MIN' in Cinzel font. 
The UI feels suspended, contemplative, and high-end. 
Glassmorphism elements, soft amber glows, sharp Cinzel typography. 
4k, cinematic lighting, ultra-modern spiritual design.
"""

MOCKUP_NEGATIVE = """
clutter, busy, hard edges, dark mode, black background, low-res, generic UI, 
bright blue, neon, sci-fi, symbols, figures, people, text-heavy, messy.
"""

def generate_mockup():
    print("🚀 Starting mockup generation for 'Goals' section...")
    output_path = Path("public/bg/goals_mockup.png")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    success = comfyui_client.generate_image(
        positive_prompt=MOCKUP_PROMPT,
        negative_prompt=MOCKUP_NEGATIVE,
        output_path=str(output_path)
    )
    
    if success:
        print(f"✅ Mockup generated successfully: {output_path}")
    else:
        print("❌ Mockup generation failed. Check if ComfyUI is running and the RTX 5070 Ti drivers are updated.")

if __name__ == "__main__":
    generate_mockup()
