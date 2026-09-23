"""
Process and clean 6-frame attack animation strips for Spear and Bomb.
Keys out pure magenta background (#FF00FF), thoroughly removes pink/magenta fringe,
despills colors (jade green for spear, fiery orange/smoke for bomb),
and centers/aligns sprites into 256x256 cells.

Outputs:
- assets/spear-fx-6f.png (1536x256, 6 cells of 256x256)
- assets/bomb-fx-6f.png (1536x256, 6 cells of 256x256)
- WebP optimized versions in assets/optimized/
"""
import os
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

BRAIN_DIR = r"C:\Users\User\.gemini\antigravity-ide\brain\61487e15-2b40-4a0f-b66f-55803fe84f8e"
ASSETS_DIR = r"c:\Users\User\Documents\ChatGPT\go w go\assets"
OPT_DIR = os.path.join(ASSETS_DIR, "optimized")

SPEAR_RAW = os.path.join(BRAIN_DIR, "spear_thrust_compact_v3_1790057474208.jpg")
BOMB_RAW = os.path.join(BRAIN_DIR, "bomb_blast_fx_v1_1790057425426.jpg")

TARGET_CELL = 256
TOTAL_FRAMES = 6
STRIP_W = TARGET_CELL * TOTAL_FRAMES  # 1536
STRIP_H = TARGET_CELL                 # 256

def extract_clean_sprite(cell_rgb, mode='spear'):
    """Cleanly key out magenta, remove fringe, despill."""
    h, w, _ = cell_rgb.shape
    arr = cell_rgb.astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Distance from pure magenta [255, 0, 255]
    diff = np.sqrt((r - 255.0)**2 + (g - 0.0)**2 + (b - 255.0)**2)
    
    # Base alpha from distance
    alpha = np.clip((diff - 65.0) / 45.0 * 255.0, 0.0, 255.0)
    
    # Strict pink/magenta detection
    is_pink = (r > 90) & (b > 80) & (r > g + 15) & (b > g + 15)
    diff_mag_kill = diff < 85.0
    alpha[is_pink & diff_mag_kill] = 0.0
    
    # Binary opening to remove single floating pixels
    strong = alpha > 40
    opened = ndi.binary_opening(strong, structure=np.ones((2, 2)))
    alpha[~opened] = 0.0
    
    out_r = r.copy()
    out_g = g.copy()
    out_b = b.copy()
    
    if mode == 'spear':
        # True spear colors: emerald jade green (g is high, r and b low), steel tip (r~g~b), golden streaks (r,g high, b low)
        # Magenta spill has high b and high r, low g.
        # Despill: b should not exceed g * 0.9 unless white highlight (g > 220 and r > 220)
        spill = (alpha > 0) & (out_b > out_g * 0.85) & (out_g < 225)
        out_b[spill] = np.minimum(out_b[spill], out_g[spill] * 0.5)
        # Also curb red spill on green energy
        red_spill = (alpha > 0) & (out_r > out_g * 1.1) & (out_b > 60) & (out_g > 80)
        out_r[red_spill] = np.minimum(out_r[red_spill], out_g[red_spill] * 0.8)
    elif mode == 'bomb':
        # True bomb colors: orange fire (r high, g mid, b low), smoke (dark brown/gray, r~g~b or r slightly higher)
        # Magenta spill has high b and high r with low g
        # Despill rule: b should never exceed g * 1.05
        spill = (alpha > 0) & (out_b > out_g * 0.9) & (out_g < 220)
        out_b[spill] = np.minimum(out_b[spill], out_g[spill] * 0.5)
        pink_fringe = (alpha > 0) & (out_r > 120) & (out_b > 80) & (out_g < 110)
        out_b[pink_fringe] = np.minimum(out_b[pink_fringe], out_g[pink_fringe] * 0.4)
        
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 0] = np.clip(out_r, 0, 255).astype(np.uint8)
    rgba[:, :, 1] = np.clip(out_g, 0, 255).astype(np.uint8)
    rgba[:, :, 2] = np.clip(out_b, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    return rgba

def process_spear():
    print("\n--- Processing SPEAR 6-Frame Sheet ---")
    im = Image.open(SPEAR_RAW).convert('RGB')
    cw = 400
    ch = 298  # 3x3 grid in 1200x896
    
    # 6 selected progressive frames from the 3x3 grid:
    # Frame 0: (r0, c0) gather glint
    # Frame 1: (r0, c1) high speed lunge
    # Frame 2: (r0, c2) sonic impact ring
    # Frame 3: (r1, c0) diamond shield shockwave
    # Frame 4: (r1, c1) shatter shards
    # Frame 5: (r2, c2) dissolving jade smoke
    cells = [(0, 0), (0, 1), (0, 2), (1, 0), (1, 1), (2, 2)]
    
    clean_frames = []
    for r_idx, c_idx in cells:
        cell = np.array(im.crop((c_idx*cw, r_idx*ch, (c_idx+1)*cw, (r_idx+1)*ch)))
        rgba = extract_clean_sprite(cell, mode='spear')
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
        
        # Scale to fit comfortably within 230x210
        scale = min(230.0 / c_w, 210.0 / c_h, 1.0)
        new_w = max(1, int(round(c_w * scale)))
        new_h = max(1, int(round(c_h * scale)))
        
        c_img = Image.fromarray(crop, "RGBA").resize((new_w, new_h), Image.LANCZOS)
        
        pos_x = idx * TARGET_CELL + (TARGET_CELL - new_w) // 2
        pos_y = (TARGET_CELL - new_h) // 2
        
        out_strip.paste(c_img, (pos_x, pos_y), c_img)
        print(f"Spear frame {idx}: crop {c_w}x{c_h} -> {new_w}x{new_h} placed at ({pos_x}, {pos_y})")
        
    out_path = os.path.join(ASSETS_DIR, "spear-fx-6f.png")
    out_strip.save(out_path)
    print(f"Saved: {out_path} ({STRIP_W}x{STRIP_H})")
    
    if os.path.exists(OPT_DIR):
        out_strip.save(os.path.join(OPT_DIR, "spear-fx-6f.webp"), "WEBP", quality=92)
    return out_strip

def process_bomb():
    print("\n--- Processing BOMB 6-Frame Sheet ---")
    im = Image.open(BOMB_RAW).convert('RGB')
    cw = 400
    ch = 448  # 3x2 grid in 1200x896
    
    clean_frames = []
    for r_idx in range(2):
        for c_idx in range(3):
            cell = np.array(im.crop((c_idx*cw, r_idx*ch, (c_idx+1)*cw, (r_idx+1)*ch)))
            rgba = extract_clean_sprite(cell, mode='bomb')
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
        
        # Scale to fit comfortably within 224x224
        scale = min(224.0 / c_w, 224.0 / c_h, 1.0)
        new_w = max(1, int(round(c_w * scale)))
        new_h = max(1, int(round(c_h * scale)))
        
        c_img = Image.fromarray(crop, "RGBA").resize((new_w, new_h), Image.LANCZOS)
        
        pos_x = idx * TARGET_CELL + (TARGET_CELL - new_w) // 2
        # Ground anchor at bottom:
        pos_y = TARGET_CELL - new_h - 14
        
        out_strip.paste(c_img, (pos_x, pos_y), c_img)
        print(f"Bomb frame {idx}: crop {c_w}x{c_h} -> {new_w}x{new_h} placed at ({pos_x}, {pos_y})")
        
    out_path = os.path.join(ASSETS_DIR, "bomb-fx-6f.png")
    out_strip.save(out_path)
    print(f"Saved: {out_path} ({STRIP_W}x{STRIP_H})")
    
    if os.path.exists(OPT_DIR):
        out_strip.save(os.path.join(OPT_DIR, "bomb-fx-6f.webp"), "WEBP", quality=92)
    return out_strip

if __name__ == "__main__":
    process_spear()
    process_bomb()
    print("\nAll Done Successfully!")
