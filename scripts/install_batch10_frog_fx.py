"""Install batch of frog-style weapon VFX (12f)."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from install_frog_style_legend_fx import PROJ, ASSETS, install  # noqa: E402

JOBS = [
    "frost-scepter-fx-v2",
    "thunder-hammer-fx-v2",
    "holy-flail-fx-v2",
    "blood-falchion-fx-v2",
    "tide-trident-fx-v2",
    "plague-censer-fx-v2",
    "astral-mirror-fx-v2",
    "starfall-shard-fx-v2",
    "tome-fx-v4",
    "solar-bow-fx-v2",
]


def main() -> None:
    for stem in JOBS:
        gen = f"{stem}-gen.png"
        src = PROJ / gen
        if not src.exists():
            raise SystemExit(f"missing {src}")
        dest = ASSETS / gen
        if src.resolve() != dest.resolve():
            shutil.copy(src, dest)
        install(gen, f"{stem}.png", sky_fill=False)


if __name__ == "__main__":
    main()
