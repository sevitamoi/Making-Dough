import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Ingredient, MenuItem, Order } from './models.js';
import { MENU, seed } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
// .env may live in server/ or in the project root (bakeria/); server/.env wins if both exist
dotenv.config({ path: [path.join(here, '.env'), path.join(here, '../.env')] });

const TZ = process.env.TZ_NAME || 'America/Toronto';
const PIN = String(process.env.GRANDMA_PIN || '1234');
if (!process.env.GRANDMA_PIN) console.warn('GRANDMA_PIN is not set: using the default 1234. Set it in .env before putting this online.');
const MIN_PER_ORDER = 2, WAGE = 18, WASTE_RATE = 0.04; // savings assumptions: edit freely
const app = express();
app.use(cors(), express.json());
const wrap = fn => (req, res) => fn(req, res).catch(e => res.status(500).json({ error: e.message }));

// Menu + how many of each item can still be made from current stock
app.get('/api/menu', wrap(async (_, res) => {
  const [items, ings] = await Promise.all([MenuItem.find().lean(), Ingredient.find().lean()]);
  const stock = Object.fromEntries(ings.map(i => [i.key, i.stock]));
  res.json(items.map(m => ({ ...m, maxQty: Math.floor(Math.min(...m.recipe.map(r => stock[r.key] / r.qty))) })));
}));

// Place an order: deduct ingredients atomically per ingredient, roll back if anything runs out
app.post('/api/orders', wrap(async (req, res) => {
  const { name = '', items = [] } = req.body;
  const menu = await MenuItem.find({ slug: { $in: items.map(i => i.slug) } }).lean();
  const lines = items.filter(i => i.qty > 0).map(i => {
    const m = menu.find(x => x.slug === i.slug);
    return m && { slug: m.slug, name: m.name, price: m.price, qty: Math.min(99, Math.floor(i.qty)), recipe: m.recipe };
  }).filter(Boolean);
  if (!lines.length) return res.status(400).json({ error: 'Your cart is empty.' });
  const need = {};
  lines.forEach(l => l.recipe.forEach(r => (need[r.key] = (need[r.key] || 0) + r.qty * l.qty)));
  const taken = [];
  for (const [key, qty] of Object.entries(need)) {
    const r = await Ingredient.updateOne({ key, stock: { $gte: qty } }, { $inc: { stock: -qty } });
    if (!r.modifiedCount) {
      for (const [k, q] of taken) await Ingredient.updateOne({ key: k }, { $inc: { stock: q } });
      return res.status(409).json({ error: 'Something just sold out. Please check the menu and try again.' });
    }
    taken.push([key, qty]);
  }
  const last = await Order.findOne().sort({ number: -1 }).lean();
  const order = await Order.create({
    number: (last?.number || 1000) + 1, name: name.trim() || 'Guest',
    items: lines.map(({ recipe, ...l }) => l), total: lines.reduce((t, l) => t + l.price * l.qty, 0),
  });
  res.status(201).json(order);
}));

// Customer's own order status (by its unguessable id, so names/totals of other orders stay private)
app.get('/api/track/:id', wrap(async (req, res) => {
  const o = mongoose.isValidObjectId(req.params.id) && await Order.findById(req.params.id, 'number status').lean();
  o ? res.json(o) : res.status(404).json({ error: 'Order not found.' });
}));

// Everything below is Grandma-only: needs the shared PIN in the x-pin header
app.use('/api', (req, res, next) => req.get('x-pin') === PIN ? next() : res.status(401).json({ error: 'Wrong PIN' }));

// One row per item sold, for spreadsheets / analysis
app.get('/api/export.csv', wrap(async (_, res) => {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const local = d => d ? new Date(d).toLocaleString('sv-SE', { timeZone: TZ }) : '';
  const rows = [['order', 'placed_at', 'ready_at', 'minutes_to_ready', 'customer', 'status', 'item', 'qty', 'unit_price', 'line_total', 'order_total']];
  for (const o of await Order.find().sort({ number: 1 }).lean()) {
    const mins = o.doneAt ? Math.round((o.doneAt - o.createdAt) / 60000) : '';
    for (const i of o.items) rows.push([o.number, local(o.createdAt), local(o.doneAt), mins, o.name, o.status, i.name, i.qty, i.price, (i.qty * i.price).toFixed(2), o.total.toFixed(2)]);
  }
  res.type('text/csv').attachment('bakeria-orders.csv').send(rows.map(r => r.map(q).join(',')).join('\n'));
}));

app.get('/api/orders', wrap(async (req, res) => {
  const { status, limit = 50 } = req.query;
  res.json(await Order.find(status ? { status } : {}).sort({ createdAt: status === 'pending' ? 1 : -1 }).limit(+limit).lean());
}));

app.patch('/api/orders/:id', wrap(async (req, res) => {
  const { status } = req.body;
  res.json(await Order.findByIdAndUpdate(req.params.id, { status, doneAt: status === 'done' ? new Date() : null }, { new: true }));
}));

app.get('/api/inventory', wrap(async (_, res) => res.json(await Ingredient.find().sort({ name: 1 }).lean())));

app.post('/api/inventory/:key/restock', wrap(async (req, res) => {
  const ing = await Ingredient.findOne({ key: req.params.key });
  ing.stock = ing.full; await ing.save(); res.json(ing);
}));

// Dashboard numbers: sales per day, busiest hours, best sellers, savings
app.get('/api/stats', wrap(async (req, res) => {
  const days = Math.min(60, +req.query.days || 7);
  const match = { $match: { createdAt: { $gte: new Date(Date.now() - days * 864e5) } } };
  const [daily, hours, best, pending] = await Promise.all([
    Order.aggregate([match, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([match, { $group: { _id: { $hour: { date: '$createdAt', timezone: TZ } }, orders: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Order.aggregate([match, { $unwind: '$items' }, { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } } } }, { $sort: { qty: -1 } }]),
    Order.countDocuments({ status: 'pending' }),
  ]);
  const byDay = Object.fromEntries(daily.map(d => [d._id, d]));
  const series = [...Array(days)].map((_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 864e5).toLocaleDateString('en-CA', { timeZone: TZ });
    return { date, revenue: +(byDay[date]?.revenue || 0).toFixed(2), orders: byDay[date]?.orders || 0 };
  });
  const totals = series.reduce((a, d) => ({ revenue: a.revenue + d.revenue, orders: a.orders + d.orders }), { revenue: 0, orders: 0 });
  const hrs = totals.orders * MIN_PER_ORDER / 60;
  res.json({ days, series, today: series.at(-1), prev: series.at(-2) || { revenue: 0, orders: 0 }, totals, pending,
    hours: hours.map(h => ({ hour: h._id, orders: h.orders })), best,
    savings: { hours: hrs, labor: hrs * WAGE, waste: totals.revenue * WASTE_RATE } });
}));

app.post('/api/seed', wrap(async (_, res) => { await seed(true); res.json({ ok: true }); }));
app.post('/api/reset', wrap(async (_, res) => { await seed(false); res.json({ ok: true }); }));

app.use('/api', (_, res) => res.status(404).json({ error: 'Not found' }));

// Serve the built website (client/dist) from this same server, so /api is on the same domain
const dist = path.join(here, '../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_, res) => res.sendFile(path.join(dist, 'index.html')));
}

try {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bakeria');
} catch (e) {
  console.error('Could not connect to MongoDB. Check MONGO_URI in server/.env.\n', e.message);
  process.exit(1);
}
// Menu in seed.js is the source of truth. New/removed items => full reseed (wipes orders + fake history).
// Same items => just copy over edited prices/text so changes in seed.js show up on restart.
const have = await MenuItem.distinct('slug');
if (have.length !== MENU.length || MENU.some(m => !have.includes(m.slug))) {
  console.log('Menu changed: reseeding menu, inventory and sample history');
  await seed(true);
} else {
  await MenuItem.bulkWrite(MENU.map(m => ({ updateOne: { filter: { slug: m.slug }, update: { $set: m } } })));
}
const PORT = process.env.PORT || 5050; // not 5000: macOS AirPlay Receiver owns that port
app.listen(PORT, () => console.log('Running on http://localhost:' + PORT));
