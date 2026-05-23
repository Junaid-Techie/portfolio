import cv2
import numpy as np
import os

brain_dir = r"C:\Users\mjuna\.gemini\antigravity\brain\fed08ebd-7d3a-48fc-b42d-1b803be3f194"

def inspect_image_pixels(filename):
    path = os.path.join(brain_dir, filename)
    if not os.path.exists(path):
        print(f"{filename} does not exist.")
        return
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    print(f"--- {filename} ---")
    print("Shape:", img.shape)
    for c in range(img.shape[2]):
        channel = img[:, :, c]
        print(f"Channel {c}: min={channel.min()}, max={channel.max()}, mean={channel.mean():.2f}")
        # Count non-zero or unique values
        unique, counts = np.unique(channel, return_counts=True)
        print(f"  Unique values count: {len(unique)}")
        if len(unique) < 10:
            print("  Values:", dict(zip(unique, counts)))

inspect_image_pixels("media__1779402123792.png")
inspect_image_pixels("media__1779402136216.png")
inspect_image_pixels("media__1779401989454.png")
