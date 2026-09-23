import os
import glob
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

BRAIN_DIR = r"C:\Users\User\.gemini\antigravity-ide\brain\61487e15-2b40-4a0f-b66f-55803fe84f8e"
ASSETS_DIR = r"c:\Users\User\Documents\ChatGPT\go w go\assets"

TARGET_W = 1448
TARGET_H = 1086

# All attack sheets to process
ITEMS = [
    ("frost_glacier_fx_v3_*.jpg", "frost-glacier-fx-v1.png"),
    ("supernova_solar_fx_v4_*.jpg", "supernova-solar-fx-v1.png"),
    ("dragon_inferno_fx_v3_*.jpg", "dragon-inferno-fx-v1.png"),
    ("shuriken_slash_fx_*.jpg", "shuriken-fx-v1.png"),
]

def clean_and_repack_sheet(src_path, out_path):
    print(f"\n==========================================")
    print(f"Processing {os.path.basename(src_path)} -> {os.path.basename(out_path)}")
    im = Image.open(src_path).convert('RGB')
    arr = np.array(im, dtype=np.float32)
    h, w, _ = arr.shape
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]

    # 1. Background classification:
    # Pure magenta background has high R, high B, low G
    is_magenta = (r > 100) & (b > 80) & (g < 110) & (r > g + 25) & (b > g + 20)

    # Automatically detect grid divider lines and cell borders:
    # Lines with high dark counts across x or y
    is_dark = (r < 110) & (g < 110) & (b < 110)
    x_counts = np.sum(is_dark, axis=0)
    y_counts = np.sum(is_dark, axis=1)

    grid_mask = np.zeros((h, w), dtype=bool)
    # Mark x columns that are border lines (counts > 30% of height)
    for x in range(w):
        if x_counts[x] > h * 0.35:
            grid_mask[:, max(0, x-2):min(w, x+3)] = True

    # Mark y rows that are border lines (counts > 30% of width)
    for y in range(h):
        if y_counts[y] > w * 0.35:
            grid_mask[max(0, y-2):min(h, y+3), :] = True

    # Also include standard theoretical boundaries
    cw_f = w / 4.0
    ch_f = h / 3.0
    for i in range(5):
        cx = int(round(i * cw_f))
        grid_mask[:, max(0, cx-6):min(w, cx+7)] = True
    for j in range(4):
        cy = int(round(j * ch_f))
        grid_mask[max(0, cy-6):min(h, cy+7), :] = True

    is_border = grid_mask & (is_dark | is_magenta)
    bg_mask = is_magenta | is_border

    # Build continuous alpha:
    # Distance from pure magenta [254, 2, 251]
    diff = np.sqrt((r - 254)**2 + (g - 2)**2 + (b - 251)**2)
    
    alpha = np.clip((diff - 42.0) / 32.0 * 255.0, 0.0, 255.0)
    alpha[bg_mask] = 0.0

    # Clean up stray single pixels: morphological binary opening on alpha > 30
    binary_alpha = alpha > 30
    opened = ndi.binary_opening(binary_alpha, structure=np.ones((2, 2)))
    alpha[~opened] = 0.0

    # Despill magenta from remaining border pixels
    semi = (alpha > 0) & (alpha < 255)
    out_r = r.copy()
    out_g = g.copy()
    out_b = b.copy()
    spill = semi & (out_r > out_g + 18) & (out_b > out_g + 14)
    out_r[spill] = np.minimum(out_r[spill], out_g[spill] * 1.3 + 30)
    out_b[spill] = np.minimum(out_b[spill], out_g[spill] * 1.3 + 30)

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 0] = np.clip(out_r, 0, 255).astype(np.uint8)
    rgba[:, :, 1] = np.clip(out_g, 0, 255).astype(np.uint8)
    rgba[:, :, 2] = np.clip(out_b, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)

    # 2. Perfect per-cell repack to match production grid (4 cols x 3 rows = 12 cells of 362x362)
    target_cw = TARGET_W // 4  # 362
    target_ch = TARGET_H // 3  # 362
    final_sheet = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))

    src_cw = w // 4
    src_ch = h // 3

    for row_idx in range(3):
        for col_idx in range(4):
            # Extract raw cell
            x0 = col_idx * src_cw
            y0 = row_idx * src_ch
            x1 = (col_idx + 1) * src_cw if col_idx < 3 else w
            y1 = (row_idx + 1) * src_ch if row_idx < 2 else h

            cell_rgba = rgba[y0:y1, x0:x1]
            cell_alpha = cell_rgba[:, :, 3]

            # Clear 10px margin inside cell_rgba to avoid any line artifacts
            cell_alpha[:10, :] = 0
            cell_alpha[-10:, :] = 0
            cell_alpha[:, :10] = 0
            cell_alpha[:, -10:] = 0

            ys, xs = np.where(cell_alpha > 20)
            if len(xs) == 0:
                print(f"  Frame {row_idx * 4 + col_idx + 1} (Cell {row_idx},{col_idx}): EMPTY")
                continue

            bx0, bx1 = xs.min(), xs.max() + 1
            by0, by1 = ys.min(), ys.max() + 1

            # Crop content with 3px safety pad
            crop_x0 = max(0, bx0 - 3)
            crop_y0 = max(0, by0 - 3)
            crop_x1 = min(cell_rgba.shape[1], bx1 + 3)
            crop_y1 = min(cell_rgba.shape[0], by1 + 3)

            crop_arr = cell_rgba[crop_y0:crop_y1, crop_x0:crop_x1]
            crop_img = Image.fromarray(crop_arr, "RGBA")

            # Scale to fit inside 362x362 with generous margin (max 300x300)
            max_inner = int(target_cw * 0.83)
            cur_w, cur_h = crop_img.size
            scale = min(1.0, max_inner / max(cur_w, cur_h))
            scale = min(scale, 1.25)

            new_w = max(1, int(round(cur_w * scale)))
            new_h = max(1, int(round(cur_h * scale)))
            scaled_crop = crop_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Center horizontally and vertically in cell
            dest_cell_x = col_idx * target_cw
            dest_cell_y = row_idx * target_ch

            paste_x = dest_cell_x + (target_cw - new_w) // 2
            paste_y = dest_cell_y + (target_ch - new_h) // 2

            final_sheet.paste(scaled_crop, (paste_x, paste_y), scaled_crop)
            print(f"  Frame {row_idx * 4 + col_idx + 1}: Content {cur_w}x{cur_h} -> {new_w}x{new_h} at ({paste_x}, {paste_y})")

    final_sheet.save(out_path, format="PNG")
    print(f"Saved {out_path} ({os.path.getsize(out_path)} bytes)")

def main():
    for pattern, out_name in ITEMS:
        matches = sorted(glob.glob(os.path.join(BRAIN_DIR, pattern)), key=os.path.getmtime, reverse=True)
        if not matches:
            print(f"No match for pattern: {pattern}")
            continue
        src = matches[0]
        dst = os.path.join(ASSETS_DIR, out_name)
        clean_and_repack_sheet(src, dst)

if __name__ == "__main__":
    main()
