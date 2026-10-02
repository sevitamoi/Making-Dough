import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Ingredient, MenuItem, Order } from './models.js';
import { seed } from './seed.js';

const TZ = process.env.TZ_NAME || 'America/Toronto';
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

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bakeria');
if (!(await MenuItem.countDocuments())) await seed(true);
app.listen(process.env.PORT || 5000, () => console.log('API on http://localhost:' + (process.env.PORT || 5000)));
