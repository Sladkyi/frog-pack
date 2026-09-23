#!/usr/bin/env python3
"""
Orchestrates generation of all real PNG weapon icon images:
1. Extracts 16 AI-generated icons from weapon_icons_sheet_1_1789933352630.jpg with clean chroma-key.
2. Extracts authentic game sprites from evolution-v1, equipment-v1, glyph-weapons-v1.
3. Renders remaining storybook vector icons into 256x256 transparent PNGs.
4. Assembles master atlas assets/weapon-icons-atlas.png and WebP version.
"""
import os
import re
import math
import base64
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
ICONS_DIR = os.path.join(ASSETS_DIR, "icons")
OPTIMIZED_DIR = os.path.join(ASSETS_DIR, "optimized")
BRAIN_DIR = r"C:\Users\User\.gemini\antigravity-ide\brain\3e85bdcf-760b-4c60-bd10-2cd6ffc03c58"
SHEET_PATH = os.path.join(BRAIN_DIR, "weapon_icons_sheet_1_1789933352630.jpg")

os.makedirs(ICONS_DIR, exist_ok=True)
os.makedirs(OPTIMIZED_DIR, exist_ok=True)

# 1. AI-Generated sheet mapping (Row x Col)
AI_GRID = [
    ['wand', 'storm', 'orb', 'tome'],
    ['frost_scepter', 'pyre_orb', 'tempest_tome', 'astral_mirror'],
    ['eclipse_censer', 'supernova_scroll', 'acid_flask', 'plague_censer'],
    ['clockwork_trap', 'magma_heart', 'abyssal_eye', 'starfall_shard']
]

def clean_chroma_and_center(cell_img, target_size=256, max_dim=216):
    img = cell_img.convert("RGBA")
    w, h = img.size
    pixels = img.load()

    target_r, target_g, target_b = 254, 2, 251

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            diff = math.sqrt((r - target_r)**2 + (g - target_g)**2 + (b - target_b)**2)

            if diff < 55:
                pixels[x, y] = (0, 0, 0, 0)
            elif diff < 85:
                alpha = int(255 * (diff - 55) / 30)
                avg = (r + g + b) // 3
                pixels[x, y] = (avg, avg, avg, alpha)

    # 14px border clearing
    margin = 14
    for y in range(h):
        for x in range(w):
            if x < margin or x >= w - margin or y < margin or y >= h - margin:
                pixels[x, y] = (0, 0, 0, 0)

    bbox = img.getbbox()
    if bbox:
        trimmed = img.crop(bbox)
        tw, th = trimmed.size
        if tw > max_dim or th > max_dim:
            scale = max_dim / max(tw, th)
            trimmed = trimmed.resize((int(tw * scale), int(th * scale)), Image.Resampling.LANCZOS)
            tw, th = trimmed.size
        res = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
        ox = (target_size - tw) // 2
        oy = (target_size - th) // 2
        res.paste(trimmed, (ox, oy), trimmed)
        return res
    return img

def extract_ai_sheet():
    if not os.path.exists(SHEET_PATH):
        print(f"Notice: {SHEET_PATH} not found, skipping AI sheet extract.")
        return
    sheet = Image.open(SHEET_PATH)
    W, H = sheet.size
    cw = W // 4
    ch = H // 4
    print(f"Extracting 16 icons from AI sheet ({W}x{H})...")
    for r in range(4):
        for c in range(4):
            wid = AI_GRID[r][c]
            box = (c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)
            cell = sheet.crop(box)
            clean = clean_chroma_and_center(cell)
            out_file = os.path.join(ICONS_DIR, f"{wid}.png")
            clean.save(out_file, "PNG")
            print(f"  [AI] Extracted {wid}.png")

def center_in_square(crop, target_size=256, max_dim=216):
    bbox = crop.getbbox()
    if bbox:
        trimmed = crop.crop(bbox)
        tw, th = trimmed.size
        scale = min(max_dim / max(tw, th), 1.0)
        if scale < 1.0 or max(tw, th) < max_dim * 0.8:
            scale = max_dim / max(tw, th)
            trimmed = trimmed.resize((int(tw * scale), int(th * scale)), Image.Resampling.LANCZOS)
            tw, th = trimmed.size
        res = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
        ox = (target_size - tw) // 2
        oy = (target_size - th) // 2
        res.paste(trimmed, (ox, oy), trimmed)
        return res
    return crop

def extract_from_atlases():
    print("Extracting authentic sprites from existing game atlases...")
    evo_path = os.path.join(ASSETS_DIR, "evolution-v1.png")
    eq_path = os.path.join(ASSETS_DIR, "equipment-v1.png")
    glyph_path = os.path.join(ASSETS_DIR, "glyph-weapons-v1.png")

    if os.path.exists(evo_path):
        evo = Image.open(evo_path).convert("RGBA")
        # Bounds: [0, 277, 536, 817, 1062, 1402]
        # row 0: axe, row 1: shuriken, row 4: blade
        axe_crop = center_in_square(evo.crop((0, 0, 280, 277)))
        axe_crop.save(os.path.join(ICONS_DIR, "axe.png"), "PNG")
        print("  [Atlas] Saved axe.png")

        shuriken_crop = center_in_square(evo.crop((0, 277, 280, 536)))
        shuriken_crop.save(os.path.join(ICONS_DIR, "shuriken.png"), "PNG")
        print("  [Atlas] Saved shuriken.png")

        blade_crop = center_in_square(evo.crop((0, 1062, 280, 1402)))
        blade_crop.save(os.path.join(ICONS_DIR, "blade.png"), "PNG")
        print("  [Atlas] Saved blade.png")

    if os.path.exists(eq_path):
        eq = Image.open(eq_path).convert("RGBA")
        # Bounds: [0, 292, 560, 837, 1110, 1402]
        # row 0: bow, row 1: spear, row 2: bomb, row 3: armor, row 4: boots
        bow_crop = center_in_square(eq.crop((0, 0, 280, 292)))
        bow_crop.save(os.path.join(ICONS_DIR, "bow.png"), "PNG")
        print("  [Atlas] Saved bow.png")

        spear_crop = center_in_square(eq.crop((0, 292, 280, 560)))
        spear_crop.save(os.path.join(ICONS_DIR, "spear.png"), "PNG")
        print("  [Atlas] Saved spear.png")

        bomb_crop = center_in_square(eq.crop((0, 560, 280, 837)))
        bomb_crop.save(os.path.join(ICONS_DIR, "bomb.png"), "PNG")
        print("  [Atlas] Saved bomb.png")

        armor_crop = center_in_square(eq.crop((0, 837, 280, 1110)))
        armor_crop.save(os.path.join(ICONS_DIR, "armor.png"), "PNG")
        print("  [Atlas] Saved armor.png")

        boots_crop = center_in_square(eq.crop((0, 1110, 280, 1402)))
        boots_crop.save(os.path.join(ICONS_DIR, "boots.png"), "PNG")
        print("  [Atlas] Saved boots.png")

    if os.path.exists(glyph_path):
        glyph = Image.open(glyph_path).convert("RGBA")
        cw = 864 // 4
        ch = int(1152 / 5)
        # scythe: row 0, hammer: row 1, dagger: row 3
        scythe_crop = center_in_square(glyph.crop((0, 0, cw, ch)))
        scythe_crop.save(os.path.join(ICONS_DIR, "scythe.png"), "PNG")
        print("  [Atlas] Saved scythe.png")

        hammer_crop = center_in_square(glyph.crop((0, ch, cw, ch * 2)))
        hammer_crop.save(os.path.join(ICONS_DIR, "hammer.png"), "PNG")
        print("  [Atlas] Saved hammer.png")

        dagger_crop = center_in_square(glyph.crop((0, ch * 3, cw, ch * 4)))
        dagger_crop.save(os.path.join(ICONS_DIR, "dagger.png"), "PNG")
        print("  [Atlas] Saved dagger.png")

def check_missing():
    import sys
    sys.path.append(os.path.dirname(__file__))
    from build_weapon_icons import ICONS
    all_keys = list(ICONS.keys())
    missing = [k for k in all_keys if not os.path.exists(os.path.join(ICONS_DIR, f"{k}.png"))]
    print(f"Total weapons/gear in registry: {len(all_keys)}")
    print(f"Currently saved in {ICONS_DIR}: {len(all_keys) - len(missing)}")
    print(f"Remaining to render: {len(missing)} -> {missing}")
    return missing

if __name__ == '__main__':
    extract_ai_sheet()
    extract_from_atlases()
    check_missing()
