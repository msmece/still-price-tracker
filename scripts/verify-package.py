"""Check the browser manifests inside the actual distributable archives."""
from pathlib import Path
from zipfile import ZipFile
import json

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'manifest.json').read_text())['version']
for browser in ('chrome', 'firefox'):
    path = root / 'dist' / f'price-lantern-{version}-{browser}.zip'
    with ZipFile(path) as archive:
        assert archive.testzip() is None, path
        manifest = json.loads(archive.read('manifest.json'))
        assert manifest['manifest_version'] == 3
        assert {'dashboard-view.js', 'sources.json', 'LICENSE'} <= set(archive.namelist())
        assert set(manifest['icons'].values()) <= set(archive.namelist())
        assert set(manifest['action']['default_icon'].values()) <= set(archive.namelist())
        background = manifest['background']
        if browser == 'chrome':
            assert background['service_worker'] == 'background.js'
            assert 'scripts' not in background
        else:
            assert background['scripts'] == ['background.js']
            assert 'service_worker' not in background
            assert 'browser_specific_settings' in manifest
print('Both browser archives are complete and use compatible background manifests.')
