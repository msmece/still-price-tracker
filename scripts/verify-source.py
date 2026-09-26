"""Rebuild both extension ZIPs from the source archive and compare file content."""
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZipFile
import json
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'manifest.json').read_text())['version']
source = root / 'dist' / f'price-lantern-{version}-source.zip'
with TemporaryDirectory() as temporary:
    extracted = Path(temporary)
    with ZipFile(source) as archive:
        assert archive.testzip() is None
        archive.extractall(extracted)
    subprocess.run([sys.executable, 'scripts/package.py'], cwd=extracted, check=True,
                   capture_output=True)
    subprocess.run([sys.executable, 'scripts/verify-package.py'], cwd=extracted,
                   check=True, capture_output=True)
    for browser in ('chrome', 'firefox'):
        name = f'price-lantern-{version}-{browser}.zip'
        with ZipFile(root / 'dist' / name) as submitted, ZipFile(extracted / 'dist' / name) as rebuilt:
            assert set(submitted.namelist()) == set(rebuilt.namelist()), name
            for entry in submitted.namelist():
                assert submitted.read(entry) == rebuilt.read(entry), (name, entry)
print('Both extension archives reproduce exactly from the readable source archive.')
