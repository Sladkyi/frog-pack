# Runtime artwork loading

PNG sources are retained. The game uses 19 dimension-preserving WebP atlases (quality 82), 6.11 MiB total. Initial scene requests five atlases, about 1.86 MiB: forest, base frog, shared sprites, weapon icons and starter attack effects. Remaining armor, enemy and weapon atlases are requested for the current scene/inventory. Travel art is requested during victory. Simulation waits for required scene images; a failed WebP request falls back to the source PNG and a further failure displays a loading error.

The four obsolete hero sheets have no source URLs and are not downloaded. SVG inventory icons use the same versioned WebP URLs as Canvas, avoiding duplicate PNG downloads. External font loading was removed.

Rebuild with `python optimize_assets.py` (Pillow required). Content hashes in assets-manifest.js change when artwork changes. The local server caches versioned optimized assets for one year; code/HTML revalidate. Original dimensions and transparency are preserved, so atlas coordinates remain valid. Full decoded texture memory is not reduced by this conversion; delayed loading reduces the initial set.
