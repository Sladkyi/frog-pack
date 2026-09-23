"""Generate 5 distinct hand-drawn fantasy biome backgrounds for PACK / RUN.
Matches the dimensions (1774x887), perspective, ground baseline (y=79%), and seamless tiling of forest-v2.png.
"""
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np
import math

def generate_all():
    base_img = Image.open('c:/Users/User/Documents/ChatGPT/go w go/assets/forest-v2.png').convert('RGB')
    W, H = base_img.size  # 1774, 887
    base_arr = np.array(base_img, dtype=np.float32)

    # Normalized coordinates
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    ny = Y / H
    nx = X / W

    # Detect ink lines and dark outlines (low brightness in base image)
    brightness = np.mean(base_arr, axis=2)
    # Ink outlines have low brightness (< 65)
    ink_mask = np.clip((65.0 - brightness) / 40.0, 0.0, 1.0)[:, :, np.newaxis]

    # Baseline zones
    sky_mask = np.clip((0.35 - ny) / 0.25, 0.0, 1.0)[:, :, np.newaxis]
    canopy_mask = np.clip(1.0 - np.abs(ny - 0.35) / 0.35, 0.0, 1.0)[:, :, np.newaxis]
    ground_mask = np.clip((ny - 0.76) / 0.05, 0.0, 1.0)[:, :, np.newaxis]
    path_mask = np.clip(1.0 - np.abs(ny - 0.81) / 0.04, 0.0, 1.0)[:, :, np.newaxis]
    fore_mask = np.clip((ny - 0.86) / 0.06, 0.0, 1.0)[:, :, np.newaxis]

    # --- 1. BIOME: MUSHROOM THICKET (Грибная Чаща) ---
    # Deep indigo / twilight sky, bioluminescent cyan & magenta glowing fungi and spores
    m_arr = base_arr.copy()
    # Shift green foliage to deep teal and mystical violet
    r = m_arr[:, :, 0]
    g = m_arr[:, :, 1]
    b = m_arr[:, :, 2]
    # Color remapping
    new_r = r * 0.75 + b * 0.45 + 15
    new_g = g * 0.42 + b * 0.25 + 10
    new_b = b * 0.85 + g * 0.55 + 30
    m_out = np.stack([new_r, new_g, new_b], axis=2)

    # Atmospheric sky glow: purple dusk
    sky_purple = np.zeros_like(base_arr)
    sky_purple[:, :, 0] = 60 + 50 * (1.0 - ny)
    sky_purple[:, :, 1] = 30 + 40 * (1.0 - ny)
    sky_purple[:, :, 2] = 110 + 70 * (1.0 - ny)
    m_out = m_out * (1.0 - sky_mask * 0.6) + sky_purple * (sky_mask * 0.6)

    # Bioluminescent mushroom glows (scattered radial orbs in midground)
    np.random.seed(42)
    for _ in range(35):
        gx = np.random.randint(50, W - 50)
        gy = np.random.randint(int(H * 0.45), int(H * 0.78))
        rad = np.random.randint(25, 75)
        dist = np.sqrt((X - gx)**2 + (Y - gy)**2)
        glow = np.clip(1.0 - dist / rad, 0.0, 1.0)**2
        color = [200, 50, 220] if np.random.rand() > 0.4 else [30, 220, 240]
        for c in range(3):
            m_out[:, :, c] += glow * color[c] * 0.65

    # Path color: enchanted pale lavender stone
    path_col = np.array([125, 105, 145], dtype=np.float32)
    m_out = m_out * (1.0 - path_mask * 0.5) + path_col * (path_mask * 0.5)
    # Foreground: dark night moss
    fore_col = np.array([25, 45, 45], dtype=np.float32)
    m_out = m_out * (1.0 - fore_mask * 0.4) + fore_col * (fore_mask * 0.4)
    # Re-apply dark ink outlines
    m_out = m_out * (1.0 - ink_mask * 0.85) + np.array([15, 10, 25]) * (ink_mask * 0.85)
    m_out = np.clip(m_out, 0, 255).astype(np.uint8)
    Image.fromarray(m_out).save('c:/Users/User/Documents/ChatGPT/go w go/assets/bg-mushroom-v1.png')
    print("Created bg-mushroom-v1.png")

    # --- 2. BIOME: ANCIENT GROVE / GOLDEN AUTUMN (Древняя Роща) ---
    # Rich honey gold, cadmium orange, warm amber canopy, sunset glow
    a_arr = base_arr.copy()
    r = a_arr[:, :, 0]
    g = a_arr[:, :, 1]
    b = a_arr[:, :, 2]
    new_r = r * 1.35 + g * 0.55 + 25
    new_g = g * 0.85 + r * 0.25 + 10
    new_b = b * 0.35 + 5
    a_out = np.stack([new_r, new_g, new_b], axis=2)

    # Sunset sky gradient
    sky_gold = np.zeros_like(base_arr)
    sky_gold[:, :, 0] = 225 - ny * 60
    sky_gold[:, :, 1] = 150 - ny * 50
    sky_gold[:, :, 2] = 50 + ny * 20
    a_out = a_out * (1.0 - sky_mask * 0.65) + sky_gold * (sky_mask * 0.65)

    # Warm sunbeam shafts
    for angle, center_x in [(-0.35, W * 0.3), (-0.35, W * 0.7)]:
        shaft = np.clip(1.0 - np.abs((X - center_x) - (Y * angle)) / 140.0, 0.0, 1.0)**2
        for c in range(3):
            a_out[:, :, c] += shaft * [180, 130, 40][c] * 0.35

    # Path: warm golden-ochre earth
    path_col = np.array([215, 165, 75], dtype=np.float32)
    a_out = a_out * (1.0 - path_mask * 0.4) + path_col * (path_mask * 0.4)
    # Foreground: warm moss and fallen leaves
    fore_col = np.array([85, 55, 20], dtype=np.float32)
    a_out = a_out * (1.0 - fore_mask * 0.45) + fore_col * (fore_mask * 0.45)
    # Re-apply dark ink outlines (warm rich sepia)
    a_out = a_out * (1.0 - ink_mask * 0.85) + np.array([35, 20, 10]) * (ink_mask * 0.85)
    a_out = np.clip(a_out, 0, 255).astype(np.uint8)
    Image.fromarray(a_out).save('c:/Users/User/Documents/ChatGPT/go w go/assets/bg-autumn-v1.png')
    print("Created bg-autumn-v1.png")

    # --- 3. BIOME: CRYSTAL GROTTO (Кристальное Ущелье) ---
    # Deep midnight slate, glowing turquoise & cyan crystal prisms
    c_arr = base_arr.copy()
    r = c_arr[:, :, 0]
    g = c_arr[:, :, 1]
    b = c_arr[:, :, 2]
    new_r = r * 0.35 + b * 0.35 + 10
    new_g = g * 0.85 + b * 0.65 + 30
    new_b = b * 1.45 + g * 0.45 + 50
    c_out = np.stack([new_r, new_g, new_b], axis=2)

    # Subterranean midnight blue ceiling/sky
    sky_cyan = np.zeros_like(base_arr)
    sky_cyan[:, :, 0] = 15 + ny * 20
    sky_cyan[:, :, 1] = 40 + ny * 50
    sky_cyan[:, :, 2] = 85 + ny * 60
    c_out = c_out * (1.0 - sky_mask * 0.7) + sky_cyan * (sky_mask * 0.7)

    # Glowing crystal facets & nodes
    np.random.seed(101)
    for _ in range(40):
        gx = np.random.randint(40, W - 40)
        gy = np.random.randint(int(H * 0.35), int(H * 0.82))
        rad = np.random.randint(18, 55)
        dist = np.sqrt((X - gx)**2 + (Y - gy)**2)
        glow = np.clip(1.0 - dist / rad, 0.0, 1.0)**2
        color = [40, 240, 255] if np.random.rand() > 0.3 else [160, 210, 255]
        for c in range(3):
            c_out[:, :, c] += glow * color[c] * 0.75

    # Path: pale grey-blue crystal gravel
    path_col = np.array([130, 160, 185], dtype=np.float32)
    c_out = c_out * (1.0 - path_mask * 0.5) + path_col * (path_mask * 0.5)
    # Foreground: dark crystalline rock
    fore_col = np.array([18, 30, 48], dtype=np.float32)
    c_out = c_out * (1.0 - fore_mask * 0.5) + fore_col * (fore_mask * 0.5)
    # Re-apply dark ink outlines (navy dark)
    c_out = c_out * (1.0 - ink_mask * 0.85) + np.array([8, 16, 28]) * (ink_mask * 0.85)
    c_out = np.clip(c_out, 0, 255).astype(np.uint8)
    Image.fromarray(c_out).save('c:/Users/User/Documents/ChatGPT/go w go/assets/bg-crystal-v1.png')
    print("Created bg-crystal-v1.png")

    # --- 4. BIOME: EMBER CRAGS / VOLCANIC RUINS (Огненный Разлом) ---
    # Dark charcoal obsidian, fiery crimson horizon, glowing magma vents
    e_arr = base_arr.copy()
    r = e_arr[:, :, 0]
    g = e_arr[:, :, 1]
    b = e_arr[:, :, 2]
    new_r = r * 1.35 + g * 0.35 + 35
    new_g = g * 0.35 + 10
    new_b = b * 0.25 + 10
    e_out = np.stack([new_r, new_g, new_b], axis=2)

    # Smoky red horizon sky
    sky_ember = np.zeros_like(base_arr)
    sky_ember[:, :, 0] = 110 + 60 * ny
    sky_ember[:, :, 1] = 30 + 35 * ny
    sky_ember[:, :, 2] = 20 + 15 * ny
    e_out = e_out * (1.0 - sky_mask * 0.65) + sky_ember * (sky_mask * 0.65)

    # Glowing magma cracks near ground and lower trunks
    np.random.seed(77)
    for _ in range(30):
        gx = np.random.randint(30, W - 30)
        gy = np.random.randint(int(H * 0.65), int(H * 0.86))
        rad = np.random.randint(20, 60)
        dist = np.sqrt((X - gx)**2 + (Y - gy)**2 * 2.5)
        glow = np.clip(1.0 - dist / rad, 0.0, 1.0)**2
        color = [255, 120, 20] if np.random.rand() > 0.3 else [255, 60, 30]
        for c in range(3):
            e_out[:, :, c] += glow * color[c] * 0.8

    # Path: dark ash-grey stone with glowing ember specks
    path_col = np.array([85, 65, 65], dtype=np.float32)
    e_out = e_out * (1.0 - path_mask * 0.5) + path_col * (path_mask * 0.5)
    # Foreground: volcanic basalt
    fore_col = np.array([32, 18, 18], dtype=np.float32)
    e_out = e_out * (1.0 - fore_mask * 0.5) + fore_col * (fore_mask * 0.5)
    # Re-apply dark ink outlines (charcoal)
    e_out = e_out * (1.0 - ink_mask * 0.88) + np.array([20, 10, 10]) * (ink_mask * 0.88)
    e_out = np.clip(e_out, 0, 255).astype(np.uint8)
    Image.fromarray(e_out).save('c:/Users/User/Documents/ChatGPT/go w go/assets/bg-ember-v1.png')
    print("Created bg-ember-v1.png")

    # --- 5. BIOME: FROST TUNDRA (Морозные Пики) ---
    # Crisp pale cyan & silver sky, snow-frosted pines and trail, ice mist
    f_arr = base_arr.copy()
    r = f_arr[:, :, 0]
    g = f_arr[:, :, 1]
    b = f_arr[:, :, 2]
    # Desaturate and cool down
    lum = (r * 0.3 + g * 0.59 + b * 0.11)
    new_r = lum * 0.85 + 30
    new_g = lum * 0.95 + 45
    new_b = lum * 1.15 + 65
    f_out = np.stack([new_r, new_g, new_b], axis=2)

    # Arctic winter sky
    sky_frost = np.zeros_like(base_arr)
    sky_frost[:, :, 0] = 140 + ny * 40
    sky_frost[:, :, 1] = 175 + ny * 40
    sky_frost[:, :, 2] = 205 + ny * 35
    f_out = f_out * (1.0 - sky_mask * 0.6) + sky_frost * (sky_mask * 0.6)

    # Snow caps on top of foliage and upper branches
    # Areas in canopy with upward normals or higher brightness get snow layer
    snow_mask = np.clip((canopy_mask * (lum[:, :, np.newaxis] / 180.0) - 0.45) * 2.5, 0.0, 1.0)
    f_out = f_out * (1.0 - snow_mask * 0.75) + np.array([235, 245, 255]) * (snow_mask * 0.75)

    # Path: packed snow and ice trail
    path_col = np.array([210, 225, 240], dtype=np.float32)
    f_out = f_out * (1.0 - path_mask * 0.6) + path_col * (path_mask * 0.6)
    # Foreground: frosted dark pine undergrowth
    fore_col = np.array([45, 65, 80], dtype=np.float32)
    f_out = f_out * (1.0 - fore_mask * 0.5) + fore_col * (fore_mask * 0.5)
    # Re-apply dark ink outlines (deep slate navy)
    f_out = f_out * (1.0 - ink_mask * 0.85) + np.array([22, 32, 45]) * (ink_mask * 0.85)
    f_out = np.clip(f_out, 0, 255).astype(np.uint8)
    Image.fromarray(f_out).save('c:/Users/User/Documents/ChatGPT/go w go/assets/bg-frost-v1.png')
    print("Created bg-frost-v1.png")

if __name__ == '__main__':
    generate_all()
