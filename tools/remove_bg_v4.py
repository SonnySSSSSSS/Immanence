from PIL import Image
import os

files = [
    r"d:\Unity Apps\immanence-os\public\assets\avatar_v2\avatar_container_stone_v4.png",
    r"d:\Unity Apps\immanence-os\public\assets\avatar_v2\avatar_container_bezel_v4.png",
    r"d:\Unity Apps\immanence-os\public\assets\avatar_v2\avatar_container_glass_v4.png",
    r"d:\Unity Apps\immanence-os\public\assets\avatar_v2\avatar_container_innerShadow_v4.png"
]

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
    
    img = Image.open(file_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # If the pixel is white or very close to white, make it transparent
        # Threshold adjusted to be more aggressive for clean geometry
        if item[0] > 245 and item[1] > 245 and item[2] > 245:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(file_path, "PNG")
    print(f"Processed: {file_path}")
