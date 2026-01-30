#!/usr/bin/env python3
"""
Create base plate images for img2img Turbo generation.
These are clean gradient plates that Turbo will then refine.
"""

from PIL import Image, ImageDraw
import json

WIDTH = 1024
HEIGHT = 1536

def create_full_body_plate():
    """Full body: spectrum colors blended vertically on right."""
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(30, 30, 35))  # Dark base
    
    # Draw vertical gradient column on the right (spectrum)
    # Red -> Orange -> Yellow -> Green -> Cyan -> Blue -> Violet
    colors = [
        (139, 20, 20),    # Deep red
        (180, 80, 0),     # Orange
        (180, 140, 0),    # Gold
        (60, 120, 60),    # Muted green
        (40, 100, 140),   # Cyan
        (60, 60, 150),    # Blue
        (100, 40, 120),   # Violet
    ]
    
    x_start = int(WIDTH * 0.65)
    x_end = WIDTH - 40
    segment_height = HEIGHT // len(colors)
    
    for i, color in enumerate(colors):
        y_start = i * segment_height
        y_end = (i + 1) * segment_height
        
        # Draw a soft gradient for this segment
        draw = ImageDraw.Draw(img, 'RGBA')
        for x in range(x_start, x_end):
            alpha_x = (x - x_start) / (x_end - x_start)
            for y in range(y_start, y_end):
                # Soft blend
                r = int(color[0] * (0.3 + 0.7 * alpha_x) + 30)
                g = int(color[1] * (0.3 + 0.7 * alpha_x) + 30)
                b = int(color[2] * (0.3 + 0.7 * alpha_x) + 30)
                draw.point((x, y), fill=(r, g, b, 255))
    
    img.save('public/generated/base_plate_full_body.png')
    print("✅ Created base_plate_full_body.png")

def create_lower_body_plate():
    """Lower body: earth tones concentrated at bottom."""
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(30, 30, 35))  # Dark base
    
    # Earth gradient on right side, concentrated at bottom
    draw = ImageDraw.Draw(img)
    
    x_start = int(WIDTH * 0.65)
    x_end = WIDTH - 40
    
    for y in range(HEIGHT):
        # Stronger at bottom, fades at top
        intensity = (y / HEIGHT) ** 0.8
        
        for x in range(x_start, x_end):
            alpha_x = (x - x_start) / (x_end - x_start)
            combined = intensity * (0.3 + 0.7 * alpha_x)
            
            # Earthy palette: deep red, brown, umber, olive
            r = int(100 * combined + 30)
            g = int(70 * combined + 25)
            b = int(40 * combined + 25)
            
            draw.point((x, y), fill=(r, g, b))
    
    img.save('public/generated/base_plate_lower_body.png')
    print("✅ Created base_plate_lower_body.png")

def create_upper_body_plate():
    """Upper body: cool, bright tones at top."""
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(30, 30, 35))  # Dark base
    
    draw = ImageDraw.Draw(img)
    
    x_start = int(WIDTH * 0.65)
    x_end = WIDTH - 40
    
    for y in range(HEIGHT):
        # Stronger at top, fades downward
        intensity = ((HEIGHT - y) / HEIGHT) ** 0.8
        
        for x in range(x_start, x_end):
            alpha_x = (x - x_start) / (x_end - x_start)
            combined = intensity * (0.3 + 0.7 * alpha_x)
            
            # Cool palette: pale blue, cyan, soft gold
            r = int(80 * combined + 50)
            g = int(120 * combined + 60)
            b = int(150 * combined + 70)
            
            draw.point((x, y), fill=(r, g, b))
    
    img.save('public/generated/base_plate_upper_body.png')
    print("✅ Created base_plate_upper_body.png")

def create_chakra_alignment_plate():
    """Chakra alignment: 7 soft points vertically on right."""
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(30, 30, 35))  # Dark base
    
    draw = ImageDraw.Draw(img, 'RGBA')
    
    # 7 chakra points
    chakra_colors = [
        (180, 20, 20),    # Red
        (200, 100, 0),    # Orange
        (200, 180, 0),    # Yellow
        (40, 120, 60),    # Green
        (60, 180, 200),   # Blue
        (100, 60, 180),   # Indigo
        (150, 40, 150),   # Violet
    ]
    
    center_x = int(WIDTH * 0.75)
    start_y = HEIGHT // 8
    end_y = HEIGHT - (HEIGHT // 8)
    
    for i, color in enumerate(chakra_colors):
        y = start_y + (i / 6) * (end_y - start_y)
        
        # Draw soft circle for each point
        radius = 40
        for px in range(int(center_x - radius), int(center_x + radius)):
            for py in range(int(y - radius), int(y + radius)):
                dist = ((px - center_x)**2 + (py - y)**2) ** 0.5
                if dist < radius:
                    alpha = int(200 * (1 - dist / radius))
                    r = int(color[0] * 0.5 + 40)
                    g = int(color[1] * 0.5 + 40)
                    b = int(color[2] * 0.5 + 40)
                    draw.point((px, py), fill=(r, g, b, alpha))
    
    img.save('public/generated/base_plate_chakra_alignment.png')
    print("✅ Created base_plate_chakra_alignment.png")

def create_expanded_chakra_plate():
    """Expanded chakra: sparse constellation, asymmetrical."""
    img = Image.new('RGB', (WIDTH, HEIGHT), color=(25, 25, 40))  # Deep blue base
    
    draw = ImageDraw.Draw(img, 'RGBA')
    
    # Sparse constellation pattern
    # Main vertical axis + some spread
    points = [
        (int(WIDTH * 0.75), int(HEIGHT * 0.1)),    # Top
        (int(WIDTH * 0.8), int(HEIGHT * 0.25)),    # Upper right spread
        (int(WIDTH * 0.72), int(HEIGHT * 0.35)),
        (int(WIDTH * 0.75), int(HEIGHT * 0.5)),    # Center
        (int(WIDTH * 0.78), int(HEIGHT * 0.65)),
        (int(WIDTH * 0.73), int(HEIGHT * 0.8)),
        (int(WIDTH * 0.75), int(HEIGHT * 0.9)),    # Bottom
    ]
    
    for px, py in points:
        # Draw faint glow point
        radius = 30
        for x in range(px - radius, px + radius):
            for y in range(py - radius, py + radius):
                dist = ((x - px)**2 + (y - py)**2) ** 0.5
                if dist < radius:
                    alpha = int(150 * (1 - dist / radius))
                    draw.point((x, y), fill=(120, 140, 200, alpha))
    
    img.save('public/generated/base_plate_expanded_chakra.png')
    print("✅ Created base_plate_expanded_chakra.png")

if __name__ == '__main__':
    create_full_body_plate()
    create_lower_body_plate()
    create_upper_body_plate()
    create_chakra_alignment_plate()
    create_expanded_chakra_plate()
    print("\n✅ All base plates created in public/generated/")
