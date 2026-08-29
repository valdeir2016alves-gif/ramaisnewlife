from PIL import Image
import sys

def remove_background(input_path, output_path, fuzz=30):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if pixel is near white (255, 255, 255)
        if item[0] > 255 - fuzz and item[1] > 255 - fuzz and item[2] > 255 - fuzz:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Crop to bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")

remove_background(sys.argv[1], sys.argv[2])
