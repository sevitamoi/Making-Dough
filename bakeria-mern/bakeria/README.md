# Grandma's Bakeria

Phone ordering for Grandma's bakery: customers scan a QR code, browse the menu (photos, allergens, nutrition), order, and pay at the counter on pickup. Grandma gets a PIN-protected dashboard with live orders, stock, sales charts and a CSV export.

MongoDB (Atlas) + Express + React (Vite) + Node 22.

## Run it

Needs Node 22+ and a MongoDB database (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works). From this folder (`bakeria-mern/bakeria`):

```bash
cp .env.example .env   # once: fill in MONGO_URI and pick a GRANDMA_PIN
npm run build     # installs client deps, builds the website into client/dist
npm start         # installs server deps, serves website + /api on http://localhost:5050
```

- Customer menu: http://localhost:5050
- Grandma's dashboard: http://localhost:5050/grandma (enter your `GRANDMA_PIN`)

After any change under `client/`, run `npm run build` again and restart `npm start`.

## Reset the demo data

```bash
npm run reseed              # wipe orders, refill stock, reload 14 days of sample orders
npm run reseed -- --empty   # wipe orders, refill stock, no sample orders
```
Works whether or not the server is running. The dashboard's "Load sample data" button does the same as the first one.

## Putting it online

`npm start` serves the website and the API from one port, so any host that can run Node works: put it behind a reverse proxy or tunnel with HTTPS and point it at port 5050.

Before going public:
- set a real `GRANDMA_PIN` (the default `1234` is for local use only; the server warns when it's unset)
- use a hosted database (`MONGO_URI`), since the server can't reach a database on your laptop
- on the dashboard, set the QR code address to your public URL and print it

Phones on the same Wi-Fi can also use `http://YOUR-LAPTOP-IP:5050` without any hosting.

## Develop with hot reload (optional)

```bash
cd server && npm install && npm run dev       # API on :5050, restarts on save
cd client && npm install && npm run dev       # site on :5173, proxies /api to :5050
```

## Settings (`.env`)

| Variable | Default | Notes |
|---|---|---|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/bakeria` | Your MongoDB connection string (e.g. Atlas) |
| `PORT` | `5050` | **Not 5000**: macOS AirPlay Receiver uses 5000 |
| `GRANDMA_PIN` | `1234` | Shared staff PIN for `/grandma` and staff API routes. **Change it.** |
| `TZ_NAME` | `America/Toronto` | Time zone for charts and the CSV |

## Changing the menu

Edit `MENU` in `server/seed.js` (prices are placeholders). Photos go in `client/public/images/`.
Translations (French, Chinese, Italian, Spanish) for each item go in `server/menu-i18n.js`; page text is in `client/src/i18n.js`.
On restart:
- price or text changes are copied into the database; orders are kept
- adding or removing an item **wipes all orders** and reloads 14 days of sample history

## Where things live

```
server/index.js    API: menu, orders, order tracking, PIN gate, stats, CSV export; serves client/dist
server/models.js   Mongoose schemas (Ingredient, MenuItem, Order)
server/seed.js     Menu (source of truth), ingredients, sample history
server/menu-i18n.js  Item names / descriptions / ingredients in fr, zh, it, es
client/src/i18n.js   Customer page text in 5 languages + language picker hook
client/src/pages/Menu.jsx       Customer side
client/src/pages/Dashboard.jsx  Grandma side (PIN gate)
```
