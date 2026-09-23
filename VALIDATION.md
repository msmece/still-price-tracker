# MVP validation

Validated in an isolated headless Chrome profile, September 20–21, 2026.

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
