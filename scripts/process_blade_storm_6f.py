"""
Process and clean 6-frame attack animation sheets for Blade and Storm Stone.
Keys out pure magenta background (#FF00FF), despills edge color,
centers and ground-aligns each sprite without any clipping or cut-off boxes.
Outputs:
- assets/blade-fx-6f.png (1536x256, 6 cells of 256x256)
- assets/storm-fx-6f.png (1536x256, 6 cells of 256x256)
- updates assets/weapon-frames-v2.png (row 1 for blade, row 3 for storm)
- builds corresponding .webp files in assets/optimized/
"""
import os
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

BRAIN_DIR = r"C:\Users\User\.gemini\antigravity-ide\brain\61487e15-2b40-4a0f-b66f-55803fe84f8e"
ASSETS_DIR = r"c:\Users\User\Documents\ChatGPT\go w go\assets"
OPT_DIR = os.path.join(ASSETS_DIR, "optimized")

BLADE_RAW = os.path.join(BRAIN_DIR, "blade_slash_fx_v1_1790054435509.jpg")
STORM_RAW = os.path.join(BRAIN_DIR, "storm_isolated_v5_1790054722918.jpg")

TARGET_CELL = 256
TOTAL_FRAMES = 6
STRIP_W = TARGET_CELL * TOTAL_FRAMES  # 1536
STRIP_H = TARGET_CELL                 # 256

def extract_clean_sprite(cell_rgb, despill_tone='gold'):
    """Key out magenta, remove fringe, despill, return RGBA crop and content bbox."""
    h, w, _ = cell_rgb.shape
    arr = cell_rgb.astype(np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    
    # Distance from pure magenta [255, 0, 255]
    diff = np.sqrt((r - 255.0)**2 + (g - 0.0)**2 + (b - 255.0)**2)
    
    # Continuous soft alpha falloff
    alpha = np.clip((diff - 42.0) / 28.0 * 255.0, 0.0, 255.0)
    
    # Hard magenta mask
    is_mag = (r > 130) & (b > 130) & (g < 95) & (r > g + 30) & (b > g + 30)
    alpha[is_mag] = 0.0
    
    # Binary opening to clear single-pixel floating speckles
    strong = alpha > 35
    opened = ndi.binary_opening(strong, structure=np.ones((2, 2)))
    alpha[~opened] = 0.0
    
    # Despill magenta from semi-transparent edge pixels
    semi = (alpha > 0) & (alpha < 255)
    out_r = r.copy()
    out_g = g.copy()
    out_b = b.copy()
    
    spill = semi & (out_r > out_g + 15) & (out_b > out_g + 15)
    if despill_tone == 'gold':
        # Push spilled pixels toward warm golden/orange
        out_r[spill] = np.maximum(out_r[spill], out_g[spill] * 1.1 + 40)
        out_b[spill] = np.minimum(out_b[spill], out_g[spill] * 0.7 + 20)
    elif despill_tone == 'cyan':
        # Push spilled pixels toward cool electric cyan/white
        out_b[spill] = np.maximum(out_b[spill], out_g[spill] * 1.1 + 50)
        out_r[spill] = np.minimum(out_r[spill], out_g[spill] * 0.8 + 20)
        
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, 0] = np.clip(out_r, 0, 255).astype(np.uint8)
    rgba[:, :, 1] = np.clip(out_g, 0, 255).astype(np.uint8)
    rgba[:, :, 2] = np.clip(out_b, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    
    # Smooth tip feathering on extreme right border of cell 3 if it touches col edge
    return rgba

def process_blade():
    print("\n--- Processing BLADE 6-Frame Sheet ---")
    im = Image.open(BLADE_RAW).convert('RGB')
    arr = np.array(im)
    
    # Coordinates of the 6 cells in the 1200x896 raw image
    # Note: cell 3 extends up to col 403, and cell 4 starts at col 490
    cell_slices = [
        # (y0, y1, x0, x1)
        (0, 448, 0, 400),      # Frame 0: gathering glint
        (0, 448, 400, 800),    # Frame 1: curving slash
        (0, 448, 800, 1200),   # Frame 2: impact crescent
        (448, 896, 0, 403),    # Frame 3: double crescent shockwave
        (448, 896, 490, 800),  # Frame 4: blade shards & light wisps
        (448, 896, 800, 1200)  # Frame 5: fading golden motes
    ]
    
    clean_frames = []
    for idx, (y0, y1, x0, x1) in enumerate(cell_slices):
        sub = arr[y0:y1, x0:x1]
        rgba = extract_clean_sprite(sub, despill_tone='gold')
        
        # Soften extreme right edge of cell 3 if needed
        if idx == 3:
            # columns 399..402 soft taper
            for cx in range(398, rgba.shape[1]):
                fade = (rgba.shape[1] - cx) / float(rgba.shape[1] - 398)
                rgba[:, cx, 3] = (rgba[:, cx, 3].astype(float) * fade).astype(np.uint8)
                
        clean_frames.append(rgba)
        
    # Find overall max bounds to scale harmoniously into 256x256
    # Let max dimension be ~228px so there is 14px safety padding minimum
    out_strip = Image.new("RGBA", (STRIP_W, STRIP_H), (0, 0, 0, 0))
    
    for idx, rgba in enumerate(clean_frames):
        a = rgba[:, :, 3]
        ys, xs = np.where(a > 20)
        if len(xs) == 0:
            continue
        min_x, max_x = xs.min(), xs.max()
        min_y, max_y = ys.min(), ys.max()
        
        crop = rgba[min_y:max_y+1, min_x:max_x+1]
        ch, cw = crop.shape[:2]
        
        # Determine scaling: target fits nicely within 220x220
        scale = min(220.0 / cw, 220.0 / ch, 1.0)
        new_w = max(1, int(round(cw * scale)))
        new_h = max(1, int(round(ch * scale)))
        
        c_img = Image.fromarray(crop, "RGBA").resize((new_w, new_h), Image.LANCZOS)
        
        # Center in cell horizontally, align vertically so slash moves dynamically
        # Ground line is around 75-80% height in game
        pos_x = idx * TARGET_CELL + (TARGET_CELL - new_w) // 2
        pos_y = (TARGET_CELL - new_h) // 2
        
        out_strip.paste(c_img, (pos_x, pos_y), c_img)
        print(f"Blade frame {idx}: crop {cw}x{ch} -> {new_w}x{new_h} placed at ({pos_x}, {pos_y})")
        
    out_path = os.path.join(ASSETS_DIR, "blade-fx-6f.png")
    out_strip.save(out_path)
    print(f"Saved: {out_path} ({STRIP_W}x{STRIP_H})")
    return out_strip

def process_storm():
    print("\n--- Processing STORM STONE 6-Frame Sheet ---")
    im = Image.open(STORM_RAW).convert('RGB')
    arr = np.array(im)
    
    # Coordinates in the 1200x896 raw image
    cell_slices = [
        (0, 448, 0, 400),      # Frame 0: electric sphere in sky
        (0, 448, 400, 800),    # Frame 1: lightning bolt descending
        (0, 448, 800, 1200),   # Frame 2: ground detonation starburst
        (448, 896, 0, 403),    # Frame 3: branching arcs on ground
        (448, 896, 403, 800),  # Frame 4: secondary jumping sparks
        (448, 896, 800, 1200)  # Frame 5: dissolving energy smoke
    ]
    
    clean_frames = []
    for idx, (y0, y1, x0, x1) in enumerate(cell_slices):
        sub = arr[y0:y1, x0:x1]
        rgba = extract_clean_sprite(sub, despill_tone='cyan')
        
        if idx == 3:
            # soften rightmost tip if needed
            for cx in range(398, rgba.shape[1]):
                fade = (rgba.shape[1] - cx) / float(rgba.shape[1] - 398)
                rgba[:, cx, 3] = (rgba[:, cx, 3].astype(float) * fade).astype(np.uint8)
                
        clean_frames.append(rgba)
        
    out_strip = Image.new("RGBA", (STRIP_W, STRIP_H), (0, 0, 0, 0))
    
    # Special vertical alignment for storm:
    # Frame 0 is high in sky (anchor towards top)
    # Frame 1 descends through the middle
    # Frame 2, 3, 4, 5 are grounded at the bottom (anchor towards bottom)
    for idx, rgba in enumerate(clean_frames):
        a = rgba[:, :, 3]
        ys, xs = np.where(a > 20)
        if len(xs) == 0:
            continue
        min_x, max_x = xs.min(), xs.max()
        min_y, max_y = ys.min(), ys.max()
        
        crop = rgba[min_y:max_y+1, min_x:max_x+1]
        ch, cw = crop.shape[:2]
        
        # Fits within 224x224
        scale = min(224.0 / cw, 224.0 / ch, 1.0)
        new_w = max(1, int(round(cw * scale)))
        new_h = max(1, int(round(ch * scale)))
        
        c_img = Image.fromarray(crop, "RGBA").resize((new_w, new_h), Image.LANCZOS)
        
        pos_x = idx * TARGET_CELL + (TARGET_CELL - new_w) // 2
        
        if idx == 0:
            # Sphere high in sky
            pos_y = 24
        elif idx == 1:
            # Bolt spanning sky to near ground
            pos_y = 16
        elif idx == 2:
            # Ground starburst
            pos_y = TARGET_CELL - new_h - 12
        elif idx == 3:
            # Branching arcs on ground
            pos_y = TARGET_CELL - new_h - 10
        elif idx == 4:
            # Crackling sparks on ground
            pos_y = TARGET_CELL - new_h - 10
        else:
            # Rising fading smoke
            pos_y = TARGET_CELL - new_h - 16
            
        out_strip.paste(c_img, (pos_x, pos_y), c_img)
        print(f"Storm frame {idx}: crop {cw}x{ch} -> {new_w}x{new_h} placed at ({pos_x}, {pos_y})")
        
    out_path = os.path.join(ASSETS_DIR, "storm-fx-6f.png")
    out_strip.save(out_path)
    print(f"Saved: {out_path} ({STRIP_W}x{STRIP_H})")
    return out_strip

def update_weapon_frames_atlas(blade_strip, storm_strip):
    atlas_path = os.path.join(ASSETS_DIR, "weapon-frames-v2.png")
    print(f"\n--- Updating {atlas_path} ---")
    atlas = Image.open(atlas_path).convert("RGBA")
    print(f"Original atlas size: {atlas.size}")
    
    # Row 0 (y: 0..256): Wand / Beam (or keep existing)
    # Row 1 (y: 256..512): Blade (6 frames)
    # Row 2 (y: 512..768): Shuriken (6 frames)
    # Row 3 (y: 768..1024): Storm (6 frames)
    
    # Paste blade into row 1
    # Clear row 1 region first
    clear_r1 = Image.new("RGBA", (STRIP_W, TARGET_CELL), (0, 0, 0, 0))
    atlas.paste(clear_r1, (0, 256))
    atlas.paste(blade_strip, (0, 256), blade_strip)
    print("Pasted clean 6-frame Blade into Row 1 (y: 256..512)")
    
    # Paste storm into row 3
    clear_r3 = Image.new("RGBA", (STRIP_W, TARGET_CELL), (0, 0, 0, 0))
    atlas.paste(clear_r3, (0, 768))
    atlas.paste(storm_strip, (0, 768), storm_strip)
    print("Pasted clean 6-frame Storm into Row 3 (y: 768..1024)")
    
    atlas.save(atlas_path)
    print(f"Updated atlas: {atlas_path}")
    
    # Update optimized webp
    if os.path.exists(OPT_DIR):
        atlas_webp = os.path.join(OPT_DIR, "weapon-frames-v2.webp")
        atlas.save(atlas_webp, "WEBP", quality=92)
        print(f"Updated webp: {atlas_webp}")
        
        blade_webp = os.path.join(OPT_DIR, "blade-fx-6f.webp")
        blade_strip.save(blade_webp, "WEBP", quality=92)
        print(f"Updated webp: {blade_webp}")
        
        storm_webp = os.path.join(OPT_DIR, "storm-fx-6f.webp")
        storm_strip.save(storm_webp, "WEBP", quality=92)
        print(f"Updated webp: {storm_webp}")

if __name__ == "__main__":
    blade_strip = process_blade()
    storm_strip = process_storm()
    update_weapon_frames_atlas(blade_strip, storm_strip)
    print("\nAll Done Successfully!")
