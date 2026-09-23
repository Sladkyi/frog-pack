"""Generate 20 distinct, beautifully illustrated fantasy biome backgrounds for PACK / RUN.
Matches the dimensions (1774x887, 2:1 ratio), perspective, horizontal ground line at y=79%,
and cartoon storybook ink-outline art style of forest-v2.png.
"""
from PIL import Image, ImageDraw, ImageFilter
import math
import random
import os

SW, SH = 1774, 887
# Supersampling factor for ultra-crisp antialiased outlines and smooth gradients
SCALE = 2
W, H = SW * SCALE, SH * SCALE
GROUND_Y = int(H * 0.79)
PATH_TOP = int(H * 0.77)
PATH_BOT = int(H * 0.88)

INK = (36, 26, 20)          # Classic dark sepia ink outline
INK_COOL = (22, 28, 38)     # Cool dark navy ink outline
INK_WARM = (45, 18, 12)     # Deep reddish-brown ink outline

def make_gradient(width, height, stops):
    """Create a smooth vertical gradient image."""
    base = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(base)
    # stops is list of (pos 0..1, (R, G, B))
    for y in range(height):
        t = y / height
        # find segment
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i+1]
            if t0 <= t <= t1:
                factor = (t - t0) / (t1 - t0) if t1 > t0 else 0
                r = int(c0[0] + (c1[0] - c0[0]) * factor)
                g = int(c0[1] + (c1[1] - c0[1]) * factor)
                b = int(c0[2] + (c1[2] - c0[2]) * factor)
                draw.line([(0, y), (width, y)], fill=(r, g, b))
                break
    return base

def draw_poly(draw, points, fill, outline=None, width=1):
    draw.polygon(points, fill=fill)
    if outline:
        draw.line(points + [points[0]], fill=outline, width=width)

def add_glow(im, cx, cy, radius, color, alpha=140):
    glow_box = (max(0, cx - radius), max(0, cy - radius), min(im.width, cx + radius), min(im.height, cy + radius))
    bw = glow_box[2] - glow_box[0]
    bh = glow_box[3] - glow_box[1]
    if bw <= 0 or bh <= 0: return
    glow = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([cx - radius - glow_box[0], cy - radius - glow_box[1],
                   cx + radius - glow_box[0], cy + radius - glow_box[1]],
                  fill=(color[0], color[1], color[2], alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 3))
    im.paste(glow, glow_box[:2], glow)

def add_light_shaft(im, top_x1, top_x2, bot_x1, bot_x2, color=(255, 250, 210), alpha=35):
    overlay = Image.new('RGBA', im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.polygon([(top_x1, 0), (top_x2, 0), (bot_x2, GROUND_Y), (bot_x1, GROUND_Y)],
                 fill=(color[0], color[1], color[2], alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(SCALE * 12))
    im.paste(overlay, (0, 0), overlay)

def draw_standard_ground(draw, bg_fill, path_fill, fore_fill, ink_color=INK, decor='grass'):
    # Base ground from GROUND_Y to H
    draw_poly(draw, [(0, GROUND_Y), (W, GROUND_Y), (W, H), (0, H)], fill=bg_fill, outline=ink_color, width=SCALE*2)
    # Walking path
    path_poly = [
        (0, PATH_TOP), (W*0.18, PATH_TOP - SCALE*3), (W*0.38, PATH_TOP + SCALE*2),
        (W*0.62, PATH_TOP - SCALE*2), (W*0.82, PATH_TOP + SCALE*3), (W, PATH_TOP),
        (W, PATH_BOT), (0, PATH_BOT)
    ]
    draw_poly(draw, path_poly, fill=path_fill, outline=ink_color, width=SCALE*2)
    # Lower foreground rim
    draw_poly(draw, [(0, PATH_BOT + SCALE*6), (W, PATH_BOT + SCALE*6), (W, H), (0, H)], fill=fore_fill, outline=ink_color, width=SCALE*2)

    # Decorative foreground clumps
    if decor == 'grass':
        for i in range(0, W, SCALE * 38):
            px = i + (i % 7) * SCALE * 4
            draw.line([(px, PATH_BOT + SCALE*7), (px - SCALE*5, PATH_BOT + SCALE*1), (px + SCALE*3, PATH_BOT + SCALE*14)], fill=ink_color, width=SCALE*2)
    elif decor == 'stones':
        for i in range(0, W, SCALE * 65):
            px = i + (i % 5) * SCALE * 8
            py = PATH_BOT + SCALE*10
            draw.ellipse([px - SCALE*6, py - SCALE*3, px + SCALE*6, py + SCALE*3], fill=path_fill, outline=ink_color, width=SCALE*2)
    elif decor == 'snow':
        for i in range(0, W, SCALE * 45):
            px = i + (i % 6) * SCALE * 6
            py = PATH_TOP - SCALE*4
            draw.arc([px - SCALE*12, py, px + SCALE*12, py + SCALE*8], 180, 360, fill=(255, 255, 255), width=SCALE*3)

# -------------------------------------------------------------------------------------------------
# BIOME GENERATORS
# -------------------------------------------------------------------------------------------------

def gen_01_forest():
    """1. Сумеречный лес (Forest / Enchanted Woodland)"""
    sky = make_gradient(W, H, [(0, (26, 52, 48)), (0.45, (68, 102, 78)), (0.75, (132, 148, 98)), (1.0, (110, 128, 80))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Distant leafy hills
    draw_poly(draw, [(0, H*0.42), (W*0.25, H*0.35), (W*0.5, H*0.44), (W*0.75, H*0.36), (W, H*0.43), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(52, 85, 70), outline=INK, width=SCALE*2)
    draw_poly(draw, [(0, H*0.55), (W*0.3, H*0.48), (W*0.65, H*0.58), (W, H*0.50), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(68, 108, 78), outline=INK, width=SCALE*2)

    # Gnarled canopy trunks
    for tx in [W*0.08, W*0.24, W*0.45, W*0.68, W*0.88]:
        tw = SCALE * 36
        draw.polygon([(tx - tw, GROUND_Y), (tx - tw*0.6, H*0.1), (tx + tw*0.6, H*0.1), (tx + tw, GROUND_Y)], fill=(88, 72, 50))
        draw.line([(tx - tw, GROUND_Y), (tx - tw*0.6, H*0.1)], fill=INK, width=SCALE*3)
        draw.line([(tx + tw, GROUND_Y), (tx + tw*0.6, H*0.1)], fill=INK, width=SCALE*3)
        # Branches & leaves
        for bx in [-tw*2, tw*2]:
            draw.ellipse([tx + bx - SCALE*60, H*0.08, tx + bx + SCALE*60, H*0.28], fill=(95, 138, 75), outline=INK, width=SCALE*2)

    # Sunbeams
    add_light_shaft(im, W*0.35, W*0.42, W*0.25, W*0.45, color=(255, 245, 170), alpha=38)
    add_light_shaft(im, W*0.72, W*0.78, W*0.62, W*0.82, color=(255, 245, 170), alpha=32)

    draw_standard_ground(draw, (74, 98, 54), (178, 142, 86), (42, 58, 36), INK, 'grass')
    return im

def gen_02_mountains():
    """2. Горный перевал (Mountain Peaks / Alpine Ridges)"""
    sky = make_gradient(W, H, [(0, (45, 75, 125)), (0.35, (120, 160, 205)), (0.65, (225, 200, 180)), (1.0, (180, 160, 140))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Sun glow behind peaks
    add_glow(im, int(W*0.68), int(H*0.32), SCALE*140, (255, 220, 140), 90)

    # Distant violet mountain range
    draw_poly(draw, [(0, H*0.52), (W*0.15, H*0.22), (W*0.32, H*0.48), (W*0.52, H*0.18), (W*0.72, H*0.45), (W*0.86, H*0.26), (W, H*0.48), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(125, 135, 175), outline=INK_COOL, width=SCALE*2)
    # Snow on distant peaks
    draw_poly(draw, [(W*0.15, H*0.22), (W*0.11, H*0.30), (W*0.19, H*0.29)], fill=(240, 245, 255))
    draw_poly(draw, [(W*0.52, H*0.18), (W*0.46, H*0.28), (W*0.58, H*0.27)], fill=(240, 245, 255))

    # Midground sharp rocky ridges
    draw_poly(draw, [(0, H*0.58), (W*0.22, H*0.34), (W*0.45, H*0.62), (W*0.68, H*0.36), (W*0.9, H*0.58), (W, H*0.48), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(90, 100, 115), outline=INK, width=SCALE*3)
    # Lit facets of ridges
    draw_poly(draw, [(W*0.22, H*0.34), (W*0.35, H*0.62), (W*0.45, H*0.62)], fill=(135, 148, 165))
    draw_poly(draw, [(W*0.68, H*0.36), (W*0.8, H*0.58), (W*0.9, H*0.58)], fill=(145, 155, 170))

    # Alpine pine tree silhouettes
    for px in [W*0.08, W*0.14, W*0.38, W*0.42, W*0.62, W*0.84, W*0.94]:
        pw = SCALE * 16
        ph = SCALE * 85
        py = int(GROUND_Y - SCALE*10)
        draw.polygon([(px, py - ph), (px - pw, py), (px + pw, py)], fill=(40, 65, 55), outline=INK, width=SCALE*2)
        draw.polygon([(px, py - ph*1.2), (px - pw*0.7, py - ph*0.4), (px + pw*0.7, py - ph*0.4)], fill=(48, 75, 62), outline=INK, width=SCALE*2)

    draw_standard_ground(draw, (110, 115, 112), (185, 175, 155), (75, 78, 76), INK, 'stones')
    return im

def gen_03_brook():
    """3. Лесной ручеек (Forest Brook / River Creek & Wooden Bridge)"""
    sky = make_gradient(W, H, [(0, (40, 78, 65)), (0.45, (85, 130, 95)), (0.75, (160, 190, 140)), (1.0, (140, 170, 120))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Soft woodland hills
    draw_poly(draw, [(0, H*0.45), (W*0.35, H*0.38), (W*0.7, H*0.48), (W, H*0.40), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(72, 115, 82), outline=INK, width=SCALE*2)

    # Winding stream in background
    stream_pts = [(W*0.48, H*0.48), (W*0.52, H*0.48), (W*0.58, GROUND_Y), (W*0.38, GROUND_Y)]
    draw_poly(draw, stream_pts, fill=(80, 160, 185), outline=INK, width=SCALE*2)
    # Stream water shimmer
    for y_s in range(int(H*0.52), GROUND_Y, SCALE*12):
        draw.line([(W*0.44 + (y_s % 20)*SCALE, y_s), (W*0.52 + (y_s % 20)*SCALE, y_s)], fill=(160, 220, 240), width=SCALE*2)

    # Wooden bridge structure across the stream
    bx1, bx2 = W*0.32, W*0.66
    by = int(GROUND_Y - SCALE*18)
    draw_poly(draw, [(bx1, by), (bx2, by), (bx2, by + SCALE*18), (bx1, by + SCALE*18)], fill=(125, 85, 50), outline=INK, width=SCALE*3)
    # Bridge railing and posts
    draw.line([(bx1, by - SCALE*24), (bx2, by - SCALE*24)], fill=(155, 105, 60), width=SCALE*4)
    draw.line([(bx1, by - SCALE*24), (bx2, by - SCALE*24)], fill=INK, width=SCALE*1)
    for rx in [bx1 + SCALE*15, (bx1+bx2)/2, bx2 - SCALE*15]:
        draw.line([(rx, by - SCALE*24), (rx, by)], fill=(110, 75, 45), width=SCALE*5)
        draw.line([(rx, by - SCALE*24), (rx, by)], fill=INK, width=SCALE*2)

    # Riverside weeping willows
    for wx in [W*0.14, W*0.86]:
        draw.ellipse([wx - SCALE*80, H*0.15, wx + SCALE*80, H*0.55], fill=(85, 140, 75), outline=INK, width=SCALE*2)

    draw_standard_ground(draw, (92, 125, 68), (195, 165, 105), (55, 85, 48), INK, 'stones')
    return im

def gen_04_market():
    """4. Средневековый рынок (Medieval Market Square / Stalls & Banners)"""
    sky = make_gradient(W, H, [(0, (65, 95, 140)), (0.4, (140, 170, 205)), (0.75, (230, 215, 185)), (1.0, (210, 195, 160))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Distant town spires and slate rooftops
    draw_poly(draw, [(0, H*0.52), (W*0.1, H*0.38), (W*0.15, H*0.52), (W*0.28, H*0.32), (W*0.32, H*0.18), (W*0.36, H*0.32),
                     (W*0.52, H*0.48), (W*0.68, H*0.28), (W*0.72, H*0.48), (W*0.85, H*0.36), (W, H*0.52), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(135, 120, 130), outline=INK, width=SCALE*2)

    # Medieval timber-framed buildings & shopfronts
    for bx in [W*0.06, W*0.82]:
        bw = SCALE * 95
        draw_poly(draw, [(bx - bw, GROUND_Y), (bx - bw, H*0.25), (bx, H*0.14), (bx + bw, H*0.25), (bx + bw, GROUND_Y)],
                  fill=(220, 205, 175), outline=INK, width=SCALE*3)
        # Timber beams (crosses)
        draw.line([(bx - bw, H*0.25), (bx + bw, H*0.45)], fill=(90, 55, 35), width=SCALE*4)
        draw.line([(bx - bw, H*0.45), (bx + bw, H*0.25)], fill=(90, 55, 35), width=SCALE*4)

    # Merchant stalls with striped awnings in midground
    stalls = [
        (W*0.26, SCALE*80, (215, 60, 50), (245, 240, 220)),
        (W*0.48, SCALE*90, (40, 110, 180), (245, 240, 220)),
        (W*0.70, SCALE*80, (220, 150, 40), (70, 120, 60))
    ]
    for sx, sw, c1, c2 in stalls:
        sy = int(GROUND_Y - SCALE*75)
        # Stall posts
        draw.line([(sx - sw/2 + SCALE*8, sy + SCALE*25), (sx - sw/2 + SCALE*8, GROUND_Y)], fill=(110, 75, 45), width=SCALE*5)
        draw.line([(sx + sw/2 - SCALE*8, sy + SCALE*25), (sx + sw/2 - SCALE*8, GROUND_Y)], fill=(110, 75, 45), width=SCALE*5)
        # Striped awning
        stripes = 6
        step = sw / stripes
        for st in range(stripes):
            col = c1 if st % 2 == 0 else c2
            draw_poly(draw, [(sx - sw/2 + st*step, sy), (sx - sw/2 + (st+1)*step, sy),
                             (sx - sw/2 + (st+1)*step + SCALE*6, sy + SCALE*28), (sx - sw/2 + st*step + SCALE*6, sy + SCALE*28)],
                      fill=col, outline=INK, width=SCALE*2)
        # Barrels & crates
        draw.rectangle([sx - SCALE*18, GROUND_Y - SCALE*22, sx + SCALE*18, GROUND_Y], fill=(145, 95, 55), outline=INK, width=SCALE*2)

    # Pennants & hanging flags
    for fx in [W*0.35, W*0.58]:
        draw.line([(fx - SCALE*40, H*0.3), (fx + SCALE*40, H*0.32)], fill=INK, width=SCALE*2)
        draw.polygon([(fx - SCALE*15, H*0.31), (fx - SCALE*5, H*0.37), (fx + SCALE*5, H*0.31)], fill=(220, 60, 50))

    draw_standard_ground(draw, (140, 130, 120), (195, 185, 165), (105, 95, 88), INK, 'stones')
    return im

def gen_05_castle():
    """5. Залы замка (Castle Great Hall / Vaulted Arches & Stained Glass)"""
    sky = make_gradient(W, H, [(0, (18, 16, 26)), (0.5, (38, 34, 48)), (0.8, (55, 48, 62)), (1.0, (45, 38, 52))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Great Gothic pointed stone arches
    for ax in [W*0.2, W*0.5, W*0.8]:
        aw = SCALE * 95
        # Stained glass window inside arch
        draw_poly(draw, [(ax - aw*0.6, H*0.55), (ax - aw*0.6, H*0.22), (ax, H*0.12), (ax + aw*0.6, H*0.22), (ax + aw*0.6, H*0.55)],
                  fill=(50, 95, 145), outline=INK, width=SCALE*3)
        # Rose stained glass segments
        draw.ellipse([ax - SCALE*24, H*0.18, ax + SCALE*24, H*0.28], fill=(180, 50, 70), outline=INK, width=SCALE*2)
        # Stained glass light beam
        add_light_shaft(im, ax - SCALE*20, ax + SCALE*20, ax - SCALE*60, ax + SCALE*60, color=(140, 180, 255), alpha=45)

    # Colossal carved stone pillars
    for px in [W*0.08, W*0.35, W*0.65, W*0.92]:
        pw = SCALE * 38
        draw_poly(draw, [(px - pw, GROUND_Y), (px - pw, 0), (px + pw, 0), (px + pw, GROUND_Y)],
                  fill=(115, 105, 118), outline=INK, width=SCALE*3)
        # Pillar capital and base
        draw.rectangle([px - pw*1.3, GROUND_Y - SCALE*20, px + pw*1.3, GROUND_Y], fill=(145, 135, 148), outline=INK, width=SCALE*2)
        draw.rectangle([px - pw*1.3, SCALE*35, px + pw*1.3, SCALE*55], fill=(145, 135, 148), outline=INK, width=SCALE*2)
        # Torch sconce on pillar
        draw.rectangle([px - SCALE*4, H*0.48, px + SCALE*4, H*0.54], fill=(40, 35, 30))
        add_glow(im, int(px), int(H*0.46), SCALE*35, (255, 160, 40), 120)

    # Hanging royal crimson banners
    for bx in [W*0.2, W*0.8]:
        draw_poly(draw, [(bx - SCALE*20, H*0.32), (bx + SCALE*20, H*0.32),
                         (bx + SCALE*20, H*0.62), (bx, H*0.68), (bx - SCALE*20, H*0.62)],
                  fill=(160, 30, 45), outline=INK, width=SCALE*2)
        # Gold emblem on banner
        draw.polygon([(bx, H*0.42), (bx - SCALE*8, H*0.5), (bx + SCALE*8, H*0.5)], fill=(230, 185, 60))

    draw_standard_ground(draw, (85, 78, 88), (145, 135, 140), (55, 48, 58), INK, 'stones')
    return im

def gen_06_cave():
    """6. Кристальная пещера (Subterranean Cavern / Stalactites & Geodes)"""
    sky = make_gradient(W, H, [(0, (12, 15, 25)), (0.4, (20, 28, 42)), (0.75, (28, 42, 58)), (1.0, (20, 30, 45))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Hanging jagged stalactites from ceiling
    for i in range(0, W, SCALE * 42):
        sx = i + (i % 5) * SCALE * 6
        sh = SCALE * (45 + (i % 7) * 16)
        sw = SCALE * (18 + (i % 3) * 6)
        draw_poly(draw, [(sx - sw/2, 0), (sx + sw/2, 0), (sx, sh)], fill=(45, 55, 72), outline=INK_COOL, width=SCALE*2)

    # Giant glowing crystal clusters (Amethyst & Aquamarine)
    crystals = [
        (W*0.15, H*0.62, (50, 230, 255)),
        (W*0.38, H*0.52, (210, 80, 255)),
        (W*0.62, H*0.58, (60, 240, 210)),
        (W*0.84, H*0.48, (220, 90, 240))
    ]
    for cx, cy, col in crystals:
        rad = SCALE * 38
        # Glow
        add_glow(im, int(cx), int(cy), int(rad * 2.2), col, 130)
        # Faceted crystal shards
        for angle in [-0.5, -0.2, 0.1, 0.4]:
            len_c = rad * (0.8 + abs(angle)*0.5)
            tip_x = cx + math.sin(angle) * len_c
            tip_y = cy - math.cos(angle) * len_c
            draw_poly(draw, [(cx - SCALE*6, cy), (tip_x, tip_y), (cx + SCALE*6, cy)], fill=col, outline=INK_COOL, width=SCALE*2)

    # Cavern rock pillars
    for rx in [W*0.28, W*0.74]:
        draw_poly(draw, [(rx - SCALE*30, 0), (rx + SCALE*30, 0), (rx + SCALE*18, GROUND_Y), (rx - SCALE*18, GROUND_Y)],
                  fill=(38, 46, 60), outline=INK_COOL, width=SCALE*3)

    draw_standard_ground(draw, (35, 42, 54), (75, 95, 115), (22, 28, 38), INK_COOL, 'stones')
    return im

def gen_07_swamp():
    """7. Мшистые топи (Misty Swamp / Weeping Willows & Murky Waters)"""
    sky = make_gradient(W, H, [(0, (28, 38, 30)), (0.45, (48, 65, 45)), (0.75, (85, 105, 68)), (1.0, (70, 90, 55))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Misty swamp horizon
    draw_poly(draw, [(0, H*0.52), (W*0.3, H*0.46), (W*0.7, H*0.55), (W, H*0.48), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(55, 75, 50), outline=INK, width=SCALE*2)

    # Gnarled twisted swamp trees with hanging moss
    for tx in [W*0.12, W*0.42, W*0.82]:
        tw = SCALE * 32
        draw_poly(draw, [(tx - tw, GROUND_Y), (tx, H*0.2), (tx + tw, GROUND_Y)], fill=(60, 52, 40), outline=INK, width=SCALE*3)
        # Moss drapes
        for mx in range(int(tx - SCALE*50), int(tx + SCALE*50), SCALE*14):
            draw.line([(mx, H*0.28), (mx - SCALE*4, H*0.45)], fill=(95, 120, 75), width=SCALE*3)

    # Swamp gas orbs (will-o'-the-wisps)
    for wx, wy in [(W*0.25, H*0.55), (W*0.65, H*0.48), (W*0.88, H*0.62)]:
        add_glow(im, int(wx), int(wy), SCALE*25, (160, 255, 120), 140)

    # Boardwalk / wooden pier path
    draw_standard_ground(draw, (45, 60, 42), (130, 105, 75), (28, 38, 25), INK, 'grass')
    return im

def gen_08_village():
    """8. Деревенская опушка (Rustic Village / Wooden Cottages & Thatched Roofs)"""
    sky = make_gradient(W, H, [(0, (60, 105, 155)), (0.45, (135, 180, 215)), (0.75, (235, 220, 190)), (1.0, (215, 200, 160))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Distant green rolling farmland
    draw_poly(draw, [(0, H*0.48), (W*0.35, H*0.42), (W*0.75, H*0.50), (W, H*0.44), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(105, 145, 85), outline=INK, width=SCALE*2)

    # Cozy wooden cottages
    cottages = [(W*0.18, SCALE*85), (W*0.55, SCALE*75), (W*0.85, SCALE*90)]
    for cx, cw in cottages:
        ch = SCALE * 65
        cy = int(GROUND_Y - SCALE*15)
        # Wooden log walls
        draw_poly(draw, [(cx - cw/2, cy), (cx + cw/2, cy), (cx + cw/2, cy - ch), (cx - cw/2, cy - ch)],
                  fill=(165, 120, 75), outline=INK, width=SCALE*3)
        # Thatched roof (straw yellow)
        draw_poly(draw, [(cx - cw*0.65, cy - ch), (cx, cy - ch - SCALE*42), (cx + cw*0.65, cy - ch)],
                  fill=(220, 175, 65), outline=INK, width=SCALE*3)
        # Glowing window
        draw.rectangle([cx - SCALE*12, cy - ch*0.65, cx + SCALE*12, cy - ch*0.35], fill=(255, 220, 120), outline=INK, width=SCALE*2)
        # Stone chimney with smoke
        draw.rectangle([cx + cw*0.3, cy - ch - SCALE*35, cx + cw*0.42, cy - ch], fill=(120, 115, 110), outline=INK, width=SCALE*2)

    # Wooden fences along path
    for fx in range(int(W*0.32), int(W*0.46), SCALE*18):
        draw.line([(fx, GROUND_Y - SCALE*18), (fx, GROUND_Y)], fill=(130, 95, 60), width=SCALE*4)
    draw.line([(W*0.31, GROUND_Y - SCALE*12), (W*0.47, GROUND_Y - SCALE*12)], fill=(130, 95, 60), width=SCALE*3)

    draw_standard_ground(draw, (95, 130, 70), (195, 155, 95), (55, 80, 40), INK, 'grass')
    return im

def gen_09_desert():
    """9. Песчаные дюны и оазис (Desert Dunes / Sandstone Temples & Date Palms)"""
    sky = make_gradient(W, H, [(0, (195, 75, 45)), (0.35, (235, 140, 60)), (0.65, (255, 205, 110)), (1.0, (240, 185, 95))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Blazing desert sun
    add_glow(im, int(W*0.5), int(H*0.28), SCALE*90, (255, 245, 180), 120)

    # Distant sweeping sand dunes
    draw_poly(draw, [(0, H*0.52), (W*0.25, H*0.40), (W*0.55, H*0.55), (W*0.85, H*0.38), (W, H*0.50), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(230, 165, 85), outline=INK_WARM, width=SCALE*2)
    # Sandstone pyramid / obelisk ruins
    draw_poly(draw, [(W*0.72, GROUND_Y), (W*0.78, H*0.32), (W*0.84, GROUND_Y)], fill=(215, 145, 75), outline=INK_WARM, width=SCALE*3)

    # Date palm trees
    for px in [W*0.18, W*0.36]:
        # Curved trunk
        draw.line([(px, GROUND_Y), (px + SCALE*15, H*0.35)], fill=(125, 85, 50), width=SCALE*7)
        # Palm fronds
        top = (px + SCALE*15, H*0.35)
        for angle in [-1.8, -1.2, -0.6, 0.0, 0.6, 1.2, 1.8]:
            fx = top[0] + math.sin(angle) * SCALE*55
            fy = top[1] + math.cos(angle)*0.5 * SCALE*45 + SCALE*15
            draw.line([top, (fx, fy)], fill=(75, 135, 60), width=SCALE*4)

    draw_standard_ground(draw, (225, 160, 80), (250, 195, 115), (175, 115, 55), INK_WARM, 'stones')
    return im

def gen_10_crypt():
    """10. Кладбище и склеп (Ancient Crypt / Gothic Mausoleum & Tombstones)"""
    sky = make_gradient(W, H, [(0, (15, 18, 30)), (0.45, (28, 35, 52)), (0.75, (45, 52, 68)), (1.0, (35, 40, 52))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Full moon with misty halo
    add_glow(im, int(W*0.75), int(H*0.22), SCALE*75, (230, 240, 255), 110)
    draw.ellipse([W*0.75 - SCALE*28, H*0.22 - SCALE*28, W*0.75 + SCALE*28, H*0.22 + SCALE*28], fill=(245, 250, 255))

    # Dead twisted trees (silhouettes)
    for tx in [W*0.15, W*0.85]:
        draw.line([(tx, GROUND_Y), (tx, H*0.25)], fill=INK_COOL, width=SCALE*8)
        draw.line([(tx, H*0.4), (tx - SCALE*40, H*0.22)], fill=INK_COOL, width=SCALE*4)
        draw.line([(tx, H*0.35), (tx + SCALE*45, H*0.18)], fill=INK_COOL, width=SCALE*4)

    # Gothic stone crypt portal
    cx = W*0.48
    draw_poly(draw, [(cx - SCALE*65, GROUND_Y), (cx - SCALE*65, H*0.38), (cx, H*0.26), (cx + SCALE*65, H*0.38), (cx + SCALE*65, GROUND_Y)],
              fill=(75, 82, 92), outline=INK_COOL, width=SCALE*3)
    # Crypt dark doorway
    draw_poly(draw, [(cx - SCALE*28, GROUND_Y), (cx - SCALE*28, H*0.45), (cx, H*0.38), (cx + SCALE*28, H*0.45), (cx + SCALE*28, GROUND_Y)],
              fill=(12, 14, 22), outline=INK_COOL, width=SCALE*2)

    # Tombstones and crosses
    for gx in [W*0.26, W*0.34, W*0.62, W*0.72]:
        gh = SCALE * 32
        draw_poly(draw, [(gx - SCALE*10, GROUND_Y), (gx - SCALE*10, GROUND_Y - gh), (gx, GROUND_Y - gh - SCALE*8), (gx + SCALE*10, GROUND_Y - gh), (gx + SCALE*10, GROUND_Y)],
                  fill=(105, 112, 120), outline=INK_COOL, width=SCALE*2)

    draw_standard_ground(draw, (45, 52, 58), (95, 102, 108), (28, 32, 36), INK_COOL, 'stones')
    return im

def gen_11_snow():
    """11. Заснеженный бор (Snowy Pine Tundra / Frozen River & Ice Crags)"""
    sky = make_gradient(W, H, [(0, (110, 145, 185)), (0.45, (165, 195, 225)), (0.75, (220, 235, 250)), (1.0, (200, 220, 240))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Frozen mountain peaks in mist
    draw_poly(draw, [(0, H*0.48), (W*0.28, H*0.26), (W*0.6, H*0.44), (W*0.82, H*0.24), (W, H*0.42), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(180, 205, 230), outline=INK_COOL, width=SCALE*2)

    # Heavy snow-laden pine trees
    for px in [W*0.08, W*0.24, W*0.45, W*0.68, W*0.88]:
        pw = SCALE * 45
        ph = SCALE * 130
        draw_poly(draw, [(px - pw, GROUND_Y), (px, GROUND_Y - ph), (px + pw, GROUND_Y)], fill=(55, 80, 85), outline=INK_COOL, width=SCALE*3)
        # Snow layers on branches
        for lyr in [0.3, 0.55, 0.8]:
            sw_l = pw * (1.0 - lyr*0.6)
            sy_l = GROUND_Y - ph * lyr
            draw_poly(draw, [(px - sw_l, sy_l), (px, sy_l - SCALE*16), (px + sw_l, sy_l)], fill=(245, 250, 255), outline=INK_COOL, width=SCALE*2)

    draw_standard_ground(draw, (185, 205, 225), (240, 248, 255), (145, 170, 195), INK_COOL, 'snow')
    return im

def gen_12_windmills():
    """12. Ветряные мельницы (Windmill Plains / Wheat Fields & Rolling Hills)"""
    sky = make_gradient(W, H, [(0, (75, 125, 185)), (0.45, (145, 190, 235)), (0.75, (245, 230, 195)), (1.0, (225, 205, 160))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Distant golden wheat hills
    draw_poly(draw, [(0, H*0.52), (W*0.35, H*0.40), (W*0.7, H*0.54), (W, H*0.42), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(205, 165, 75), outline=INK, width=SCALE*2)

    # Traditional Dutch/fantasy wooden windmills
    windmills = [(W*0.22, SCALE*65), (W*0.78, SCALE*80)]
    for wx, ww in windmills:
        wh = SCALE * 105
        # Mill body (octagonal taper)
        draw_poly(draw, [(wx - ww/2, GROUND_Y), (wx + ww/2, GROUND_Y), (wx + ww*0.3, GROUND_Y - wh), (wx - ww*0.3, GROUND_Y - wh)],
                  fill=(135, 95, 60), outline=INK, width=SCALE*3)
        # Mill cap
        draw_poly(draw, [(wx - ww*0.38, GROUND_Y - wh), (wx, GROUND_Y - wh - SCALE*25), (wx + ww*0.38, GROUND_Y - wh)],
                  fill=(75, 55, 40), outline=INK, width=SCALE*2)
        # Mill blades (4 cross blades)
        center = (wx, GROUND_Y - wh + SCALE*5)
        for angle in [0.4, 0.4 + math.pi/2, 0.4 + math.pi, 0.4 + 3*math.pi/2]:
            bx = center[0] + math.sin(angle) * SCALE*65
            by = center[1] - math.cos(angle) * SCALE*65
            draw.line([center, (bx, by)], fill=(225, 215, 190), width=SCALE*4)
            draw.line([center, (bx, by)], fill=INK, width=SCALE*1)

    draw_standard_ground(draw, (185, 145, 60), (220, 185, 105), (125, 95, 40), INK, 'grass')
    return im

def gen_13_bamboo():
    """13. Бамбуковая роща (Bamboo Grove / Zen Torii & Misty Canopy)"""
    sky = make_gradient(W, H, [(0, (40, 65, 55)), (0.45, (85, 125, 105)), (0.75, (165, 195, 175)), (1.0, (145, 175, 150))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Vertical towering bamboo stalks
    for i in range(0, W, SCALE * 26):
        bx = i + (i % 7) * SCALE * 5
        bw = SCALE * (10 + (i % 4)*3)
        draw.line([(bx, GROUND_Y), (bx, 0)], fill=(90, 150, 85), width=int(bw))
        draw.line([(bx - bw/2, GROUND_Y), (bx - bw/2, 0)], fill=INK, width=SCALE*1)
        draw.line([(bx + bw/2, GROUND_Y), (bx + bw/2, 0)], fill=INK, width=SCALE*1)
        # Bamboo segment rings
        for ring_y in range(int(GROUND_Y), 0, -SCALE*45):
            draw.line([(bx - bw/2 - SCALE*2, ring_y), (bx + bw/2 + SCALE*2, ring_y)], fill=(55, 95, 50), width=SCALE*3)

    # Japanese stone lantern (Toro)
    lx = W*0.5
    draw.rectangle([lx - SCALE*12, GROUND_Y - SCALE*40, lx + SCALE*12, GROUND_Y], fill=(130, 135, 130), outline=INK, width=SCALE*2)
    draw.rectangle([lx - SCALE*20, GROUND_Y - SCALE*55, lx + SCALE*20, GROUND_Y - SCALE*40], fill=(255, 230, 140), outline=INK, width=SCALE*2)
    add_glow(im, int(lx), int(GROUND_Y - SCALE*48), SCALE*35, (255, 220, 120), 120)

    draw_standard_ground(draw, (75, 115, 70), (165, 170, 155), (45, 75, 42), INK, 'grass')
    return im

def gen_14_volcano():
    """14. Лавовый разлом (Volcanic Magma Gorge / Obsidian Basalt & Ash)"""
    sky = make_gradient(W, H, [(0, (35, 12, 10)), (0.45, (85, 22, 15)), (0.75, (175, 55, 20)), (1.0, (140, 35, 15))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Jagged black volcanic crags
    draw_poly(draw, [(0, H*0.48), (W*0.22, H*0.26), (W*0.48, H*0.52), (W*0.75, H*0.22), (W, H*0.46), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(42, 28, 28), outline=INK_WARM, width=SCALE*3)

    # Molten lava river in background
    draw_poly(draw, [(W*0.35, GROUND_Y), (W*0.48, H*0.52), (W*0.55, H*0.52), (W*0.65, GROUND_Y)],
              fill=(255, 90, 20), outline=INK_WARM, width=SCALE*2)
    add_glow(im, int(W*0.5), int(GROUND_Y - SCALE*30), SCALE*85, (255, 100, 20), 130)

    # Volcanic basalt pillars
    for bx in [W*0.12, W*0.88]:
        draw_poly(draw, [(bx - SCALE*28, GROUND_Y), (bx - SCALE*20, H*0.3), (bx + SCALE*20, H*0.3), (bx + SCALE*28, GROUND_Y)],
                  fill=(55, 38, 38), outline=INK_WARM, width=SCALE*3)

    draw_standard_ground(draw, (48, 32, 32), (95, 55, 45), (28, 18, 18), INK_WARM, 'stones')
    return im

def gen_15_temple():
    """15. Затонувший храм (Sunken Overgrown Temple / Mossy Relics & Statues)"""
    sky = make_gradient(W, H, [(0, (30, 60, 55)), (0.45, (65, 105, 95)), (0.75, (145, 175, 150)), (1.0, (120, 150, 125))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Stepped Aztec/Cambodian ancient stone pyramid in distance
    for step in range(5):
        pw = SCALE * (240 - step * 38)
        py = int(H*0.58 - step * SCALE*25)
        draw.rectangle([W*0.5 - pw/2, py, W*0.5 + pw/2, py + SCALE*25], fill=(75, 95, 82), outline=INK, width=SCALE*2)

    # Overgrown stone columns with ivy
    for cx in [W*0.16, W*0.34, W*0.66, W*0.84]:
        draw.rectangle([cx - SCALE*22, H*0.35, cx + SCALE*22, GROUND_Y], fill=(110, 128, 115), outline=INK, width=SCALE*3)
        # Hanging creeping vines
        draw.line([(cx - SCALE*24, H*0.4), (cx - SCALE*18, H*0.65)], fill=(60, 115, 65), width=SCALE*4)

    draw_standard_ground(draw, (65, 88, 70), (145, 160, 135), (42, 58, 45), INK, 'grass')
    return im

def gen_16_gardens():
    """16. Королевский сад (Royal Palace Gardens / Marble Balustrade & Fountains)"""
    sky = make_gradient(W, H, [(0, (80, 125, 180)), (0.45, (150, 185, 225)), (0.75, (245, 235, 220)), (1.0, (230, 215, 195))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Distant baroque palace dome & spires
    draw_poly(draw, [(0, H*0.52), (W*0.4, H*0.48), (W*0.5, H*0.28), (W*0.6, H*0.48), (W, H*0.52), (W, GROUND_Y), (0, GROUND_Y)],
              fill=(210, 195, 205), outline=INK, width=SCALE*2)

    # Marble balustrade along upper terrace
    by = int(GROUND_Y - SCALE*45)
    draw.line([(0, by), (W, by)], fill=(240, 240, 245), width=SCALE*6)
    draw.line([(0, by), (W, by)], fill=INK, width=SCALE*1)
    for bx in range(0, W, SCALE*32):
        draw.rectangle([bx - SCALE*4, by, bx + SCALE*4, GROUND_Y - SCALE*10], fill=(230, 230, 235), outline=INK, width=SCALE*2)

    # Classical marble fountain in center
    fx = W*0.5
    draw.ellipse([fx - SCALE*55, GROUND_Y - SCALE*30, fx + SCALE*55, GROUND_Y - SCALE*10], fill=(215, 220, 225), outline=INK, width=SCALE*3)
    # Water jet spray
    draw.line([(fx, GROUND_Y - SCALE*20), (fx, GROUND_Y - SCALE*75)], fill=(160, 220, 245), width=SCALE*5)

    # Sculpted rose topiaries
    for rx in [W*0.18, W*0.82]:
        draw.ellipse([rx - SCALE*35, H*0.45, rx + SCALE*35, H*0.65], fill=(65, 125, 55), outline=INK, width=SCALE*2)
        # Red roses
        for ox in [-15, 0, 15]:
            draw.ellipse([rx + ox*SCALE - SCALE*5, H*0.55 - SCALE*5, rx + ox*SCALE + SCALE*5, H*0.55 + SCALE*5], fill=(220, 45, 65))

    draw_standard_ground(draw, (85, 135, 65), (235, 225, 210), (55, 95, 45), INK, 'grass')
    return im

def gen_17_coast():
    """17. Морской берег и маяк (Sea Coast / Ocean Waves & Distant Lighthouse)"""
    sky = make_gradient(W, H, [(0, (45, 85, 145)), (0.45, (115, 165, 215)), (0.75, (235, 215, 195)), (1.0, (215, 195, 170))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Ocean horizon with rolling blue waves
    draw.rectangle([0, int(H*0.48), W, GROUND_Y], fill=(55, 120, 165))
    # Wave foam crests
    for wy in range(int(H*0.52), GROUND_Y, SCALE*14):
        draw.line([(0, wy), (W, wy)], fill=(185, 225, 245), width=SCALE*2)

    # Coastal cliff with white/red lighthouse
    lx = W*0.82
    draw_poly(draw, [(lx - SCALE*60, GROUND_Y), (lx - SCALE*35, H*0.42), (W, H*0.42), (W, GROUND_Y)],
              fill=(115, 105, 95), outline=INK, width=SCALE*3)
    # Lighthouse tower
    draw_poly(draw, [(lx, H*0.42), (lx + SCALE*12, H*0.22), (lx + SCALE*28, H*0.22), (lx + SCALE*40, H*0.42)],
              fill=(245, 245, 250), outline=INK, width=SCALE*2)
    # Red stripe on lighthouse
    draw.rectangle([lx + SCALE*8, H*0.30, lx + SCALE*32, H*0.35], fill=(220, 50, 50))
    # Light beam across sky
    add_light_shaft(im, lx + SCALE*20, lx + SCALE*25, 0, H*0.35, color=(255, 255, 200), alpha=60)

    draw_standard_ground(draw, (220, 190, 135), (245, 220, 165), (170, 140, 95), INK, 'stones')
    return im

def gen_18_forge():
    """18. Мастерская и кузница (Arcane Forge / Smelting Furnace & Pipes)"""
    sky = make_gradient(W, H, [(0, (25, 20, 22)), (0.45, (55, 35, 30)), (0.75, (95, 50, 35)), (1.0, (75, 40, 30))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Heavy stone masonry archways
    for ax in [W*0.25, W*0.75]:
        draw_poly(draw, [(ax - SCALE*75, GROUND_Y), (ax - SCALE*75, H*0.35), (ax, H*0.22), (ax + SCALE*75, H*0.35), (ax + SCALE*75, GROUND_Y)],
                  fill=(65, 55, 58), outline=INK, width=SCALE*3)

    # Great molten blast furnace in center
    fx = W*0.5
    draw.rectangle([fx - SCALE*55, H*0.38, fx + SCALE*55, GROUND_Y], fill=(48, 42, 45), outline=INK, width=SCALE*4)
    # Glowing furnace opening (molten gold/orange)
    draw.ellipse([fx - SCALE*28, H*0.55, fx + SCALE*28, H*0.72], fill=(255, 140, 30), outline=INK, width=SCALE*3)
    add_glow(im, int(fx), int(H*0.63), SCALE*85, (255, 120, 20), 150)

    # Steam pipes and hanging heavy chains
    for px in [W*0.15, W*0.85]:
        draw.line([(px, 0), (px, GROUND_Y)], fill=(130, 85, 55), width=SCALE*6)
        draw.line([(px, 0), (px, GROUND_Y)], fill=INK, width=SCALE*1)

    draw_standard_ground(draw, (55, 48, 45), (115, 85, 70), (35, 28, 25), INK, 'stones')
    return im

def gen_19_skyislands():
    """19. Небесные острова (Sky Citadel / Floating Cloud Islands & Waterfalls)"""
    sky = make_gradient(W, H, [(0, (65, 115, 195)), (0.45, (145, 185, 235)), (0.75, (225, 215, 240)), (1.0, (205, 195, 225))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Floating earth islands in mid-air
    islands = [
        (W*0.22, H*0.35, SCALE*85),
        (W*0.52, H*0.25, SCALE*110),
        (W*0.82, H*0.38, SCALE*90)
    ]
    for ix, iy, ir in islands:
        # Underside rocky cone
        draw_poly(draw, [(ix - ir, iy), (ix + ir, iy), (ix, iy + ir*0.8)], fill=(120, 95, 75), outline=INK, width=SCALE*3)
        # Green grassy top plateau
        draw.ellipse([ix - ir, iy - SCALE*12, ix + ir, iy + SCALE*12], fill=(85, 145, 65), outline=INK, width=SCALE*2)
        # Cloud wisps around island
        draw.ellipse([ix - ir*0.8, iy + ir*0.6, ix + ir*0.8, iy + ir*0.9], fill=(255, 255, 255, 160))

    # Suspended rope bridge between islands
    draw.line([(W*0.22 + SCALE*85, H*0.35), (W*0.52 - SCALE*110, H*0.25)], fill=(110, 80, 50), width=SCALE*4)

    draw_standard_ground(draw, (95, 135, 75), (215, 185, 135), (60, 95, 48), INK, 'grass')
    return im

def gen_20_throneroom():
    """20. Тронный зал цитадели (Imperial Throne Room / Crimson Carpet & Golden Arches)"""
    sky = make_gradient(W, H, [(0, (25, 18, 22)), (0.45, (48, 30, 38)), (0.75, (75, 42, 52)), (1.0, (60, 32, 42))])
    im = sky.convert('RGBA')
    draw = ImageDraw.Draw(im)

    # Grand imperial vaulted ceiling with golden ribs
    for gx in [W*0.25, W*0.5, W*0.75]:
        draw.line([(gx, 0), (gx, H*0.35)], fill=(215, 175, 65), width=SCALE*5)
        # Giant golden chandeliers
        draw.polygon([(gx - SCALE*30, H*0.22), (gx + SCALE*30, H*0.22), (gx, H*0.28)], fill=(230, 185, 55), outline=INK, width=SCALE*2)
        add_glow(im, int(gx), int(H*0.24), SCALE*45, (255, 220, 110), 130)

    # Imperial gold-and-velvet throne in center
    tx = W*0.5
    draw_poly(draw, [(tx - SCALE*35, GROUND_Y), (tx + SCALE*35, GROUND_Y),
                     (tx + SCALE*25, H*0.38), (tx, H*0.32), (tx - SCALE*25, H*0.38)],
              fill=(220, 175, 55), outline=INK, width=SCALE*3)
    # Throne velvet seat
    draw.rectangle([tx - SCALE*18, H*0.45, tx + SCALE*18, GROUND_Y - SCALE*15], fill=(160, 25, 40))

    # Royal crimson carpet along path
    draw_standard_ground(draw, (75, 58, 68), (175, 35, 50), (45, 32, 40), INK, 'stones')
    return im

# -------------------------------------------------------------------------------------------------
# MASTER PIPELINE
# -------------------------------------------------------------------------------------------------

ALL_GENERATORS = [
    ("bg-01-forest", gen_01_forest, "Сумеречный Лес"),
    ("bg-02-mountains", gen_02_mountains, "Горный Перевал"),
    ("bg-03-brook", gen_03_brook, "Лесной Ручеек"),
    ("bg-04-market", gen_04_market, "Средневековый Рынок"),
    ("bg-05-castle", gen_05_castle, "Залы Замка"),
    ("bg-06-cave", gen_06_cave, "Кристальная Пещера"),
    ("bg-07-swamp", gen_07_swamp, "Мшистые Топи"),
    ("bg-08-village", gen_08_village, "Деревенская Опушка"),
    ("bg-09-desert", gen_09_desert, "Песчаные Дюны"),
    ("bg-10-crypt", gen_10_crypt, "Кладбище и Склеп"),
    ("bg-11-snow", gen_11_snow, "Заснеженный Бор"),
    ("bg-12-windmills", gen_12_windmills, "Ветряные Мельницы"),
    ("bg-13-bamboo", gen_13_bamboo, "Бамбуковая Роща"),
    ("bg-14-volcano", gen_14_volcano, "Лавовый Разлом"),
    ("bg-15-temple", gen_15_temple, "Затонувший Храм"),
    ("bg-16-gardens", gen_16_gardens, "Королевский Сад"),
    ("bg-17-coast", gen_17_coast, "Морской Берег"),
    ("bg-18-forge", gen_18_forge, "Мастерская и Кузница"),
    ("bg-19-skyislands", gen_19_skyislands, "Небесные Острова"),
    ("bg-20-throneroom", gen_20_throneroom, "Тронный Зал")
]

def main():
    out_dir = 'c:/Users/User/Documents/ChatGPT/go w go/assets'
    os.makedirs(out_dir, exist_ok=True)

    print(f"Generating {len(ALL_GENERATORS)} distinct illustrated backgrounds at {SW}x{SH}...")
    for idx, (filename, gen_func, name_ru) in enumerate(ALL_GENERATORS, 1):
        print(f"[{idx:02d}/20] Generating {filename}.png ({name_ru})...")
        high_im = gen_func()
        # Downscale from 2x supersampled to target dimensions
        final_im = high_im.resize((SW, SH), Image.Resampling.LANCZOS).convert('RGB')
        out_path = os.path.join(out_dir, f"{filename}.png")
        final_im.save(out_path, format='PNG', optimize=True)
        print(f"      Saved {out_path} ({os.path.getsize(out_path):,} bytes)")

    print("All 20 backgrounds successfully generated!")

if __name__ == '__main__':
    main()
