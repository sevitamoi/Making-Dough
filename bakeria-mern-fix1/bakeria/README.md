# Grandma's Bakeria (MERN)

MongoDB + Express + React (Vite) + Node.

## Run it
1. Start MongoDB locally (or paste a free MongoDB Atlas URI into server/.env).
2. Terminal 1:  cd server && cp .env.example .env && npm install && npm run dev
3. Terminal 2:  cd client && npm install && npm run dev
4. Customer menu: http://localhost:5173    Grandma's dashboard: http://localhost:5173/grandma

First launch seeds the menu, inventory and 14 days of fake orders so the charts have data.

## Phones
The client dev server listens on your Wi-Fi and proxies /api to the server, so a phone can open
http://YOUR-LAPTOP-IP:5173 and orders go straight into the same database. Put that address in the
QR box on the dashboard.

## Where things live
server/models.js  Mongoose schemas (Ingredient, MenuItem with recipe, Order)
server/index.js   API: menu, orders (atomic stock deduction), inventory, stats aggregations
server/seed.js    Menu, ingredients, sample history
client/src/pages/Menu.jsx       Customer side
client/src/pages/Dashboard.jsx  Grandma side

## Deploying to a domain (one server does everything)
1. Set MONGO_URI in server/.env (use MongoDB Atlas; a hosted server can't see your laptop's MongoDB).
2. From this folder:  npm run build   (builds the website into client/dist)
3. Then:  npm start   (Express serves the website AND /api on PORT, default 5000)
4. Point your domain / reverse proxy at that port. Do NOT use `npm run dev` for the live site.
If the website and API are on different domains instead, build the client with
VITE_API_URL=https://your-api-domain  npm run build
