"""
Process and clean 6-frame attack animation sheet for Blade from blade_pure_fx_v5.
Every frame has >30px of margin on all 4 sides with ZERO border touches or cell clipping.
Keys out pure magenta background (#FF00FF), thoroughly removes pink/magenta fringe,
despills golden glows, centers sprites into 256x256 cells.
"""
import os
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

BRAIN_DIR = r"C:\Users\User\.gemini\antigravity-ide\brain\61487e15-2b40-4a0f-b66f-55803fe84f8e"
ASSETS_DIR = r"c:\Users\User\Documents\ChatGPT\go w go\assets"
OPT_DIR = os.path.join(ASSETS_DIR, "optimized")

BLADE_RAW = os.path.join(BRAIN_DIR, "blade_pure_fx_v5_1790056963830.jpg")

TARGET_CELL = 256
TOTAL_FRAMES = 6
STRIP_W = TARGET_CELL * TOTAL_FRAMES  # 1536
STRIP_H = TARGET_CELL                 # 256

def extract_clean_blade_sprite(cell_rgb):
    """Cleanly key out magenta, eliminate any pink fringe, despill golden hues."""
    h, w, _ = cell_rgb.shape
    arr = cell_rgb.astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Distance from pure magenta [255, 0, 255]
    diff = np.sqrt((r - 255.0)**2 + (g - 0.0)**2 + (b - 255.0)**2)
    
    # Base alpha from distance: anything within 65 distance of magenta becomes 0
    # Between 65 and 110, smooth transition
    alpha = np.clip((diff - 65.0) / 45.0 * 255.0, 0.0, 255.0)
    
    # Strict pink/magenta detection:
    # Magenta/pink has: r > 100, b > 90, g < 140, r > g + 20, b > g + 15
    is_pink = (r > 90) & (b > 80) & (r > g + 15) & (b > g + 15)
    # If a pixel has high blue compared to green and is somewhat close to magenta, kill it
    diff_mag_kill = diff < 85.0
    alpha[is_pink & diff_mag_kill] = 0.0
    
    # Binary opening to eradicate any 1-2 pixel isolated floating artifacts
    strong = alpha > 40
    opened = ndi.binary_opening(strong, structure=np.ones((2, 2)))
    alpha[~opened] = 0.0
    
    # Despill: any edge pixel with residual magenta tint
    # For golden blade fx, true colors are gold/yellow/orange/white:
    # In gold/yellow: r is high, g is medium-high, b is LOW (or high only if white, where r~g~b).
    # If b > g, it is purely magenta spill from the background!
    out_r = r.copy()
    out_g = g.copy()
    out_b = b.copy()
    
    # Despill rule for gold FX: b should NEVER exceed g * 0.95 (except near white where g > 230)
    spill = (alpha > 0) & (out_b > out_g * 0.9) & (out_g < 235)
    out_b[spill] = np.minimum(out_b[spill], out_g[spill] * 0.6)
    
    # Extra check: any pixel where b > 100 and r > 150 and g < 120 is pink spill
    pink_fringe = (alpha > 0) & (out_r > 130) & (out_b > 90) & (out_g < 110)
    out_b[pink_fringe] = np.minimum(out_b[pink_fringe], out_g[pink_fringe] * 0.5)
    out_r[pink_fringe] = np.maximum(out_r[pink_fringe], out_g[pink_fringe] * 1.2 + 30)
    
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 0] = np.clip(out_r, 0, 255).astype(np.uint8)
    rgba[:, :, 1] = np.clip(out_g, 0, 255).astype(np.uint8)
    rgba[:, :, 2] = np.clip(out_b, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    return rgba

def process_blade():
    print("\n--- Processing BLADE Pure FX V5 Sheet ---")
    im = Image.open(BLADE_RAW).convert('RGB')
    arr = np.array(im)
    
    # Coordinates of 6 cells (3 cols x 2 rows in 1200x896)
    cw = 400
    ch = 448
    
    clean_frames = []
    for r_idx in range(2):
        for c_idx in range(3):
            cell = arr[r_idx*ch:(r_idx+1)*ch, c_idx*cw:(c_idx+1)*cw]
            rgba = extract_clean_blade_sprite(cell)
            clean_frames.append(rgba)
            
    out_strip = Image.new("RGBA", (STRIP_W, STRIP_H), (0, 0, 0, 0))
    
    for idx, rgba in enumerate(clean_frames):
        a = rgba[:, :, 3]
        ys, xs = np.where(a > 20)
        if len(xs) == 0:
            continue
        min_x, max_x = xs.min(), xs.max()
        min_y, max_y = ys.min(), ys.max()
        
        crop = rgba[min_y:max_y+1, min_x:max_x+1]
        c_h, c_w = crop.shape[:2]
        
        # Scale to fit comfortably within 220x220 (leaving ample margin)
        scale = min(220.0 / c_w, 220.0 / c_h, 1.0)
        new_w = max(1, int(round(c_w * scale)))
        new_h = max(1, int(round(c_h * scale)))
        
        c_img = Image.fromarray(crop, "RGBA").resize((new_w, new_h), Image.LANCZOS)
        
        pos_x = idx * TARGET_CELL + (TARGET_CELL - new_w) // 2
        pos_y = (TARGET_CELL - new_h) // 2
        
        out_strip.paste(c_img, (pos_x, pos_y), c_img)
        print(f"Blade frame {idx}: crop {c_w}x{c_h} -> {new_w}x{new_h} placed at ({pos_x}, {pos_y})")
        
    out_path = os.path.join(ASSETS_DIR, "blade-fx-6f.png")
    out_strip.save(out_path)
    print(f"Saved: {out_path} ({STRIP_W}x{STRIP_H})")
    
    # Check for any remaining pink fringe
    out_arr = np.array(out_strip)
    oa = out_arr[:, :, 3]
    or_ = out_arr[:, :, 0]
    og = out_arr[:, :, 1]
    ob = out_arr[:, :, 2]
    pink_rem = (oa > 10) & (or_ > 140) & (ob > 110) & (og < 100) & (or_ > og + 40) & (ob > og + 25)
    print(f"Total remaining pink fringe pixels across all frames: {np.sum(pink_rem)}")
    
    # Update atlas and webp
    atlas_path = os.path.join(ASSETS_DIR, "weapon-frames-v2.png")
    atlas = Image.open(atlas_path).convert("RGBA")
    clear_r1 = Image.new("RGBA", (STRIP_W, TARGET_CELL), (0, 0, 0, 0))
    atlas.paste(clear_r1, (0, 256))
    atlas.paste(out_strip, (0, 256), out_strip)
    atlas.save(atlas_path)
    print(f"Updated atlas: {atlas_path}")
    
    if os.path.exists(OPT_DIR):
        blade_webp = os.path.join(OPT_DIR, "blade-fx-6f.webp")
        out_strip.save(blade_webp, "WEBP", quality=92)
        atlas_webp = os.path.join(OPT_DIR, "weapon-frames-v2.webp")
        atlas.save(atlas_webp, "WEBP", quality=92)
        print(f"Updated webp files in {OPT_DIR}")

if __name__ == "__main__":
    process_blade()
