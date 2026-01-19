#!/usr/bin/env python3
"""
Generate Moon Phase Sprite Set for Immanence OS
Creates 16 moon phase sprites with consistent style.
"""

import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / "public" / "bg" / "moon-phases"

# Base prompt (reused for consistency)
BASE_PROMPT = (
    "Small moon phase sprite icon, transparent background, soft lunar surface texture, "
    "subtle film grain, mythic sci-fi aesthetic, teal/emerald UI harmony, "
    "off-white moonlight with slight warm tint, dark side is deep charcoal with faint teal tint, "
    "curved terminator, crisp edge at small size, minimal glow, no outline ring, "
    "no background, no stars, centered, clean alpha"
)

# Negative prompt (consistent)
NEGATIVE_PROMPT = (
    "background, stars, sky, nebula, vignette, frame, border, thick halo, outline stroke, "
    "cartoon, flat vector, emoji, watermark, text, blur, noisy artifacts, jpeg artifacts, "
    "harsh specular highlight, strong bloom, lens flare"
)

# 16 phase definitions
PHASES = [
    ("00", "new moon, almost fully dark"),
    ("01", "waxing crescent, thin crescent light on right"),
    ("02", "waxing crescent, slightly thicker light on right"),
    ("03", "waxing crescent, medium crescent light on right"),
    ("04", "first quarter, right half lit"),
    ("05", "waxing gibbous, more than half lit on right"),
    ("06", "waxing gibbous, nearly full, small dark sliver on left"),
    ("07", "waxing gibbous, very close to full, tiny dark sliver on left"),
    ("08", "full moon, fully lit"),
    ("09", "waning gibbous, very close to full, tiny dark sliver on right"),
    ("10", "waning gibbous, nearly full, small dark sliver on right"),
    ("11", "waning gibbous, more than half lit on left"),
    ("12", "last quarter, left half lit"),
    ("13", "waning crescent, medium crescent light on left"),
    ("14", "waning crescent, slightly thicker light on left"),
    ("15", "waning crescent, thin crescent light on left"),
]


def generate_phase(phase_num, phase_desc):
    """Generate a single moon phase sprite."""
    output_file = OUTPUT_DIR / f"moon_phase_{phase_num}.png"
    
    # Combine base prompt with phase-specific instruction
    full_prompt = f"{BASE_PROMPT}, {phase_desc}"
    
    print(f"\n{'='*60}")
    print(f"Generating Phase {phase_num}: {phase_desc}")
    print(f"{'='*60}")
    
    # Call comfy_gen.py
    cmd = [
        sys.executable,
        str(PROJECT_ROOT / "tools" / "comfy_gen.py"),
        full_prompt,
        "--output", str(output_file.relative_to(PROJECT_ROOT)),
        "--negative", NEGATIVE_PROMPT,
        "--width", "256",
        "--height", "256",
        "--steps", "9",  # z-image turbo default
        "--cfg", "1.0",  # z-image turbo default
        "--sampler", "euler_ancestral",
        "--scheduler", "simple",
        "--ckpt", "z-image-turbo-fp8-aio.safetensors",
        "--prefix", f"moon_phase_{phase_num}",
        "--timeout", "120"
    ]
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False, text=True)
        print(f"✅ Phase {phase_num} complete: {output_file.name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Phase {phase_num} failed with exit code {e.returncode}")
        return False


def main():
    print("🌙 Moon Phase Sprite Generator for Immanence OS")
    print(f"Output directory: {OUTPUT_DIR}")
    print(f"Generating {len(PHASES)} phases at 256x256 with z-image turbo")
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate all phases
    successful = 0
    failed = 0
    
    for phase_num, phase_desc in PHASES:
        if generate_phase(phase_num, phase_desc):
            successful += 1
        else:
            failed += 1
    
    # Summary
    print(f"\n{'='*60}")
    print(f"Generation Complete")
    print(f"{'='*60}")
    print(f"✅ Successful: {successful}/{len(PHASES)}")
    print(f"❌ Failed: {failed}/{len(PHASES)}")
    
    if failed == 0:
        print(f"\n🎉 All moon phases generated successfully!")
        print(f"📁 Location: {OUTPUT_DIR}")
        print(f"\nNext steps:")
        print(f"  1. Review the phases visually")
        print(f"  2. Check transparency and consistency")
        print(f"  3. Wire into MoonOrbit component")
    else:
        print(f"\n⚠️  Some phases failed. Review errors above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
