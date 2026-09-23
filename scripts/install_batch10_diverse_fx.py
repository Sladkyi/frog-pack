"""Install 10 diverse frog-style hit VFX (no props). Black-key → webp + manifest."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from install_frog_style_legend_fx import PROJ, ASSETS, install  # noqa: E402

# gen filename in Cursor/project assets → installed stem
JOBS = [
    ("fx-b-helix-v2-gen.png", "dragon-pike-fx-v1.png"),
    ("fx-e-bubbles-v2-gen.png", "chaos-flail-fx-v1.png"),
    ("fx-g-crescents-v2-gen.png", "moon-glaive-fx-v1.png"),
    ("fx-i-sawring-v2-gen.png", "clockwork-trap-fx-v1.png"),
]


def main() -> None:
    for gen_name, out_name in JOBS:
        src = PROJ / gen_name
        if not src.exists():
            src = ASSETS / gen_name
        if not src.exists():
            raise SystemExit(f"missing {gen_name}")
        dest = ASSETS / gen_name
        if src.resolve() != dest.resolve():
            shutil.copy(src, dest)
        install(gen_name, out_name, sky_fill=False)


if __name__ == "__main__":
    main()
