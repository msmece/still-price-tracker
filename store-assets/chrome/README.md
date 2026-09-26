# Chrome Web Store upload kit

Upload `dist/price-lantern-0.2.4-chrome.zip` as the extension package. Its `icon.png` is the 128 × 128 Chrome icon with a 96 × 96 artwork area and transparent 16 px padding. The file `icon-128.png` here is a separate preview of that exact packaged icon; Chrome reads the icon from the ZIP.

Upload these listing assets from this folder:

| Field | File | Size |
| --- | --- | --- |
| Small promotional tile (required) | `promo-small.png` | 440 × 280 |
| Marquee image (optional) | `promo-marquee.png` | 1400 × 560 |
| Screenshot 1 | `screenshot-01-watchlist.png` | 1280 × 800 |
| Screenshot 2 | `screenshot-02-add-item.png` | 1280 × 800 |
| Screenshot 3 | `screenshot-03-price-history.png` | 1280 × 800 |

The `.svg` files are editable sources for the promotional artwork and padded icon. They are not uploads. Screenshots show the app's interactive preview, explicitly labeled as sample data; no personal watchlist or account data was used.

## Listing copy

**English summary (97/132 characters):** Track prices from the shops you choose. Set a target, get alerts, and see your own price history.

**English description:**

Price Lantern helps you keep an eye on products you want, without another account. Save a product, choose a target price, and follow the prices you actually observe in a calm, full-tab watchlist.

- Track a price from a product page. When automatic detection needs help, pick the exact price or configure a page element or public JSON API.
- See your observed price history and your own lowest observed price in the last 30 days.
- Get an optional notification when a price crosses your target.
- Keep your watchlist and history in browser-local storage. Export them whenever you like.

Checks run while Chrome is open; the default interval is six hours. Shop access is requested for each site you choose to track. Some sites may block automated checks or change their pages. The 30-day figure is based only on prices Price Lantern observed; it is not a retailer's official discount reference price.

Price Lantern fetches a public price-source catalog from GitHub at most once per day. That request does not send your product URLs or price history to GitHub. Price checks contact the shops you choose.

**German summary (under 132 characters):** Behalte Preise im Blick: Produkte merken, Zielpreis festlegen und deinen eigenen Preisverlauf sehen.

**German description:**

Price Lantern hilft dir, Wunschprodukte im Blick zu behalten – ohne zusätzliches Konto. Speichere ein Produkt, lege einen Wunschpreis fest und sieh die Preise, die die Erweiterung tatsächlich beobachtet hat.

- Preis direkt auf einer Produktseite erfassen. Falls die automatische Erkennung nicht ausreicht, wähle das genaue Preiselement oder konfiguriere eine öffentliche JSON-API.
- Eigenen Preisverlauf und den niedrigsten beobachteten Preis der letzten 30 Tage ansehen.
- Auf Wunsch benachrichtigt werden, wenn der Preis deinen Zielwert erreicht oder unterschreitet.
- Wunschliste und Verlauf lokal im Browser speichern und jederzeit exportieren.

Preisprüfungen laufen, während Chrome geöffnet ist; voreingestellt sind sechs Stunden. Den Zugriff auf einen Shop erteilst du pro Website. Manche Shops blockieren automatische Prüfungen oder ändern ihre Seiten. Der 30-Tage-Wert beruht nur auf tatsächlich erfassten Preisen und ist kein offizieller Händler-Referenzpreis vor einer Reduzierung.

Price Lantern lädt höchstens einmal täglich einen öffentlichen Katalog für Preisquellen von GitHub. Dabei werden keine Produktlinks oder Preisverläufe an GitHub übertragen. Preisprüfungen rufen die von dir gewählten Shops auf.

## Suggested screenshot captions

1. Watchlist with observed prices and target status. Sample preview.
2. Add a product link and optional target price. Sample preview.
3. See observed price history and your own 30-day low. Sample preview; not an official retailer reference price.

Set the category to **Shopping**. Use the public repository as the website and its Issues page as support if those fields are available. Keep privacy disclosures aligned with the behavior described above. Do not claim universal shop compatibility or continuous background monitoring.

For the Privacy practices form, use [`privacy-practices.md`](privacy-practices.md). The public policy URL is https://github.com/msmece/still-price-tracker/blob/main/PRIVACY.md.

Chrome image guidance: https://developer.chrome.com/docs/webstore/images and https://developer.chrome.com/docs/webstore/best-listing
