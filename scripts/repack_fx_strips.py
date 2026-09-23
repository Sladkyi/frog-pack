"""Clean leftover gray/black plates and repack 6-frame FX strips into square cells."""
from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FILES = [
    "hammer-fx-v2.png",
    "tome-fx-v2.png",
    "scythe-fx-v2.png",
    "orb-fx-v2.png",
    "dagger-fx-v2.png",
]
COLS = 6
PAD_FRAC = 0.08
CELL = 448  # square cell edge
EDGE_SHAVE = 5  # drop generator bleed between columns
OUT_GUTTER = 6  # keep transparent gutters between packed cells


def clean_bg(rgba: np.ndarray) -> np.ndarray:
    """Drop leftover flat gray/black plates; keep painted chroma and outlines."""
    out = rgba.copy()
    a = out[:, :, 3].astype(np.int16)
    r = out[:, :, 0].astype(np.int16)
    g = out[:, :, 1].astype(np.int16)
    b = out[:, :, 2].astype(np.int16)
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    chroma = mx - mn

    # Flat light-gray / checker leftovers (hammer plates).
    light_plate = (a > 20) & (chroma <= 14) & (mx >= 200)
    # Flat near-black plates (not brown outlines: those have chroma or mid value).
    dark_plate = (a > 20) & (chroma <= 16) & (mx <= 36)
    kill = light_plate | dark_plate

    # Soft near-white fringe sitting next to transparency (scythe halo).
    near_clear = np.zeros_like(a, dtype=bool)
    near_clear[1:, :] |= a[:-1, :] < 16
    near_clear[:-1, :] |= a[1:, :] < 16
    near_clear[:, 1:] |= a[:, :-1] < 16
    near_clear[:, :-1] |= a[:, 1:] < 16
    white_fringe = near_clear & (a > 20) & (chroma <= 20) & (mx >= 210)
    kill |= white_fringe

    out[kill] = (0, 0, 0, 0)

    # Tiny alpha speckles
    a2 = out[:, :, 3]
    weak = (a2 > 0) & (a2 < 28)
    out[weak] = (0, 0, 0, 0)
    return out


def content_bbox(cell: np.ndarray, thr: int = 36):
    ys, xs = np.where(cell[:, :, 3] > thr)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def load_source(path: Path) -> np.ndarray:
    orig = path.with_name(path.stem + ".orig.png")
    src_path = orig if orig.exists() else path
    return np.array(Image.open(src_path).convert("RGBA"))


def repack(path: Path) -> None:
    src = load_source(path)
    cleaned = clean_bg(src)
    h, w, _ = cleaned.shape
    cw = w // COLS

    crops = []
    max_side = 0
    for c in range(COLS):
        x0 = c * cw + EDGE_SHAVE
        x1 = (c + 1) * cw - EDGE_SHAVE
        cell = cleaned[:, x0:x1]
        bb = content_bbox(cell)
        if bb is None:
            crops.append(None)
            continue
        bx0, by0, bx1, by1 = bb
        pad = 3
        bx0 = max(0, bx0 - pad)
        by0 = max(0, by0 - pad)
        bx1 = min(cell.shape[1], bx1 + pad)
        by1 = min(h, by1 + pad)
        crop = cell[by0:by1, bx0:bx1]
        crops.append(crop)
        max_side = max(max_side, crop.shape[0], crop.shape[1])

    if max_side == 0:
        raise RuntimeError(f"No content in {path.name}")

    inner = int(CELL * (1 - 2 * PAD_FRAC))
    scale = min(2.2, inner / max_side)

    atlas = np.zeros((CELL, CELL * COLS, 4), dtype=np.uint8)
    for c, crop in enumerate(crops):
        if crop is None:
            continue
        ch, cw_ = crop.shape[:2]
        nw = max(1, int(round(cw_ * scale)))
        nh = max(1, int(round(ch * scale)))
        resized = np.array(
            Image.fromarray(crop, "RGBA").resize((nw, nh), Image.Resampling.LANCZOS)
        )
        dx = c * CELL + (CELL - nw) // 2
        dy = CELL - int(CELL * PAD_FRAC) - nh
        dy = max(int(CELL * PAD_FRAC * 0.35), dy)
        # Clamp so we never write into neighbor gutters.
        x_lo = c * CELL + OUT_GUTTER
        x_hi = (c + 1) * CELL - OUT_GUTTER
        src_x0 = max(0, x_lo - dx)
        src_x1 = min(nw, x_hi - dx)
        if src_x1 <= src_x0:
            continue
        paste = resized[:, src_x0:src_x1]
        dest_x = dx + src_x0
        atlas[dy : dy + nh, dest_x : dest_x + paste.shape[1]] = paste

    # Hard clear gutters between cells.
    for c in range(COLS):
        atlas[:, c * CELL : c * CELL + OUT_GUTTER] = 0
        atlas[:, (c + 1) * CELL - OUT_GUTTER : (c + 1) * CELL] = 0

    out = Image.fromarray(atlas, "RGBA")
    bak = path.with_name(path.stem + ".orig.png")
    if not bak.exists():
        Image.fromarray(src, "RGBA").save(bak)
    out.save(path)
    print(f"{path.name}: src {w}x{h} -> {out.size[0]}x{out.size[1]}  max_src={max_side} scale={scale:.2f}")


def main():
    for name in FILES:
        path = ASSETS / name
        if not path.exists():
            print("missing", name)
            continue
        repack(path)


if __name__ == "__main__":
    main()
