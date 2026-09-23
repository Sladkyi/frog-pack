"""Remove rejected themed FX sheets; keep abyss-eye-fx-v2."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
JUNK = [
    "frost", "inferno", "solar", "rune", "astral", "thunder-slam", "holy", "blood",
    "earth", "spirit", "tide", "plague", "clockwork", "starfall", "phantom", "siege",
]
PROJ = Path(r"C:\Users\User\.cursor\projects\c-Users-User-Documents-ChatGPT-go-w-go\assets")


def rm(path: Path) -> None:
    if path.exists():
        path.unlink()
        print("rm", path)


def main() -> None:
    for s in JUNK:
        for base in (ROOT / "assets", ROOT / "dist" / "assets"):
            rm(base / f"{s}-fx-v2.png")
            rm(base / f"{s}-fx-v2.orig.png")
            rm(base / f"{s}-fx-v2-gen.png")
            rm(base / "optimized" / f"{s}-fx-v2.webp")
        rm(PROJ / f"{s}-fx-v2-gen.png")

    man = ROOT / "assets-manifest.js"
    text = man.read_text(encoding="utf-8")
    for s in JUNK:
        text = re.sub(rf'  "{s}-fx-v2(?:\.orig)?\.png": "[^"]+",?\n', "", text)
    man.write_text(text, encoding="utf-8")
    print("manifest ok", "abyss-eye-fx-v2.png" in text)


if __name__ == "__main__":
    main()
