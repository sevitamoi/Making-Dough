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
