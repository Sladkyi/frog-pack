"""Install frog-style Scythe (12f) + Orb (6f) VFX sheets."""
from __future__ import annotations

import hashlib
import re
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from install_frog_style_legend_fx import ASSETS, PROJ, black_to_alpha  # noqa: E402

CELL = 448
PAD = int(CELL * 0.08)


def pack6(rgba: np.ndarray) -> np.ndarray:
    h, w = rgba.shape[:2]
    cw, ch = w // 6, h
    out = np.zeros((CELL, CELL * 6, 4), np.uint8)
    for i in range(6):
        cell = rgba[:, i * cw : (i + 1) * cw]
        ys, xs = np.where(cell[:, :, 3] > 16)
        if len(ys) == 0:
            continue
        content = cell[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
        ih, iw = content.shape[:2]
        scale = min((CELL - 2 * PAD) / max(1, ih), (CELL - 2 * PAD) / max(1, iw))
        nh, nw = max(1, int(ih * scale)), max(1, int(iw * scale))
        resized = np.asarray(
            Image.fromarray(content, "RGBA").resize((nw, nh), Image.Resampling.LANCZOS)
        )
        y0 = (CELL - nh) // 2
        x0 = i * CELL + (CELL - nw) // 2
        out[y0 : y0 + nh, x0 : x0 + nw] = resized
    return out


def install(gen_name: str, out_name: str, pack_strip: bool = False) -> None:
    src = PROJ / gen_name
    if not src.exists():
        src = ASSETS / gen_name
    shutil.copy(src, ASSETS / gen_name)
    rgba = black_to_alpha(np.asarray(Image.open(src).convert("RGB")))
    if pack_strip:
        rgba = pack6(rgba)
    png = ASSETS / out_name
    orig = ASSETS / out_name.replace(".png", ".orig.png")
    Image.fromarray(rgba, "RGBA").save(orig)
    Image.fromarray(rgba, "RGBA").save(png, optimize=True)
    webp = ASSETS / "optimized" / out_name.replace(".png", ".webp")
    webp.parent.mkdir(parents=True, exist_ok=True)
    Image.open(png).save(webp, "WEBP", quality=85, method=3)
    digest = hashlib.md5(webp.read_bytes()).hexdigest()[:12]
    url = f"assets/optimized/{webp.name}?v={digest}"
    man = ROOT / "assets-manifest.js"
    text = man.read_text(encoding="utf-8")
    key = f'"{out_name}": "{url}"'
    if f'"{out_name}"' in text:
        text2, n = re.subn(rf'"{re.escape(out_name)}":\s*"[^"]+"', key, text)
        assert n
    else:
        text2 = text.replace("const ASSET_URLS={\n", f"const ASSET_URLS={{\n  {key},\n")
    man.write_text(text2, encoding="utf-8")
    opaque = float((rgba[:, :, 3] > 16).mean() * 100)
    print(f"ok {out_name} {Image.open(png).size} opaque={opaque:.1f}% {url}")


if __name__ == "__main__":
    install("scythe-fx-v4-gen.png", "scythe-fx-v4.png", pack_strip=False)
    install("orb-fx-v3-gen.png", "orb-fx-v3.png", pack_strip=True)
    install("hammer-fx-v3-gen.png", "hammer-fx-v4.png", pack_strip=True)
    install("dagger-fx-v3-gen.png", "dagger-fx-v3.png", pack_strip=True)
    install("shuriken-fx-v2-gen.png", "shuriken-fx-v2.png", pack_strip=True)
