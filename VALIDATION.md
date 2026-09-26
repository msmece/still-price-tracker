# MVP validation

Validated in an isolated headless Chrome profile, September 20–21, 2026.

## September 27, 2026 icon update (0.2.3)

- Replaced the bag-like icon with a lantern and descending price line. Checked the vector at 16, 32, 48, 64, and 128 px. Native-size PNGs are used for the browser toolbar and add-on managers; the 128 px PNG is used for the Firefox Add-ons listing.
- The runtime logic and listing screenshots are unchanged from 0.2.2. `npm run check` passed all 20 tests and verified both browser ZIPs. Mozilla `web-ext lint` on the Firefox package reported zero errors, notices, or warnings. The matching 0.2.3 Firefox and source ZIPs are the package pair for a new submission.

## September 26, 2026 listing update (0.2.2)

- Fixed an SVG namespace regression that prevented bundled product illustrations from rendering in the dashboard. The corrected images were visually checked in a browser and the SVG nodes use the SVG namespace.
- Added a high-contrast custom icon and three 1280 × 800 listing screenshots under `store-assets/`. The screenshots use the built-in sample preview and show no private watchlist data.
- `npm run check`: 20 passing tests and both 0.2.2 archives verified. Mozilla `web-ext lint` on the Firefox archive: zero errors, zero notices, zero warnings. The Firefox package and its matching source archive are the files to upload for this release.
- Listing PNGs were visually reviewed for private data and stripped of embedded metadata; source text and the Firefox package were scanned for common secret and local-path patterns.

## September 26, 2026 update

- The Firefox Add-ons upload archive is now browser-specific: `price-lantern-0.2.1-firefox.zip` has `background.scripts` and no `background.service_worker`. The Chrome archive keeps only `background.service_worker`.
- Dashboard cards, charts, history, and detail views use DOM nodes and `textContent` for dynamic data. No dynamic `innerHTML` assignments remain.
- `npm run check`: 20 passing tests, both browser archives built and verified.
- Mozilla `web-ext lint` on the unpacked Firefox 0.2.1 archive: zero errors, zero notices, zero warnings.
- Headless Chrome dashboard smoke check: cards, charts, stats, filters, search, detail/history, editing, 390px mobile layout, and a malicious-looking product name rendered as text passed with no script exceptions.

## September 23, 2026 update

- `npm test`: 20 passing tests, including public source-catalog validation, remote refresh/cache and offline fallback, CSS/API rule extraction, manual selector precedence, and Firefox background startup with the `browser` namespace.
- Firefox 156.0.1: `web-ext run` loaded Price Lantern as a temporary add-on in a fresh profile. The original dual-browser manifest produced warnings about the Chrome service worker and dynamic dashboard HTML. The September 26 Firefox archive removes those warnings.
- Price Lantern's renamed header fits at 390px and 1440px without page overflow or navigation overlap in the preview.
- `npm run package` builds separate Chrome and Firefox archives, both including `sources.js` and `sources.json`. Native permission approval, actual store publication/signing, and longer running background checks still require interactive browser verification.

## Passed

- Ten automated Node tests: localized prices, URL and JSON path validation, source requirements, target crossing, observed 30-day minimum, worker startup without optional notifications, persistence/error handling, concurrent saves, and rejecting messages from web-page contexts.
- Desktop preview at 1440px and narrow layout at 390px: visual inspection; cards, filters, search, detail dialog, edit followed by add, settings, escaped item names, and explicit preview-only check errors. No horizontal overflow at 390px.
- Real extension starts empty and hides the preview/sample data.
- Real service-worker API test against JYSK VIRUM: read €219, save watch, recheck, preserve two observations.
- Rendered fixture page: automatic Product/Offer JSON-LD extraction and exact CSS selector extraction both read €129.95.
- Missing selectors surface a useful error; temporary tabs close on success and failure. Failed edits retain the previous watch and history. Pause and deletion work.
- Picker: clicking the fixture price opens the editor with `#price`, selector mode, and the detected price. Escape cancels.
- Source syntax checks, Prettier formatting checks, and package archive validation.

## Limits of these checks

The production manifest loaded with optional permissions. Permission requests reached Chrome's native prompt; headless Chrome could not approve that prompt. Full network tests therefore used a disposable copy of the same source with test-only pregranted access to `https://jysk.de/*` and the local fixture server. Those grants are **not** in the shipped manifest.

OS notification delivery, native prompt approval in a normal interactive profile, Edge runtime behavior, multi-hour unattended operation, and broad retailer coverage remain unverified. The automated target-crossing test validates alert decisions, not desktop notification delivery.

Browser integration scripts were run through Chrome DevTools Protocol against disposable profiles. The repeatable dependency-free logic/worker regression suite is available via `npm test`. Test fixture pages are under `tests/fixtures`.
