import os
import glob
import hashlib
from PIL import Image

ROOT = r"c:\Users\User\Documents\ChatGPT\go w go"
ASSETS = os.path.join(ROOT, "assets")
OPT_DIR = os.path.join(ASSETS, "optimized")
MANIFEST_FILE = os.path.join(ROOT, "assets-manifest.js")

os.makedirs(OPT_DIR, exist_ok=True)

def hash_file(path):
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:12]

NEW_FILES = [
    "thunder-halberd-fx-v1.png",
    "hammer-fx-v3.png",
    "axe-fx-v3.png",
    "tome-fx-v3.png",
    "scythe-fx-v3.png",
    "blade-fx-v3.png"
]

def run():
    print("Fast optimizing new attack sheets...", flush=True)
    for name in NEW_FILES:
        png_path = os.path.join(ASSETS, name)
        if not os.path.exists(png_path):
            print(f"Skipping missing {name}", flush=True)
            continue
        
        webp_name = os.path.splitext(name)[0] + ".webp"
        webp_path = os.path.join(OPT_DIR, webp_name)
        
        im = Image.open(png_path)
        im.save(webp_path, "WEBP", quality=85, method=3)
        print(f"  Optimized {name} -> {webp_name} ({os.path.getsize(webp_path)} bytes)", flush=True)
    
    # Read existing manifest or rebuild
    manifest = {}
    if os.path.exists(MANIFEST_FILE):
        with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith('"') and '": "' in line:
                    k, v = line.split('": "', 1)
                    k = k.strip('"')
                    v = v.rstrip('",')
                    manifest[k] = v
    
    for name in NEW_FILES:
        webp_name = os.path.splitext(name)[0] + ".webp"
        webp_path = os.path.join(OPT_DIR, webp_name)
        if os.path.exists(webp_path):
            h = hash_file(webp_path)
            manifest[name] = f"assets/optimized/{webp_name}?v={h}"
            
    # Write updated manifest
    lines = ["const ASSET_URLS={"]
    for k, v in sorted(manifest.items()):
        lines.append(f'  "{k}": "{v}",')
    lines.append("};")
    lines.append('if(typeof module!=="undefined"&&module.exports)module.exports=ASSET_URLS;')
    lines.append('else if(typeof window!=="undefined")window.ASSET_URLS=ASSET_URLS;\n')
    
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
        
    print(f"Updated {MANIFEST_FILE} with {len(manifest)} assets.", flush=True)

if __name__ == "__main__":
    run()
