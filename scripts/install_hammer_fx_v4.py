"""Repack hammer-fx-v2 from .orig, write webp, patch assets-manifest.js."""
from __future__ import annotations

import hashlib
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from repack_fx_strips import repack  # noqa: E402

ASSETS = ROOT / "assets"
NAME = "hammer-fx-v2.png"
path = ASSETS / NAME
repack(path)

webp = ASSETS / "optimized" / "hammer-fx-v2.webp"
from PIL import Image

Image.open(path).save(webp, "WEBP", quality=85, method=3)
digest = hashlib.md5(webp.read_bytes()).hexdigest()[:12]
url = f"assets/optimized/hammer-fx-v2.webp?v={digest}"
man = ROOT / "assets-manifest.js"
text = man.read_text(encoding="utf-8")
text2, n = re.subn(
    r'"hammer-fx-v2\.png":\s*"[^"]+"',
    f'"hammer-fx-v2.png": "{url}"',
    text,
)
if not n:
    raise SystemExit("manifest key hammer-fx-v2.png not found")
man.write_text(text2, encoding="utf-8")
print(f"ok {path.name} -> {webp.name} {url}")
