"""Build browser-specific add-on archives from the same reviewed source."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'manifest.json').read_text())
files = ['background.js', 'capture.js', 'sources.js', 'sources.json', 'model.js',
         'app.js', 'dashboard-view.js', 'art.js', 'demo.js', 'popup.js',
         'popup.html', 'index.html', 'styles.css', 'icon-16.png', 'icon-32.png', 'icon-48.png',
         'icon-64.png', 'icon.png', 'README.md', 'LICENSE']
destination = root / 'dist'
destination.mkdir(exist_ok=True)

for browser in ('chrome', 'firefox'):
    browser_manifest = json.loads(json.dumps(manifest))
    background = browser_manifest['background']
    if browser == 'chrome':
        background.pop('scripts', None)
        browser_manifest.pop('browser_specific_settings', None)
    else:
        background.pop('service_worker', None)
        browser_manifest.pop('minimum_chrome_version', None)
    archive_path = destination / f'price-lantern-{manifest["version"]}-{browser}.zip'
    with ZipFile(archive_path, 'w', ZIP_DEFLATED) as archive:
        archive.writestr('manifest.json', json.dumps(browser_manifest, indent=2) + '\n')
        for name in files:
            archive.write(root / name, name)
    print(f'{archive_path} ({archive_path.stat().st_size:,} bytes)')
