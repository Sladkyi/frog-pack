"""Read alpha gutters and write crop metadata; never modifies source artwork."""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parent.parent
regions = {}
for source in sorted((root / 'assets').glob('epic-*-frames-v1.png')):
    with Image.open(source) as im:
        alpha = im.getchannel('A')
        w, h = im.size
        boundaries = []
        for axis, extent, count in [(0, w, 4), (1, h, 3)]:
            cuts = [0]
            for i in range(1, count):
                ideal = round(extent * i / count)
                clear = []
                for n in range(ideal - 60, ideal + 61):
                    strip = alpha.crop((n, 0, n + 1, h) if axis == 0 else (0, n, w, n + 1))
                    if strip.getextrema()[1] <= 16:
                        clear.append(n)
                assert clear, (source.name, axis, i, 'No transparent gutter')
                groups = []
                for n in clear:
                    if not groups or n != groups[-1][-1] + 1:
                        groups.append([])
                    groups[-1].append(n)
                gap = max(groups, key=len)
                cuts.append(gap[len(gap) // 2])
            cuts.append(extent)
            boundaries.append(cuts)
        regions[source.stem.removesuffix('-frames-v1')] = dict(cols=boundaries[0], rows=boundaries[1])
        assert alpha.getextrema() == (0, 255)
        print(source.name, im.size, boundaries)
(root / 'assets/epic-frame-regions.js').write_text('const EPIC_REGIONS = ' + json.dumps(regions) + ';\n', encoding='utf-8')

