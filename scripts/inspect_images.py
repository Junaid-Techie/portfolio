import os
from PIL import Image

brain_dir = r"C:\Users\mjuna\.gemini\antigravity\brain\fed08ebd-7d3a-48fc-b42d-1b803be3f194"
files = [
    "media__1779401873917.png",
    "media__1779401989454.png",
    "media__1779402123792.png",
    "media__1779402136216.png",
    "media__1779402148870.png"
]

for f in files:
    path = os.path.join(brain_dir, f)
    if os.path.exists(path):
        img = Image.open(path)
        print(f"{f}: size={img.size}, mode={img.mode}")
    else:
        print(f"{f}: does not exist")
