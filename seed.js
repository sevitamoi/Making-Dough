import { Ingredient, MenuItem, Order } from './models.js';
const R = o => Object.entries(o).map(([key, qty]) => ({ key, qty }));
export const MENU = [
  { slug: 'parfait', name: 'Fall Parfait', price: 7.5, emoji: '🍂', bg: '#f7d774', description: 'Vanilla yogurt, spiced apples, maple granola, pumpkin swirl', allergens: ['dairy', 'gluten', 'nuts'], recipe: R({ yogurt: 120, granola: 40, apples: 60, pumpkin: 20, pecans: 5 }) },
  { slug: 'donut', name: 'Apple Cider Donut', price: 3.25, emoji: '🍩', bg: '#f2b8a2', description: 'Flour, apple cider, butter, sugar, eggs, cinnamon', allergens: ['gluten', 'dairy', 'eggs'], recipe: R({ flour: 70, apples: 20, butter: 20, sugar: 25, eggs: 0.5 }) },
  { slug: 'loaf', name: 'Pumpkin Loaf Slice', price: 4, emoji: '🎃', bg: '#f5c48a', description: 'Flour, pumpkin purée, sugar, eggs, butter, pecans', allergens: ['gluten', 'dairy', 'eggs', 'nuts'], recipe: R({ flour: 60, pumpkin: 50, sugar: 25, eggs: 0.5, butter: 15, pecans: 8 }) },
  { slug: 'croissant', name: 'Almond Croissant', price: 4.75, emoji: '🥐', bg: '#e9d3a8', description: 'Flour, butter, almonds, sugar, eggs', allergens: ['gluten', 'dairy', 'nuts', 'eggs'], recipe: R({ flour: 60, butter: 35, almonds: 20, sugar: 10, eggs: 0.3 }) },
  { slug: 'scone', name: 'Maple Pecan Scone', price: 3.75, emoji: '🥧', bg: '#d9b99b', description: 'Flour, butter, pecans, maple sugar, eggs', allergens: ['gluten', 'dairy', 'nuts', 'eggs'], recipe: R({ flour: 80, butter: 30, pecans: 15, sugar: 15, eggs: 0.3 }) },
  { slug: 'applecup', name: 'Baked Apple Cup', price: 3.5, emoji: '🍎', bg: '#b5d3a4', description: 'Apples, brown sugar, cinnamon, oat crumble', allergens: ['gluten'], recipe: R({ apples: 150, sugar: 15, flour: 15 }) },
];
const ING = [['yogurt', 'Yogurt', 'g', 6000], ['granola', 'Granola', 'g', 2500], ['apples', 'Apples', 'g', 6000], ['pumpkin', 'Pumpkin purée', 'g', 3000], ['pecans', 'Pecans', 'g', 800], ['flour', 'Flour', 'g', 9000], ['butter', 'Butter', 'g', 3000], ['sugar', 'Sugar', 'g', 3500], ['eggs', 'Eggs', '', 60], ['almonds', 'Almonds', 'g', 700]];
const rnd = (a, b) => a + Math.random() * (b - a);

export async function seed(history = true) {
  await Promise.all([Ingredient.deleteMany(), MenuItem.deleteMany(), Order.deleteMany()]);
  await MenuItem.insertMany(MENU);
  await Ingredient.insertMany(ING.map(([key, name, unit, full]) => ({ key, name, unit, full, lowAt: full * 0.25, stock: full })));
  if (!history) return;
  const now = new Date(), orders = [], names = ['Maya', 'Sam', 'Priya', 'Leo', 'Jo', 'Alex', 'Nina', 'Table 4', 'Table 7'];
  for (let d = 13; d >= 0; d--) {
    const day = new Date(now - d * 864e5), weekend = [0, 6].includes(day.getDay());
    const count = Math.round(rnd(14, 24) * (weekend ? 1.5 : 1) * (1 + (13 - d) * 0.02)); // slow upward trend
    for (let i = 0; i < count; i++) {
      let hr = Math.round((rnd(7, 17) + rnd(7, 17)) / 2); // clusters around midday
      if (d === 0) hr = Math.min(hr, now.getHours());
      const t = new Date(day); t.setHours(hr, Math.floor(rnd(0, 60)), 0, 0);
      if (t > now) continue;
      const q = {};
      for (let j = Math.ceil(rnd(0, 3)); j > 0; j--) { const m = Math.random() < 0.3 ? MENU[0] : MENU[Math.floor(rnd(0, MENU.length))]; q[m.slug] = (q[m.slug] || 0) + 1; }
      const items = Object.entries(q).map(([slug, qty]) => { const m = MENU.find(x => x.slug === slug); return { slug, name: m.name, qty, price: m.price }; });
      orders.push({ name: names[i % names.length], items, total: items.reduce((s, l) => s + l.qty * l.price, 0), createdAt: t, status: now - t < 15 * 60e3 ? 'pending' : 'done' });
    }
  }
  orders.sort((a, b) => a.createdAt - b.createdAt).forEach((o, i) => (o.number = 1001 + i));
  await Order.insertMany(orders);
  const fixed = { pecans: 0.2, granola: 0.22 }; // so the low-stock alert shows up in the demo
  for (const [key, , , full] of ING) await Ingredient.updateOne({ key }, { stock: full * (fixed[key] ?? rnd(0.4, 0.9)) });
}
