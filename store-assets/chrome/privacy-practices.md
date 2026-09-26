# Chrome Web Store Privacy practices — paste-ready answers

Use these answers for the **Price Lantern 0.2.4 Chrome ZIP**. The saved Chrome Web Store page is reference material only; do not upload or publish it. Each justification below fits the 1,000-character field limit.

**Single purpose description**

> Price Lantern tracks prices for product pages selected by the user. It periodically checks the chosen price source, stores the user's observed price history and target locally, and can alert the user when the price reaches the target.

**activeTab justification**

> When the user clicks the extension on a product page, activeTab lets Price Lantern read that current tab to capture the product title and price or let the user pick the exact price. It is used only after the user initiates the action; ongoing checks require a separate per-site permission.

**scripting justification**

> Price Lantern injects its packaged price-reading and price-picker functions into the selected product page. The same packaged price-reading function is used for later checks of pages the user chose to track. It reads the selected product's title, currency and price; it does not execute downloaded JavaScript.

**storage justification**

> Chrome local storage holds the user's chosen product URLs, price-source settings, target prices, observed prices, check times and preferences. Session storage briefly holds a capture draft and temporary check-tab ID. This makes the watchlist and price history available without an account or developer server.

**alarms justification**

> A Chrome alarm wakes the extension once a minute to see whether a user-selected product is due for a price check. At most one due product is checked per wake-up. The default check interval per product is six hours, and users can change or disable automatic checks. Checks only run while Chrome is running.

**notifications justification**

> If the user enables notifications, Price Lantern requests this optional permission and shows a local notification when an observed price crosses from above the user's target to at or below it. The notification includes the product name and price. No notification permission is needed to use the watchlist.

**Host permission justification**

> The required access to raw.githubusercontent.com fetches a public JSON catalog of price-source rules, at most once daily; it does not send the user's watchlist or price history there. Optional HTTPS host access is requested for each product page or public price API the user chooses, so the extension can read its current price during tests and scheduled checks. No blanket shop access is granted at installation.

**Are you using remote code?** Select **No, I am not using remote code**. If the form still requests explanatory text, use:

> No remote JavaScript or WebAssembly is executed. All extension code and injected functions are included in the ZIP. The public GitHub resource is validated JSON containing selectors and API field paths, interpreted by packaged code; it is not executable code. Product pages may run their own scripts when opened for a price check.

**Data usage**: Select **Website content** (product title and price) and **Web history** (the specific product URLs chosen by the user and associated check times). The extension does not collect general browsing history. Leave personally identifiable, health, financial/payment, authentication, personal communications, location, and user activity unchecked. The picker uses a temporary click and pointer listener but does not record an activity log. Google treats locally processed data as data handling, so do not select “no data” merely because storage is local.

**Limited-use certification**: After verifying the disclosures against the uploaded package, check all three required statements: no sale or unapproved transfer; no unrelated use or transfer; no creditworthiness or lending use.

**Privacy policy URL**: https://github.com/msmece/still-price-tracker/blob/main/PRIVACY.md

Click **Save Draft**, then reopen the publish checks. These answers do not submit or certify the form for you.
