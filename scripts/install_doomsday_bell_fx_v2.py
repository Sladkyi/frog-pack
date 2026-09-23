"""Install doomsday-bell-fx-v2: black-key gen → transparent 4×3 sheet + webp + manifest."""
from __future__ import annotations

import hashlib
import re
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
GEN = Path(
    r"C:\Users\User\.cursor\projects\c-Users-User-Documents-ChatGPT-go-w-go"
    r"\assets\doomsday-bell-fx-v2-gen.png"
)
NAME = "doomsday-bell-fx-v2.png"


def black_to_alpha(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Turn near-black field into transparency; keep warm gold chroma."""
    c = rgb.astype(np.int16)
    mx = np.maximum(np.maximum(c[:, :, 0], c[:, :, 1]), c[:, :, 2])
    mn = np.minimum(np.minimum(c[:, :, 0], c[:, :, 1]), c[:, :, 2])
    chroma = mx - mn
    # Flat black / near-black plate
    kill = (mx <= 42) & (chroma <= 18)
    # Soft near-black fringe next to content
    alpha = np.where(kill, 0, 255).astype(np.uint8)
    # Soften very dark low-chroma rim toward transparent
    soft = (~kill) & (mx < 70) & (chroma < 28)
    alpha = np.where(soft, np.clip((mx - 28) * 8, 0, 255), alpha).astype(np.uint8)
    return rgb, alpha


def main():
    rgb = np.asarray(Image.open(GEN).convert("RGB"))
    rgb, alpha = black_to_alpha(rgb)
    out = np.dstack([rgb, alpha])
    orig = ASSETS / "doomsday-bell-fx-v2.orig.png"
    png = ASSETS / NAME
    Image.fromarray(out, "RGBA").save(orig)
    Image.fromarray(out, "RGBA").save(png, optimize=True)

    webp = ASSETS / "optimized" / "doomsday-bell-fx-v2.webp"
    webp.parent.mkdir(parents=True, exist_ok=True)
    Image.open(png).save(webp, "WEBP", quality=85, method=3)
    digest = hashlib.md5(webp.read_bytes()).hexdigest()[:12]
    url = f"assets/optimized/doomsday-bell-fx-v2.webp?v={digest}"

    man = ROOT / "assets-manifest.js"
    text = man.read_text(encoding="utf-8")
    key = f'"{NAME}": "{url}"'
    if f'"{NAME}"' in text:
        text2, n = re.subn(rf'"{re.escape(NAME)}":\s*"[^"]+"', key, text)
        assert n
    else:
        text2 = text.replace("const ASSET_URLS={\n", f"const ASSET_URLS={{\n  {key},\n")
    man.write_text(text2, encoding="utf-8")
    print("ok", Image.open(png).size, url, f"opaque={(alpha>16).mean()*100:.1f}%")


if __name__ == "__main__":
    main()
