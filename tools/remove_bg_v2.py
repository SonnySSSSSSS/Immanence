from PIL import Image
import os

files = [
    r"d:\Unity Apps\immanence-os\public\assets\avatar_v2\avatar_container_frame_light_v2.png",
    r"d:\Unity Apps\immanence-os\public\assets\avatar_v2\avatar_container_bezel_light_v2.png",
    r"d:\Unity Apps\immanence-os\public\assets\avatar_v2\avatar_container_glass_light_v2.png",
    r"d:\Unity Apps\immanence-os\public\assets\avatar_v2\avatar_container_innerShadow_light_v2.png"
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
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(file_path, "PNG")
    print(f"Processed: {file_path}")
