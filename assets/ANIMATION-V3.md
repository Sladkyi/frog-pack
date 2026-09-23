# Unique attack FX v2

Each new weapon has its **own** 6-frame strip (not a recolored staff beam).

| File | Attack | Silhouette |
|------|--------|------------|
| `hammer-fx-v2.png` | Hammer slam | Falling hammer → crater + shockwave ring |
| `tome-fx-v2.png` | Tome | Ground magic circle + raining rune tiles |
| `scythe-fx-v2.png` | Scythe | Wide horizontal leaf crescent sweep |
| `orb-fx-v2.png` | Orb | Orbiting constellation → radial burst |
| `dagger-fx-v2.png` | Dagger | Multi-angle gold stab streaks |

Staff beam remains `beam-frames-v2.png` only.

## Packing

`scripts/repack_fx_strips.py` cleans leftover gray/black plates, crops each frame to opaque bounds, and packs **6×448²** bottom-anchored square cells (`*.orig.png` keeps the raw generate). Runtime `drawStripFx` draws full cells (no mid-band crop).
