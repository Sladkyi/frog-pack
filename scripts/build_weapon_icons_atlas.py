#!/usr/bin/env python3
"""
Stitches all 55 weapon PNG icons into a master atlas:
assets/weapon-icons-atlas.png (1024 x 896, 8 columns x 7 rows, 128x128 each)
and creates the optimized WebP version in assets/optimized/.
"""
import os
import json
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
ICONS_DIR = os.path.join(ASSETS_DIR, "icons")
OPTIMIZED_DIR = os.path.join(ASSETS_DIR, "optimized")

COLS = 8
TILE_SIZE = 128
ATLAS_W = COLS * TILE_SIZE # 1024

import sys
sys.path.append(os.path.dirname(__file__))
from build_weapon_icons import ICONS

WEAPON_LIST = list(ICONS.keys()) # 55 items
ROWS = (len(WEAPON_LIST) + COLS - 1) // COLS # 7 rows
ATLAS_H = ROWS * TILE_SIZE # 896

def build_atlas():
    atlas = Image.new("RGBA", (ATLAS_W, ATLAS_H), (0, 0, 0, 0))
    atlas_map = {}

    for idx, wid in enumerate(WEAPON_LIST):
        r = idx // COLS
        c = idx % COLS
        x = c * TILE_SIZE
        y = r * TILE_SIZE

        atlas_map[wid] = {
            "x": x,
            "y": y,
            "w": TILE_SIZE,
            "h": TILE_SIZE,
            "col": c,
            "row": r
        }

        icon_path = os.path.join(ICONS_DIR, f"{wid}.png")
        if os.path.exists(icon_path):
            icon_img = Image.open(icon_path).convert("RGBA")
            icon_resized = icon_img.resize((TILE_SIZE, TILE_SIZE), Image.Resampling.LANCZOS)
            atlas.paste(icon_resized, (x, y), icon_resized)
            print(f"Pasted {wid} at ({x}, {y})")
        else:
            print(f"Warning: {icon_path} not found!")

    out_png = os.path.join(ASSETS_DIR, "weapon-icons-atlas.png")
    atlas.save(out_png, "PNG")
    print(f"Saved master atlas: {out_png} ({ATLAS_W}x{ATLAS_H})")

    out_webp = os.path.join(OPTIMIZED_DIR, "weapon-icons-atlas.webp")
    atlas.save(out_webp, "WEBP", quality=92, method=6)
    print(f"Saved optimized WebP: {out_webp}")

    # Write atlas map JSON
    map_path = os.path.join(ASSETS_DIR, "weapon-icons-map.json")
    with open(map_path, "w", encoding="utf-8") as f:
        json.dump(atlas_map, f, indent=2)
    print(f"Saved atlas map: {map_path}")

if __name__ == '__main__':
    build_atlas()
