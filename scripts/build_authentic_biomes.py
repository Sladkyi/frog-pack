"""Build 20 authentic hand-drawn backgrounds for PACK / RUN from real game art assets.
All assets come from the developer's genuine hand-drawn game series (Frogg, Frogg-Claw, king-two, the-last-king).
Outputs standard 1774x887 images with ground baseline at y = 79% (701px).
"""
import os
import shutil
from PIL import Image

def process_stage(src, target_size=(1774, 887), target_ground_y=701, src_ground_pct=0.76):
    if src.mode != 'RGB':
        src = src.convert('RGB')
    sw, sh = src.size
    tw, th = target_size
    
    scale = max(tw / sw, th / sh)
    nw, nh = int(round(sw * scale)), int(round(sh * scale))
    scaled = src.resize((nw, nh), Image.Resampling.LANCZOS)
    
    curr_ground_y = nh * src_ground_pct
    offset_y = int(round(curr_ground_y - target_ground_y))
    offset_y = max(0, min(nh - th, offset_y))
    
    offset_x = (nw - tw) // 2
    offset_x = max(0, min(nw - tw, offset_x))
    
    cropped = scaled.crop((offset_x, offset_y, offset_x + tw, offset_y + th))
    return cropped

def build_all():
    assets_dir = r'c:\Users\User\Documents\ChatGPT\go w go\assets'
    os.makedirs(assets_dir, exist_ok=True)
    
    specs = [
        # 1. Сумеречный лес (Original artwork)
        ('bg-01-forest.png', r'c:\Users\User\Documents\ChatGPT\go w go\assets\forest-v2.png', None, 0.79),
        # 2. Лесной ручей и старый мост (Journey stages v12, middle)
        ('bg-02-mountains.png', r'c:\Users\User\Documents\ChatGPT\Frogg-Claw\public\assets\journey-stages-v12.png', (0, 512, 1024, 1024), 0.77),
        # 3. Родной берег пруда (Journey stages v12, top)
        ('bg-03-brook.png', r'c:\Users\User\Documents\ChatGPT\Frogg-Claw\public\assets\journey-stages-v12.png', (0, 0, 1024, 512), 0.77),
        # 4. Пещера корней Барона (Journey stages v12, bottom)
        ('bg-04-market.png', r'c:\Users\User\Documents\ChatGPT\Frogg-Claw\public\assets\journey-stages-v12.png', (0, 1024, 1024, 1536), 0.78),
        # 5. Дикое болото и камыши (Revenge road v2, top-left)
        ('bg-05-castle.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\revenge-road-v2.png', (0, 0, 768, 512), 0.76),
        # 6. Деревенский сад и огород (Revenge road v2, top-right)
        ('bg-06-cave.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\revenge-road-v2.png', (768, 0, 1536, 512), 0.76),
        # 7. Сельская дорога и холмы с мельницей (Revenge road v2, bottom-left)
        ('bg-07-swamp.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\revenge-road-v2.png', (0, 512, 768, 1024), 0.76),
        # 8. Сад поместья и фруктовая роща (Revenge road v2, bottom-right)
        ('bg-08-village.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\revenge-road-v2.png', (768, 512, 1536, 1024), 0.76),
        # 9. Замковый двор на закате (Revenge locations, bottom-right)
        ('bg-09-desert.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\revenge-locations.png', (512, 768, 1024, 1536), 0.75),
        # 10. Холм и каменные стены усадьбы (Revenge locations, bottom-left)
        ('bg-10-crypt.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\revenge-locations.png', (0, 768, 512, 1536), 0.75),
        # 11. Хоздвор фермы (Revenge locations, top-right)
        ('bg-11-snow.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\revenge-locations.png', (512, 0, 1024, 768), 0.75),
        # 12. Огород у топи (Revenge locations, top-left)
        ('bg-12-windmills.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\revenge-locations.png', (0, 0, 512, 768), 0.75),
        # 13. Королевская каменная арена (Arena sketch)
        ('bg-13-bamboo.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\arena-sketch.png', None, 0.76),
        # 14. Пруд с кувшинками и мостками (Pond sketch)
        ('bg-14-volcano.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\pond-sketch.png', None, 0.76),
        # 15. Зеленые луга королевства (Revenge meadow)
        ('bg-15-temple.png', r'c:\Users\User\Documents\ChatGPT\Frogg\public\assets\revenge-meadow.png', None, 0.76),
        # 16. Дремучий когтистый бор (Claw forest v1)
        ('bg-16-gardens.png', r'c:\Users\User\Documents\ChatGPT\Frogg-Claw\public\assets\claw-forest-v1.png', None, 0.76),
        # 17. Рыцарский зал замка (The last king, hall room)
        ('bg-17-coast.png', r'c:\Users\User\dev\the-last-king\sprites\environment\hall_room.png', None, 0.74),
        # 18. Оружейная палата (The last king, armory)
        ('bg-18-forge.png', r'c:\Users\User\dev\the-last-king\sprites\rooms\armory\room_armory.png', None, 0.74),
        # 19. Кузница и мастерская (The last king, forge)
        ('bg-19-skyislands.png', r'c:\Users\User\dev\the-last-king\sprites\rooms\forge\room_forge.png', None, 0.74),
        # 20. Древний склеп и саркофаги (The last king, crypt)
        ('bg-20-throneroom.png', r'c:\Users\User\dev\the-last-king\sprites\rooms\crypt\room_crypt.png', None, 0.74),
    ]
    
    for filename, src_path, crop_box, ground_pct in specs:
        out_path = os.path.join(assets_dir, filename)
        if not os.path.exists(src_path):
            print(f'ERROR: Missing {src_path}')
            continue
            
        src_img = Image.open(src_path)
        if crop_box:
            src_img = src_img.crop(crop_box)
            
        if filename == 'bg-01-forest.png':
            # Exactly identical to forest-v2.png
            shutil.copy2(src_path, out_path)
            print(f'Copied {filename} directly from forest-v2.png (size={os.path.getsize(out_path)})')
        else:
            final_img = process_stage(src_img, target_size=(1774, 887), target_ground_y=701, src_ground_pct=ground_pct)
            final_img.save(out_path, format='PNG', optimize=True)
            print(f'Built {filename}: {final_img.size} ({os.path.getsize(out_path)} bytes) from {os.path.basename(src_path)}')

if __name__ == '__main__':
    build_all()
