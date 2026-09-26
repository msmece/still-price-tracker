# Price Lantern 0.2.4: build instructions for Mozilla reviewers

This archive contains the readable, unminified source for Price Lantern version 0.2.4 on Firefox. Its source also builds the Chrome version from the same code.

## Build environment

The submitted Firefox ZIP was built on macOS 26.6.2 (arm64) with Python 3.14.7. The scripts use only the Python standard library and work on macOS or Linux with Python 3.8 or newer. Install Python from https://www.python.org/downloads/ if necessary and confirm with `python3 --version`. No Node.js, npm packages, network access, or other build dependencies are needed.

## Reproduce the Firefox and Chrome extensions

1. Extract this source ZIP into a new directory. Its root contains `manifest.json`, `README.md`, `store-assets/`, and `scripts/`.
2. Change into the extracted directory in a terminal.
3. Run `python3 scripts/package.py`.
4. Run `python3 scripts/verify-package.py`.
5. Upload or compare `dist/price-lantern-0.2.4-firefox.zip` with the submitted Firefox package. The Chrome file is `dist/price-lantern-0.2.4-chrome.zip`.

The script copies readable JavaScript, CSS, HTML, JSON, PNGs, and documentation unchanged. It generates browser-specific manifests from `manifest.json`: the Firefox package has background scripts; the Chrome package has a service worker. The Chrome archive uses the padded store icon at `store-assets/chrome/icon-128.png`; Firefox uses `icon.png`. This source archive includes both so the same script reproduces both packages. There is no minification, transpilation, bundling, or template processing. ZIP timestamp metadata can differ, but each file's content matches the submitted package.

`store-assets/icon.svg` is editable original vector artwork; it is not needed by the build. `PRIVACY.md` describes how the extension handles data. The build is self-contained and does not fetch source files from the internet.
