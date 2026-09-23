"""
Repack Orb and Grimoire (Tome) into standardized 1536x256 6-frame horizontal strips:
- assets/orb-fx-6f.png (6 cells of 256x256)
- assets/tome-fx-6f.png (6 cells of 256x256)
- WebP versions in assets/optimized/
"""
import os
import numpy as np
from PIL import Image

ROOT = r"c:\Users\User\Documents\ChatGPT\go w go"
ASSETS = os.path.join(ROOT, "assets")
OPT = os.path.join(ASSETS, "optimized")

TARGET_CELL = 256
COLS = 6
STRIP_W = TARGET_CELL * COLS
STRIP_H = TARGET_CELL

def repack_strip(src_path, out_png, out_webp, is_ground_anchored=False):
    im = Image.open(src_path).convert("RGBA")
    arr = np.array(im)
    w = arr.shape[1] // COLS
    h = arr.shape[0]
    
    out = Image.new("RGBA", (STRIP_W, STRIP_H), (0, 0, 0, 0))
    
    for c in range(COLS):
        cell = arr[:, c*w:(c+1)*w]
        a = cell[:, :, 3]
        ys, xs = np.where(a > 20)
        if len(xs) == 0:
            continue
        min_x, max_x = xs.min(), xs.max()
        min_y, max_y = ys.min(), ys.max()
        
        crop = cell[min_y:max_y+1, min_x:max_x+1]
        ch, cw = crop.shape[:2]
        
        # Scale into 224x224
        scale = min(224.0 / cw, 224.0 / ch, 1.0)
        nw = max(1, int(round(cw * scale)))
        nh = max(1, int(round(ch * scale)))
        
        c_img = Image.fromarray(crop, "RGBA").resize((nw, nh), Image.LANCZOS)
        
        pos_x = c * TARGET_CELL + (TARGET_CELL - nw) // 2
        if is_ground_anchored:
            pos_y = TARGET_CELL - nh - 14
        else:
            pos_y = (TARGET_CELL - nh) // 2
            
        out.paste(c_img, (pos_x, pos_y), c_img)
        print(f"{os.path.basename(out_png)} frame {c}: {cw}x{ch} -> {nw}x{nh} placed at ({pos_x}, {pos_y})")
        
    out.save(out_png)
    print(f"Saved: {out_png}")
    out.save(out_webp, "WEBP", quality=92)
    print(f"Saved: {out_webp}")

def main():
    print("--- Repacking Orb ---")
    repack_strip(
        os.path.join(ASSETS, "orb-fx-v2.png"),
        os.path.join(ASSETS, "orb-fx-6f.png"),
        os.path.join(OPT, "orb-fx-6f.webp"),
        is_ground_anchored=False
    )
    
    print("\n--- Repacking Tome (Grimoire) ---")
    repack_strip(
        os.path.join(ASSETS, "tome-fx-v2.png"),
        os.path.join(ASSETS, "tome-fx-6f.png"),
        os.path.join(OPT, "tome-fx-6f.webp"),
        is_ground_anchored=True
    )
    print("\nDone repacking!")

if __name__ == "__main__":
    main()
