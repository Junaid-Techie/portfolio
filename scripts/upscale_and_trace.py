import cv2
import numpy as np
import os

brain_dir = r"C:\Users\mjuna\.gemini\antigravity\brain\fed08ebd-7d3a-48fc-b42d-1b803be3f194"

def upscale_smooth_and_trace(filename, out_svg, scale=10, blur_k=15, thresh_val=127, eps=0.0008, min_area=100):
    path = os.path.join(brain_dir, filename)
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        print(f"Error loading {filename}")
        return
    
    # 1. Upscale using cubic interpolation
    w_new, h_new = img.shape[1] * scale, img.shape[0] * scale
    upscaled = cv2.resize(img, (w_new, h_new), interpolation=cv2.INTER_CUBIC)
    
    # 2. Smooth using Gaussian Blur to convert stair-step pixels into continuous curves
    blurred = cv2.GaussianBlur(upscaled, (blur_k, blur_k), 0)
    
    # 3. Binarize
    _, thresh = cv2.threshold(blurred, thresh_val, 255, cv2.THRESH_BINARY)
    
    # 4. Find contours
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_KCOS)
    if hierarchy is None:
        print(f"No contours for {filename}")
        return
        
    hierarchy = hierarchy[0]
    paths = []
    
    count = 0
    total_pts = 0
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        if area < min_area:
            continue
            
        # Simplify contour to keep path clean and smooth
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
        total_pts += len(approx)
        
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w_new} {h_new}" width="100%" height="100%" fill="currentColor">
    <path fill-rule="evenodd" d="{" ".join(paths)}" />
</svg>'''
    
    with open(out_svg, "w") as f:
        f.write(svg_content)
    print(f"Upscaled & Traced {filename} -> {out_svg} (scale={scale}, paths={count}, points={total_pts})")

# Trace Ellie's Moth (media__1779402123792.png)
upscale_smooth_and_trace("media__1779402123792.png", "ellie_moth_upscaled.svg", scale=10, blur_k=25, thresh_val=100, eps=0.0006, min_area=300)

# Trace WLF Wolf (media__1779402136216.png)
upscale_smooth_and_trace("media__1779402136216.png", "wlf_wolf_upscaled.svg", scale=10, blur_k=25, thresh_val=100, eps=0.0006, min_area=300)
