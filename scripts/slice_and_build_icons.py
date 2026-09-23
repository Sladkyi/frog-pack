#!/usr/bin/env python3
"""
Slices and chroma-keys weapon_icons_sheet_1_1789933352630.jpg into individual transparent PNGs.
"""
import os
import math
from PIL import Image

BRAIN_DIR = r"C:\Users\User\.gemini\antigravity-ide\brain\3e85bdcf-760b-4c60-bd10-2cd6ffc03c58"
SHEET_PATH = os.path.join(BRAIN_DIR, "weapon_icons_sheet_1_1789933352630.jpg")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

# Grid layout (4 cols x 4 rows)
GRID_WEAPONS = [
    ['wand', 'storm', 'orb', 'tome'],
    ['frost_scepter', 'pyre_orb', 'tempest_tome', 'astral_mirror'],
    ['eclipse_censer', 'supernova_scroll', 'acid_flask', 'plague_censer'],
    ['clockwork_trap', 'magma_heart', 'abyssal_eye', 'starfall_shard']
]

def clean_chroma(cell_img):
    img = cell_img.convert("RGBA")
    w, h = img.size
    pixels = img.load()

    # Magenta reference: (254, 2, 251)
    target_r, target_g, target_b = 254, 2, 251

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            diff = math.sqrt((r - target_r)**2 + (g - target_g)**2 + (b - target_b)**2)

            if diff < 55:
                pixels[x, y] = (0, 0, 0, 0)
            elif diff < 85:
                alpha = int(255 * (diff - 55) / 30)
                # Desaturate pink spill
                avg = (r + g + b) // 3
                pixels[x, y] = (avg, avg, avg, alpha)

    # Clean border margin (14px around each cell to remove neighboring icon spill)
    margin = 14
    for y in range(h):
        for x in range(w):
            if x < margin or x >= w - margin or y < margin or y >= h - margin:
                pixels[x, y] = (0, 0, 0, 0)

    # Trim bounding box
    bbox = img.getbbox()
    if bbox:
        trimmed = img.crop(bbox)
        # Center in square 256x256
        res = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        tw, th = trimmed.size
        # scale down slightly if needed to leave padding
        max_dim = 216
        if tw > max_dim or th > max_dim:
            scale = max_dim / max(tw, th)
            trimmed = trimmed.resize((int(tw * scale), int(th * scale)), Image.Resampling.LANCZOS)
            tw, th = trimmed.size
        ox = (256 - tw) // 2
        oy = (256 - th) // 2
        res.paste(trimmed, (ox, oy), trimmed)
        return res
    return img

def process_sheet():
    sheet = Image.open(SHEET_PATH)
    W, H = sheet.size
    cw = W // 4
    ch = H // 4

    print(f"Processing sheet {W}x{H}, cell: {cw}x{ch}...")
    for row in range(4):
        for col in range(4):
            weapon_id = GRID_WEAPONS[row][col]
            box = (col * cw, row * ch, (col + 1) * cw, (row + 1) * ch)
            cell = sheet.crop(box)
            clean = clean_chroma(cell)
            out_path = os.path.join(OUT_DIR, f"{weapon_id}.png")
            clean.save(out_path, "PNG")
            print(f"Saved {weapon_id}.png")

if __name__ == '__main__':
    process_sheet()
