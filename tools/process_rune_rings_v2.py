from PIL import Image
import os

files = [
    r"d:\Unity Apps\immanence-os\public\assets\rune_rings\seedling_baseline_v2.png",
    r"d:\Unity Apps\immanence-os\public\assets\rune_rings\ember_baseline_v2.png",
    r"d:\Unity Apps\immanence-os\public\assets\rune_rings\flame_baseline_v2.png",
    r"d:\Unity Apps\immanence-os\public\assets\rune_rings\beacon_baseline_v2.png",
    r"d:\Unity Apps\immanence-os\public\assets\rune_rings\stellar_baseline_v2.png"
]

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
    
    img = Image.open(file_path).convert("RGBA")
    datas = img.getdata()

    # Get the background color from the corner (0,0)
    bg_color = img.getpixel((0,0))
    print(f"Processing {os.path.basename(file_path)} (Detected BG: {bg_color})")

    newData = []
    for item in datas:
        # If the pixel is close to the detected background color, make it transparent
        # Threshold adjusted for "dark" colors
        diff = abs(item[0] - bg_color[0]) + abs(item[1] - bg_color[1]) + abs(item[2] - bg_color[2])
        if diff < 60: # Threshold for dark background removal
            newData.append((bg_color[0], bg_color[1], bg_color[2], 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(file_path, "PNG")
    print(f"Processed: {file_path}")

print("\n✅ All V2 baseline Rune Rings processed for transparency.")
