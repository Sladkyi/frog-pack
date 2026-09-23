import os
import glob
import numpy as np
from PIL import Image

BRAIN_DIR = r"C:\Users\User\.gemini\antigravity-ide\brain\3e85bdcf-760b-4c60-bd10-2cd6ffc03c58"
ASSETS_DIR = r"c:\Users\User\Documents\ChatGPT\go w go\assets"

TARGET_W = 1448
TARGET_H = 1086

ITEMS = [
    ("thunder_halberd_fx_*.jpg", "thunder-halberd-fx-v1.png"),
    ("hammer_slam_fx_*.jpg", "hammer-fx-v3.png"),
    ("axe_cleave_fx_*.jpg", "axe-fx-v3.png"),
    ("tome_runes_fx_*.jpg", "tome-fx-v3.png"),
    ("scythe_reap_fx_*.jpg", "scythe-fx-v3.png"),
    ("solar_blade_fx_*.jpg", "blade-fx-v3.png"),
]

def clean_checkerboard(img_rgb):
    """
    Converts synthetic grey checkerboard background to true transparent alpha.
    The checkerboard consists of neutral greys where R ≈ G ≈ B with values around 100-165.
    Foreground art has saturated colors (fire, lightning, gold, purple, green)
    or dark ink outlines (R,G,B < 40).
    """
    arr = np.array(img_rgb, dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Calculate saturation / color deviation
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    chroma = max_c - min_c
    brightness = (r + g + b) / 3.0
    
    # Neutral grey checkerboard condition:
    # low chroma (< 18) and medium brightness (between 90 and 175)
    is_checker = (chroma < 18) & (brightness > 88) & (brightness < 178)
    
    # Horizontal grid separator lines in generated sheets (often dark brown/grey lines at row borders)
    # They are very thin horizontal lines near y ≈ 0.33, 0.66 or cell bottoms with low height
    
    # Build Alpha Channel:
    alpha = np.ones_like(brightness, dtype=np.float32) * 255.0
    
    # Soft thresholding for smooth edges
    alpha[is_checker] = 0.0
    
    # Also feather pixels close to the boundary to avoid fringe
    border_zone = (chroma < 26) & (brightness > 82) & (brightness < 182) & (~is_checker)
    # Ramp down alpha in border zone
    alpha[border_zone] = np.clip((chroma[border_zone] / 26.0) * 255.0, 0.0, 255.0)
    
    out = np.zeros((arr.shape[0], arr.shape[1], 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(arr, 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    
    return Image.fromarray(out)

def process_all():
    for pattern, out_name in ITEMS:
        matches = sorted(glob.glob(os.path.join(BRAIN_DIR, pattern)), key=os.path.getmtime, reverse=True)
        if not matches:
            print(f"No match for pattern: {pattern}")
            continue
        
        src_path = matches[0]
        print(f"Processing {os.path.basename(src_path)} -> {out_name}...")
        img = Image.open(src_path).convert('RGB')
        
        # Clean alpha
        cleaned = clean_checkerboard(img)
        
        # Resize to standard production dimensions (1448 x 1086) with Lanczos
        resized = cleaned.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
        
        out_path = os.path.join(ASSETS_DIR, out_name)
        resized.save(out_path)
        print(f"  Saved {out_path} ({os.path.getsize(out_path)} bytes, size={resized.size})")

if __name__ == "__main__":
    process_all()
