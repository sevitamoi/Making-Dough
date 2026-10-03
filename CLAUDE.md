# CLAUDE.md: Making Dough (Grandma's Bakeria)

> **Maintenance rule:** this file is the project's shared memory and is **public**. Record non-obvious findings (gotchas, decisions, status) here in the same session, and prune anything no longer true. Never put personal infra, hostnames, credentials or local paths here; those go in the git-ignored `CLAUDE.local.md`.

## What this is

Socratica Baking Buildathon project: software for a grandma's bakery.
- **Customer side (priority):** scan QR → menu in 5 languages with photos, allergen filter, nutrition & ingredients → order → live "ready for pickup" status. Pay at the counter on pickup (no online payment, by decision).
- **Grandma side:** `/grandma`, shared PIN. Live order queue, inventory with low-stock alerts, sales/busiest-hours/best-seller charts, CSV export of all orders for analysis.

## Layout

| Path | Status |
|---|---|
| `bakeria-mern/bakeria/` | **The app.** Everything runs from here (see its README). |
| `Socratica Baking_Hackathon/` | Menu info cards + item photos. **Source of truth for menu content** (`bakery-menu (1).html`). |
| `archive/` | Early standalone HTML prototypes (browser-only, no API). Reference only; `grandmas-dashboard.html` has ideas not yet ported (day drill-down, "Plan for <day>"). |

Teammates push via GitHub web upload, so files can land at odd paths or without extensions. `git pull` before starting.

## Run

```bash
cd bakeria-mern/bakeria
cp .env.example .env         # then set MONGO_URI (e.g. MongoDB Atlas) and GRANDMA_PIN
npm run build && npm start   # http://localhost:5050, dashboard at /grandma
npm run reseed               # reset demo data (-- --empty for no orders); server need not be running
```

## Gotchas (verified)

- **Port 5000 = macOS AirPlay Receiver** (`Server: AirTunes`, returns 403). Never use it. App defaults to 5050; Vite dev proxy → 5050.
- **`.env` may live in `bakeria-mern/bakeria/` or `server/`.** `server/index.js` and `server/reseed.js` load both explicitly (`server/.env` wins). Don't revert to `import 'dotenv/config'` (it only reads the cwd, and `npm start` runs from `server/`).
- No `MONGO_URI` → falls back to `mongodb://127.0.0.1:27017/bakeria`; without a local MongoDB the server exits with `ECONNREFUSED`.
- `GRANDMA_PIN` defaults to `1234` for local use; the server prints a warning when it's unset. Set it before exposing the app publicly.
- **Menu reseed:** on startup, if the slugs in `server/seed.js` `MENU` differ from the DB, the server **wipes all orders** and reseeds 14 days of fake history. Same slugs → only prices/text/translations are synced; orders are kept.
- Staff routes = every `/api/*` route registered after the PIN middleware in `server/index.js`. Public routes (menu, place order, `/api/track/:id`) must stay **above** it.
- Sample history only leaves orders from the last 15 min "pending", so right after a reseed the "Orders to make" queue is usually empty. Place a few orders before demoing it.
- **Translations (en/fr/zh/it/es), customer side only.** Item text: `server/menu-i18n.js` (names + ingredients verbatim from the cards; taglines machine-translated, needs native-speaker check). Page text: `client/src/i18n.js` (allergen/nutrition labels from the cards, the rest machine-translated). Language defaults to the phone's, remembered per device. Orders, dashboard and CSV stay English. Server error messages are English only.
- Adding a menu item = add it to `MENU` in `seed.js` **and** to `menu-i18n.js` (falls back to English if missing), plus a photo in `client/public/images/`.
- UI changes so far were verified via build + API tests only, not screenshots.
- Order numbers are `max+1` (race possible under simultaneous orders). Fine for demo scale.

## Decisions (2026-10-02)

- Menu = the 9 card items only (croissant, sourdough, muffin, pumpkin pie, apple pie, cream puffs, tiramisu, cookie, cheesecake).
- **Prices are placeholders** (in `seed.js`) until Grandma gives real ones.
- Pickup + pay at counter is enough. Shared PIN for staff.
- Keep fake history for demo charts; wiping it is fine.
- Allergen set: gluten, dairy, eggs, soy, peanuts, tree nuts + a cross-contact note.
- Repo is public-facing: self-contained, no personal infra or references to other private repos.

## Next up

1. Check the UI on a real phone (all 5 languages; Chinese labels may wrap differently).
2. Real prices from Grandma.
3. Port the day drill-down / "Plan for tomorrow" views from `archive/grandmas-dashboard.html`.
4. Error handling on dashboard actions (Mark ready / Restock don't surface failures).
