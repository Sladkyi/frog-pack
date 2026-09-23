"""Rebuild compressed artwork and content-versioned URLs. Requires Pillow."""
from pathlib import Path
from PIL import Image
import hashlib
import json

root = Path(__file__).resolve().parent
output = root / 'assets/optimized'
output.mkdir(exist_ok=True)
legacy = {'hero-run-v3', 'hero-battle-v1', 'hero-stop-v1', 'hero-attack-v2',
          'sprites-v1', 'combat-fx-v1', 'chest-rummage-v1'}
manifest = {}
for source in sorted((root / 'assets').glob('*.png')):
    if source.stem in legacy:
        continue
    target = output / (source.stem + '.webp')
    if not target.exists() or source.stat().st_mtime > target.stat().st_mtime:
        with Image.open(source) as image:
            image.save(target, 'WEBP', quality=82, method=6)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
    manifest[source.name] = f'assets/optimized/{target.name}?v={digest}'
(root / 'assets-manifest.js').write_text(
    'const ASSET_URLS=' + json.dumps(manifest, indent=2) + ';\n', encoding='utf-8')
print(f'{len(manifest)} compressed atlases; {sum(p.stat().st_size for p in output.glob("*.webp"))/2**20:.2f} MiB')
