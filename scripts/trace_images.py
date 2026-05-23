import os
import cv2
import numpy as np

brain_dir = r"C:\Users\mjuna\.gemini\antigravity\brain\fed08ebd-7d3a-48fc-b42d-1b803be3f194"
output_dir = r"d:\Career\portfolio"

def trace_image_to_svg(filename, output_name, threshold_val=127, epsilon_factor=0.001, invert=False):
    img_path = os.path.join(brain_dir, filename)
    if not os.path.exists(img_path):
        print(f"Error: {filename} does not exist.")
        return
    
    # Read image
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    print(f"Loaded {filename} with shape {img.shape}")
    
    # Extract alpha channel if it exists, or convert to grayscale
    if len(img.shape) == 3 and img.shape[2] == 4:
        # Use alpha channel as mask if there is one
        gray = img[:, :, 3]
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Invert if needed
    if invert:
        gray = cv2.bitwise_not(gray)
        
    # Threshold to make it binary
    _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY)
    
    # Find contours with CCOMP hierarchy
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_KCOS)
    
    if hierarchy is None:
        print(f"No contours found for {filename}")
        return
        
    hierarchy = hierarchy[0]
    
    # Generate SVG path string
    path_d = []
    width, height = thresh.shape[1], thresh.shape[0]
    
    for i, contour in enumerate(contours):
        # Simplify contour to keep path smooth and lightweight
        # epsilon is a parameter of approxPolyDP
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon_factor * peri, True)
        
        if len(approx) < 3:
            continue
            
        # Form path data for this contour
        d_pts = []
        for pt in approx:
            x, y = pt[0]
            d_pts.append(f"{x:.1f},{y:.1f}")
        
        path_d.append(f"M {d_pts[0]} " + " ".join(f"L {pt}" for pt in d_pts[1:]) + " Z")
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}" fill="currentColor">
    <path fill-rule="evenodd" d="{" ".join(path_d)}" />
</svg>'''
    
    out_path = os.path.join(output_dir, output_name)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated {output_name} with {len(contours)} contours.")

# Trace Ellie's Moth (media__1779402123792.png)
trace_image_to_svg("media__1779402123792.png", "ellie_moth_traced.svg", threshold_val=40, epsilon_factor=0.0005)

# Trace WLF Wolf (media__1779402136216.png)
trace_image_to_svg("media__1779402136216.png", "wlf_wolf_traced.svg", threshold_val=40, epsilon_factor=0.0005)
