import os
import cv2
import numpy as np

brain_dir = r"C:\Users\mjuna\.gemini\antigravity\brain\fed08ebd-7d3a-48fc-b42d-1b803be3f194"
files = [f for f in os.listdir(brain_dir) if f.endswith('.png')]

for filename in sorted(files):
    path = os.path.join(brain_dir, filename)
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"{filename}: Failed to load")
        continue
    
    # Analyze channels
    if len(img.shape) == 2:
        channels = 1
        gray = img
    elif img.shape[2] == 3:
        channels = 3
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    elif img.shape[2] == 4:
        channels = 4
        # Check if alpha is fully opaque
        alpha = img[:, :, 3]
        opaque_pct = (alpha == 255).sum() / alpha.size * 100
        gray = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2GRAY)
        print(f"{filename}: size={img.shape[1]}x{img.shape[0]}, channels={channels}, alpha opaque={opaque_pct:.1f}%")
    
    # Background estimation from corners
    corners = [gray[0,0], gray[0,-1], gray[-1,0], gray[-1,-1]]
    bg_val = int(np.mean(corners))
    
    # Thresholding
    if bg_val > 127:
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
    else:
        _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    print(f"  External Contours: {len(contours)}, bg_val={bg_val}")
    
    # Print out approximate visual description by checking aspect ratios and sizes
    aspect = img.shape[1] / img.shape[0]
    print(f"  Aspect Ratio: {aspect:.3f}")
