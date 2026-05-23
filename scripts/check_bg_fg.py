import cv2
import numpy as np
import os

brain_dir = r"C:\Users\mjuna\.gemini\antigravity\brain\fed08ebd-7d3a-48fc-b42d-1b803be3f194"

def check_bg_fg(filename):
    path = os.path.join(brain_dir, filename)
    if not os.path.exists(path):
        return
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    # Background is typically at the corners
    corners = [img[0,0], img[0,-1], img[-1,0], img[-1,-1]]
    bg_val = int(np.mean(corners))
    print(f"{filename}: bg_estimate={bg_val}, min={img.min()}, max={img.max()}")
    # Let's save a thresholded debug image to see the shapes
    if bg_val > 127:
        # Background is white/light, shape is dark
        # We want the shape to be white (255) and background to be black (0) for contour detection
        thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY_INV)[1]
    else:
        # Background is dark, shape is light
        thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)[1]
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    print(f"  Using automatic threshold: found {len(contours)} contours")

check_bg_fg("media__1779402123792.png")
check_bg_fg("media__1779402136216.png")
check_bg_fg("media__1779401989454.png")
