from PIL import Image
import os

files = [
    r"d:\Unity Apps\immanence-os\public\assets\portals\seedling_portal.png",
    r"d:\Unity Apps\immanence-os\public\assets\portals\ember_portal.png",
    r"d:\Unity Apps\immanence-os\public\assets\portals\flame_portal.png",
    r"d:\Unity Apps\immanence-os\public\assets\portals\beacon_portal.png",
    r"d:\Unity Apps\immanence-os\public\assets\portals\stellar_portal.png"
]

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
    
    img = Image.open(file_path).convert("RGBA")
    datas = img.getdata()

    # Detect background color from corner
    bg_color = img.getpixel((0,0))
    print(f"Processing {os.path.basename(file_path)} (Detected BG: {bg_color})")

    newData = []
    for item in datas:
        # If the pixel is close to white (since we prompted for white background)
        # or close to the detected corner color
        diff = abs(item[0] - 255) + abs(item[1] - 255) + abs(item[2] - 255)
        diff_bg = abs(item[0] - bg_color[0]) + abs(item[1] - bg_color[1]) + abs(item[2] - bg_color[2])
        
        if diff < 15 or diff_bg < 15: 
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(file_path, "PNG")
    print(f"Processed: {file_path}")

print("\n✅ All energy portals processed for transparency.")
