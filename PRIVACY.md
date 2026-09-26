# Price Lantern Privacy Policy (Chrome and Firefox extensions)

Effective September 27, 2026. This policy describes Price Lantern version 0.2.4 and later for Chrome and Firefox.

Price Lantern helps you monitor prices on product pages you choose. It has no account, analytics, advertising, or developer-operated collection server.

## Data the extension handles

When you add a watch, the extension reads the selected product page or a public price API to obtain a product title and current price. It stores the product URL, title, currency, selected price source (including a CSS selector or API URL when configured), optional target price, observed prices and check times, and your settings in the browser's local extension storage. A short-lived draft and the ID of a temporary check tab can be kept in session storage. The price picker temporarily observes pointer movement and your click so you can select a price; it does not store a pointer or click log. Price Lantern does not read your general browsing history.

## Network requests and sharing

Price checks contact only the HTTPS product pages or public APIs that you choose to track. A page check briefly opens the product page in an inactive tab, so that shop receives a normal page request and its own page scripts may run. A direct API price check omits cookies and rejects redirects. The extension asks for access to each shop origin before tracking it.

The extension also fetches a public JSON price-source catalog from `raw.githubusercontent.com` at most once every 24 hours, with a bundled fallback. That catalog request does not include your product URLs, target prices, or history. GitHub may receive ordinary connection information such as your IP address. The catalog is data, not executable code. Price Lantern does not send your watchlist or price history to the developer, sell data, or share it for advertising.

## Storage and control

Your watchlist and history remain in the browser's local extension storage. Each watch retains up to 2,000 observations. You can pause a watch, delete it and its history, or export your data as a JSON file. Exported files are under your control. Optional notifications are shown locally when a price crosses your target; notification permission is requested only if you enable them.

For questions or deletion help, use the [project's support page](https://github.com/msmece/still-price-tracker/issues).
