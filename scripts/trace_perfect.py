import cv2
import numpy as np
import os

brain_dir = r"C:\Users\mjuna\.gemini\antigravity\brain\fed08ebd-7d3a-48fc-b42d-1b803be3f194"

def trace_image(filename, out_svg, thresh_val=127, inv=False, min_area=5, eps=0.001):
    path = os.path.join(brain_dir, filename)
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print(f"Error loading {filename}")
        return
    
    # Invert if specified
    if inv:
        _, thresh = cv2.threshold(img, thresh_val, 255, cv2.THRESH_BINARY_INV)
    else:
        _, thresh = cv2.threshold(img, thresh_val, 255, cv2.THRESH_BINARY)
        
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_KCOS)
    if hierarchy is None:
        print(f"No contours for {filename}")
        return
        
    hierarchy = hierarchy[0]
    paths = []
    width, height = img.shape[1], img.shape[0]
    
    count = 0
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        if area < min_area:
            continue
            
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, eps * peri, True)
        if len(approx) < 3:
            continue
            
        d_pts = []
        for pt in approx:
            x, y = pt[0]
            d_pts.append(f"{x:.1f},{y:.1f}")
        paths.append(f"M {d_pts[0]} " + " ".join(f"L {pt}" for pt in d_pts[1:]) + " Z")
        count += 1
        
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" fill="currentColor">
    <path fill-rule="evenodd" d="{" ".join(paths)}" />
</svg>'''
    
    with open(out_svg, "w") as f:
        f.write(svg_content)
    print(f"Traced {filename} -> {out_svg} ({count} paths, size={width}x{height})")

# Trace the firefly logo image (media__1779401989454.png)
trace_image("media__1779401989454.png", "firefly_1989454.svg", thresh_val=100, inv=False, min_area=10, eps=0.0005)

# Trace the other images to check what they are
trace_image("media__1779399943579.png", "moth_399943579.svg", thresh_val=100, inv=False, min_area=10, eps=0.0005)
trace_image("media__1779402123792.png", "moth_402123792.svg", thresh_val=100, inv=False, min_area=5, eps=0.0005)
trace_image("media__1779402136216.png", "wolf_402136216.svg", thresh_val=100, inv=False, min_area=5, eps=0.0005)
trace_image("media__1779402148870.png", "firefly_402148870.svg", thresh_val=100, inv=False, min_area=5, eps=0.0005)
