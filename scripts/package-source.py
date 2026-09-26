"""Create the readable source archive used for Firefox add-on review."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'manifest.json').read_text())['version']
files = [
    'manifest.json', 'background.js', 'capture.js', 'sources.js', 'sources.json',
    'model.js', 'app.js', 'dashboard-view.js', 'art.js', 'demo.js', 'popup.js',
    'popup.html', 'index.html', 'styles.css', 'icon-16.png', 'icon-32.png',
    'icon-48.png', 'icon-64.png', 'icon.png', 'README.md', 'LICENSE',
    'PRIVACY.md', 'README-BUILD.md', 'scripts/package.py',
    'scripts/verify-package.py', 'scripts/package-source.py',
    'scripts/verify-source.py', 'store-assets/icon.svg',
    'store-assets/chrome/icon-128.png'
]
destination = root / 'dist' / f'price-lantern-{version}-source.zip'
destination.parent.mkdir(exist_ok=True)
with ZipFile(destination, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, name)
print(f'{destination} ({destination.stat().st_size:,} bytes)')
