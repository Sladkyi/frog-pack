"""Install simplified frog-style 12f VFX sheets (black-key → RGBA + webp + manifest)."""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
PROJ = Path(r"C:\Users\User\.cursor\projects\c-Users-User-Documents-ChatGPT-go-w-go\assets")

JOBS = [
    ("doomsday-bell-fx-v3-gen.png", "doomsday-bell-fx-v2.png"),
    ("bone-scythe-fx-v2-gen.png", "bone-scythe-fx-v2.png"),
    ("void-greatsword-fx-v2-gen.png", "void-greatsword-fx-v2.png"),
    ("eclipse-censer-fx-v2-gen.png", "eclipse-censer-fx-v2.png"),
]


def black_to_alpha(rgb: np.ndarray) -> np.ndarray:
    c = rgb.astype(np.int16)
    mx = np.maximum(np.maximum(c[:, :, 0], c[:, :, 1]), c[:, :, 2])
    mn = np.minimum(np.minimum(c[:, :, 0], c[:, :, 1]), c[:, :, 2])
    chroma = mx - mn
    kill = (mx <= 42) & (chroma <= 18)
    alpha = np.where(kill, 0, 255).astype(np.uint8)
    soft = (~kill) & (mx < 70) & (chroma < 28)
    alpha = np.where(soft, np.clip((mx - 28) * 8, 0, 255), alpha).astype(np.uint8)
    return np.dstack([rgb, alpha])


def sky_fill_cells(rgba: np.ndarray, cols: int = 4, rows: int = 3) -> np.ndarray:
    """Stretch tall bolt frames so paint runs nearly top→bottom of each cell."""
    h, w = rgba.shape[:2]
    cw, ch = w // cols, h // rows
    out = np.zeros_like(rgba)
    for r in range(rows):
        for c in range(cols):
            cell = rgba[r * ch : (r + 1) * ch, c * cw : (c + 1) * cw]
            ys, xs = np.where(cell[:, :, 3] > 16)
            if len(ys) == 0:
                continue
            y0, y1 = int(ys.min()), int(ys.max()) + 1
            x0, x1 = int(xs.min()), int(xs.max()) + 1
            content = cell[y0:y1, x0:x1]
            content_h = y1 - y0
            # Fade sparks stay small near the ground; bolts fill the sky column.
            if content_h >= ch * 0.32:
                ty0 = int(ch * 0.02)
                th = max(8, int(ch * 0.94))
                # Anisotropic stretch: force full cell height, keep bolt readable width.
                tw = max(8, min(int(cw * 0.55), int(round(content.shape[1] * (th / content_h) * 0.85))))
                resized = np.asarray(
                    Image.fromarray(content, "RGBA").resize((tw, th), Image.Resampling.LANCZOS)
                )
                tx = (cw - tw) // 2
                ty = ty0
                out[r * ch + ty : r * ch + ty + th, c * cw + tx : c * cw + tx + tw] = resized
            else:
                tw = min(content.shape[1], int(cw * 0.5))
                th = min(content.shape[0], int(ch * 0.28))
                resized = np.asarray(
                    Image.fromarray(content, "RGBA").resize((tw, th), Image.Resampling.LANCZOS)
                )
                tx = (cw - tw) // 2
                ty = ch - th - int(ch * 0.08)
                out[r * ch + ty : r * ch + ty + th, c * cw + tx : c * cw + tx + tw] = resized
    return out


def install(gen_name: str, out_name: str, sky_fill: bool = False) -> str:
    gen = PROJ / gen_name
    if not gen.exists():
        gen = ASSETS / gen_name
    rgba = black_to_alpha(np.asarray(Image.open(gen).convert("RGB")))
    if sky_fill:
        rgba = sky_fill_cells(rgba)
    orig = ASSETS / out_name.replace(".png", ".orig.png")
    png = ASSETS / out_name
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
    return url


SKY_FILL = set()


def main():
    for gen, out in JOBS:
        install(gen, out, sky_fill=out in SKY_FILL)


if __name__ == "__main__":
    main()
