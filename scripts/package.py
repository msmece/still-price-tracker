"""Package only runtime files and instructions; no dependencies or build step."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'manifest.json').read_text())
files = ['manifest.json', 'background.js', 'capture.js', 'sources.js', 'sources.json', 'model.js', 'app.js',
         'art.js', 'demo.js', 'popup.js', 'popup.html', 'index.html',
         'styles.css', 'icon.png', 'README.md', 'LICENSE']
destination = root / 'dist' / f'price-lantern-{manifest["version"]}.zip'
destination.parent.mkdir(exist_ok=True)
with ZipFile(destination, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, name)
print(f'{destination} ({destination.stat().st_size:,} bytes)')
