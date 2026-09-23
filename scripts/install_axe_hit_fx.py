"""Install axe-hit-fx-v1 from generated PNG into assets + webp + manifest."""
from __future__ import annotations

import hashlib
import re
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
sys.path.insert(0, str(Path(__file__).resolve().parent))
from repack_fx_strips import repack  # noqa: E402

GEN = Path(
    r"C:\Users\User\.cursor\projects\c-Users-User-Documents-ChatGPT-go-w-go"
    r"\assets\axe-hit-fx-v1-gen.png"
)
NAME = "axe-hit-fx-v1.png"
orig = ASSETS / "axe-hit-fx-v1.orig.png"
png = ASSETS / NAME

im = Image.open(GEN).convert("RGBA")
im.save(orig)
shutil.copy2(orig, png)
repack(png)

webp = ASSETS / "optimized" / "axe-hit-fx-v1.webp"
Image.open(png).save(webp, "WEBP", quality=85, method=3)
digest = hashlib.md5(webp.read_bytes()).hexdigest()[:12]
url = f"assets/optimized/axe-hit-fx-v1.webp?v={digest}"

man = ROOT / "assets-manifest.js"
text = man.read_text(encoding="utf-8")
key = f'"{NAME}": "{url}"'
if f'"{NAME}"' in text:
    text2, n = re.subn(rf'"{re.escape(NAME)}":\s*"[^"]+"', key, text)
    assert n, "replace failed"
else:
    text2 = text.replace("const ASSET_URLS={\n", f"const ASSET_URLS={{\n  {key},\n")
man.write_text(text2, encoding="utf-8")
print("ok", url, png.size if hasattr(png, "size") else Image.open(png).size)
