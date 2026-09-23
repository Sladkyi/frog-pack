"""Install epic frog-style themed 12f VFX sheets."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from install_frog_style_legend_fx import PROJ, ASSETS, install  # noqa: E402

JOBS = [
    "abyss-eye-fx-v2",
    "demon-fx-v2",
    "spirit-epic-fx-v2",
]


def main() -> None:
    for stem in JOBS:
        gen = f"{stem}-gen.png"
        src = PROJ / gen
        if not src.exists():
            print(f"skip missing {gen}")
            continue
        dest = ASSETS / gen
        if src.resolve() != dest.resolve():
            shutil.copy(src, dest)
        install(gen, f"{stem}.png", sky_fill=False)


if __name__ == "__main__":
    main()
