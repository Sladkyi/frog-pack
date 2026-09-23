"""Chroma-key legendary/mythic attack sheets and drop the painted ground bars."""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = Path(r"C:\Users\User\.cursor\projects\c-Users-User-Documents-ChatGPT-go-w-go\assets")
DST = Path(r"C:\Users\User\Documents\ChatGPT\go w go\assets")
NAMES = [
    "eclipse-censer-fx",
    "supernova-scroll-fx",
    "thunder-hammer-fx",
    "holy-flail-fx",
    "demon-axe-fx",
    "void-greatsword-fx",
    "bone-scythe-fx",
    "solar-bow-fx",
    "phantom-barrage-fx",
    "spirit-lance-fx",
    "phoenix-lance-fx",
    "abyssal-eye-fx",
    "doomsday-bell-fx",
    "starfall-shard-fx",
]


def key_magenta(rgb):
    bg = rgb[0, 0].astype(np.int16)
    d = np.linalg.norm(rgb.astype(np.int16) - bg, axis=2)
    alpha = np.clip((d - 28) / 22 * 255, 0, 255).astype(np.uint8)
    # Pull magenta spill off the fringe toward the ink color.
    spill = (d < 70) & (alpha > 0)
    out = rgb.copy()
    mag = np.minimum(out[:, :, 0], out[:, :, 2]).astype(np.int16)
    green = out[:, :, 1].astype(np.int16)
    excess = np.clip(mag - green, 0, 255)
    out[:, :, 0] = np.where(spill, np.clip(out[:, :, 0].astype(np.int16) - excess // 2, 0, 255), out[:, :, 0]).astype(np.uint8)
    out[:, :, 2] = np.where(spill, np.clip(out[:, :, 2].astype(np.int16) - excess // 2, 0, 255), out[:, :, 2]).astype(np.uint8)
    return out, alpha


def _row_median(rgb_row, alpha_row):
    mask = alpha_row > 40
    cover = float(mask.mean())
    if cover < 0.01:
        return cover, None
    return cover, np.median(rgb_row[mask].astype(np.int16), axis=0)


def _dirt(med):
    # Flat storybook soil, not fire, lightning, or a violet blast.
    return (
        med[0] < 175
        and med[1] < 130
        and med[2] < 110
        and med[0] > med[2] + 12
        and med[0] + 15 > med[1]
    )


def drop_ground(rgb, alpha):
    h, w = alpha.shape
    cols, rows = 4, 3
    cw, ch = w // cols, h // rows
    for row in range(rows):
        for col in range(cols):
            x0, y0 = col * cw, row * ch
            a = alpha[y0:y0 + ch, x0:x0 + cw]
            c = rgb[y0:y0 + ch, x0:x0 + cw]
            dirt = []
            for y in range(ch):
                cover, med = _row_median(c[y], a[y])
                if cover >= 0.42 and med is not None and _dirt(med):
                    dirt.append(y)
            if not dirt:
                continue
            clusters = [[dirt[0]]]
            for y in dirt[1:]:
                if y - clusters[-1][-1] <= 3:
                    clusters[-1].append(y)
                else:
                    clusters.append([y])
            # Only a short soil strip sitting on the cell floor. A bronze censer is taller and higher.
            band = clusters[-1]
            top, bot = band[0], band[-1]
            if bot < ch - 48 or len(band) < 8 or len(band) > 56:
                continue
            while top > 0:
                cover, med = _row_median(c[top - 1], a[top - 1])
                if cover >= 0.2 and med is not None and med[1] < 90 and med[2] > 40 and med[0] > 60:
                    top -= 1
                    continue
                break
            kept_a = a[:top].copy()
            kept_c = c[:top].copy()
            a[:] = 0
            c[:] = 0
            dest = ch - top
            a[dest:dest + top] = kept_a
            c[dest:dest + top] = kept_c
    return rgb, alpha


def drop_islands(rgb, alpha):
    """Remove short soil patches that touch the cell floor. Leaves tall props."""
    h, w = alpha.shape
    cols, rows = 4, 3
    cw, ch = w // cols, h // rows
    color = rgb.astype(np.int16)
    dirt = (
        (alpha > 40)
        & (color[:, :, 0] < 175)
        & (color[:, :, 1] < 140)
        & (color[:, :, 2] < 120)
        & (color[:, :, 0] > color[:, :, 2] + 12)
    )
    for row in range(rows):
        for col in range(cols):
            x0, y0 = col * cw, row * ch
            zone = np.zeros_like(dirt)
            floor = y0 + int(ch * 0.72)
            zone[floor:y0 + ch, x0:x0 + cw] = dirt[floor:y0 + ch, x0:x0 + cw]
            labeled, count = ndimage.label(zone)
            for idx in range(1, count + 1):
                ys, xs = np.where(labeled == idx)
                if ys.size < 12:
                    continue
                if ys.max() < y0 + ch - 36:
                    continue
                if ys.max() - ys.min() > 52:
                    continue
                if xs.max() - xs.min() < int(cw * 0.28):
                    continue
                alpha[ys, xs] = 0
    return alpha


def repack_phantom(rgb, alpha):
    """The generated sheet is 4x4. Keep 12 frames in the game's 4x3 grid."""
    h, w = alpha.shape
    col_empty = [x for x in range(w) if (alpha[:, x] > 20).mean() < 0.012]
    row_empty = [y for y in range(h) if (alpha[y] > 20).mean() < 0.012]

    def bands(empty, limit):
        spans = []
        if not empty:
            return [(0, limit)]
        gaps = []
        start = prev = empty[0]
        for v in empty[1:]:
            if v == prev + 1:
                prev = v
            else:
                if prev - start > 8:
                    gaps.append((start, prev))
                start = prev = v
        if prev - start > 8:
            gaps.append((start, prev))
        cursor = 0
        for g0, g1 in gaps:
            if g0 > cursor + 8:
                spans.append((cursor, g0))
            cursor = g1 + 1
        if cursor < limit - 8:
            spans.append((cursor, limit))
        return spans

    cb, rb = bands(col_empty, w), bands(row_empty, h)
    cells = [(x0, y0, x1, y1) for y0, y1 in rb for x0, x1 in cb]
    if len(cells) < 12:
        return rgb, alpha
    pick = cells[:12]
    sheet_c = np.zeros((864, 1152, 3), np.uint8)
    sheet_a = np.zeros((864, 1152), np.uint8)
    for i, (x0, y0, x1, y1) in enumerate(pick):
        crop_a = alpha[y0:y1, x0:x1]
        crop_c = rgb[y0:y1, x0:x1]
        ys, xs = np.where(crop_a > 20)
        if ys.size == 0:
            continue
        sprite_a = crop_a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        sprite_c = crop_c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        sh, sw = sprite_a.shape
        scale = min(250 / max(sw, 1), 250 / max(sh, 1), 1)
        if scale < 1:
            sprite_c = np.asarray(Image.fromarray(sprite_c).resize((max(1, int(sw * scale)), max(1, int(sh * scale))), Image.Resampling.LANCZOS))
            sprite_a = np.asarray(Image.fromarray(sprite_a).resize(sprite_c.shape[1::-1], Image.Resampling.LANCZOS))
            sh, sw = sprite_a.shape
        col, row = i % 4, i // 4
        dx = col * 288 + max(0, (288 - sw) // 2)
        dy = row * 288 + max(0, 288 - sh - 6)
        sheet_c[dy:dy + sh, dx:dx + sw] = sprite_c
        sheet_a[dy:dy + sh, dx:dx + sw] = sprite_a
    return sheet_c, sheet_a


def main():
    DST.mkdir(parents=True, exist_ok=True)
    for name in NAMES:
        src = SRC / f"{name}.png"
        rgb = np.asarray(Image.open(src).convert("RGB"))
        rgb, alpha = key_magenta(rgb)
        if name == "phantom-barrage-fx":
            rgb, alpha = repack_phantom(rgb, alpha)
        else:
            rgb, alpha = drop_ground(rgb, alpha)
        alpha = drop_islands(rgb, alpha)
        out = np.dstack([rgb, alpha])
        dest = DST / f"{name}-v1.png"
        Image.fromarray(out, "RGBA").save(dest, optimize=True)
        opaque = int((alpha > 16).mean() * 100)
        print(f"{dest.name} opaque {opaque}%")


if __name__ == "__main__":
    main()
