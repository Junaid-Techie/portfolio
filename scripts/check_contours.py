import cv2
import numpy as np
import os

brain_dir = r"C:\Users\mjuna\.gemini\antigravity\brain\fed08ebd-7d3a-48fc-b42d-1b803be3f194"

def get_contours_info(filename):
    path = os.path.join(brain_dir, filename)
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print(f"Error loading {filename}")
        return
    
    # We want to check the distribution of contour areas
    _, thresh = cv2.threshold(img, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    print(f"\n--- {filename} ({img.shape[1]}x{img.shape[0]}) ---")
    print(f"Total contours found: {len(contours)}")
    areas = [cv2.contourArea(c) for c in contours]
    areas.sort(reverse=True)
    print("Top 10 contour areas:", areas[:10])

get_contours_info("media__1779399943579.png")
get_contours_info("media__1779401989454.png")
get_contours_info("media__1779402123792.png")
get_contours_info("media__1779402136216.png")
get_contours_info("media__1779402148870.png")
