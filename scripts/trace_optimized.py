import os
import cv2
import numpy as np

brain_dir = r"C:\Users\mjuna\.gemini\antigravity\brain\fed08ebd-7d3a-48fc-b42d-1b803be3f194"
output_dir = r"d:\Career\portfolio"

def trace_image_to_perfect_svg(filename, output_name, threshold_val=127, epsilon_factor=0.001, invert=False):
    img_path = os.path.join(brain_dir, filename)
    if not os.path.exists(img_path):
        print(f"Error: {filename} does not exist.")
        return
    
    # Read image as grayscale
    gray = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
    width, height = gray.shape[1], gray.shape[0]
    
    # Automatic background estimation from corners
    corners = [gray[0,0], gray[0,-1], gray[-1,0], gray[-1,-1]]
    bg_val = int(np.mean(corners))
    
    # We want the foreground (shapes) to be white (255) and background to be black (0)
    if bg_val > 127:
        _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY_INV)
    else:
        _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY)
    
    # Find contours
    contours, hierarchy = cv2.findContours(thresh, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_KCOS)
    
    if hierarchy is None:
        print(f"No contours found for {filename}")
        return
        
    hierarchy = hierarchy[0]
    
    path_d = []
    total_pts = 0
    
    # We want to traverse contours. Using CCOMP, we can output all of them as a single string.
    # To be extremely accurate and prevent tiny noise contours (e.g. single pixel noise),
    # let's filter out contours that have very small area (less than 4 pixels).
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        if area < 3.0:
            continue
            
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon_factor * peri, True)
        
        if len(approx) < 3:
            continue
            
        total_pts += len(approx)
        
        # Form path data for this contour
        d_pts = []
        for pt in approx:
            x, y = pt[0]
            d_pts.append(f"{x:.1f},{y:.1f}")
        
        # Add to path list
        path_d.append(f"M {d_pts[0]} " + " ".join(f"L {pt}" for pt in d_pts[1:]) + " Z")
    
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%" fill="currentColor">
    <path fill-rule="evenodd" d="{" ".join(path_d)}" />
</svg>'''
    
    out_path = os.path.join(output_dir, output_name)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print(f"Generated {output_name}: size={width}x{height}, contours={len(path_d)}, total_points={total_pts}, file_size={os.path.getsize(out_path)} bytes")

# We use epsilon_factor = 0.0008 to preserve fine details (like eyespots and snarling teeth)
# while keeping the curves incredibly smooth and anti-aliased.
trace_image_to_perfect_svg("media__1779402123792.png", "ellie_moth.svg", threshold_val=100, epsilon_factor=0.0006)
trace_image_to_perfect_svg("media__1779402136216.png", "wlf_wolf.svg", threshold_val=100, epsilon_factor=0.0006)
