import { Ingredient, MenuItem, Order } from './models.js';
import { MENU_I18N } from './menu-i18n.js';
const R = o => Object.entries(o).map(([key, qty]) => ({ key, qty }));
// Items, ingredients, nutrition and allergens come from
// "Socratica Baking_Hackathon/Bakery Menu Info Cards.html". PRICES ARE PLACEHOLDERS: set real ones here.
// recipe = what one item uses from inventory (rough guesses, only drives stock + "sold out").
export const MENU = withI18n([
  { slug: 'croissant', name: 'Croissant', price: 4.25, image: '/images/croissant.jpg', description: 'Flaky, buttery, baked this morning',
    ingredients: 'Wheat flour, butter, milk, sugar, yeast, eggs, salt.', allergens: ['gluten', 'dairy', 'eggs'],
    nutrition: { cal: '270 kcal', sugar: '6 g', fiber: '2 g', fat: '14 g', sodium: '310 mg' }, recipe: R({ flour: 60, butter: 35, milk: 20, sugar: 8, eggs: 0.2 }) },
  { slug: 'sourdough', name: 'Sourdough Loaf', price: 8, image: '/images/sourdough.jpg', description: 'Slow-rise loaf with a crackly crust',
    ingredients: 'Wheat flour, water, sourdough starter, salt.', allergens: ['gluten'],
    nutrition: { cal: '180 kcal', sugar: '1 g', fiber: '2 g', fat: '1 g', sodium: '420 mg' }, recipe: R({ flour: 450 }) },
  { slug: 'muffin', name: 'Blueberry Muffin', price: 3.5, image: '/images/muffin.jpg', description: 'Packed with blueberries',
    ingredients: 'Wheat flour, blueberries, sugar, butter, eggs, milk, baking powder, salt.', allergens: ['gluten', 'dairy', 'eggs'],
    nutrition: { cal: '340 kcal', sugar: '22 g', fiber: '1 g', fat: '15 g', sodium: '280 mg' }, recipe: R({ flour: 60, blueberries: 40, sugar: 30, butter: 20, eggs: 0.5, milk: 30 }) },
  { slug: 'pumpkinpie', name: 'Pumpkin Pie', price: 4.5, image: '/images/pumpkinpie.jpg', description: 'Spiced pumpkin custard, slice',
    ingredients: 'Pumpkin, wheat flour, butter, sugar, eggs, evaporated milk, cinnamon, ginger, nutmeg, salt.', allergens: ['gluten', 'dairy', 'eggs'],
    nutrition: { cal: '320 kcal', sugar: '22 g', fiber: '2 g', fat: '14 g', sodium: '260 mg' }, recipe: R({ pumpkin: 80, flour: 30, butter: 20, sugar: 20, eggs: 0.5, milk: 30 }) },
  { slug: 'applepie', name: 'Apple Pie', price: 4.5, image: '/images/applepie.jpg', description: 'Cinnamon apples in a butter crust, slice',
    ingredients: 'Apples, wheat flour, butter, sugar, cinnamon, lemon juice, salt.', allergens: ['gluten', 'dairy'],
    nutrition: { cal: '300 kcal', sugar: '20 g', fiber: '2 g', fat: '14 g', sodium: '240 mg' }, recipe: R({ apples: 120, flour: 35, butter: 25, sugar: 20 }) },
  { slug: 'creampuffs', name: 'Cream Puffs', price: 5, image: '/images/creampuffs.jpg', description: 'Choux pastry filled with vanilla cream',
    ingredients: 'Wheat flour, butter, eggs, milk, cream, sugar, vanilla, salt.', allergens: ['gluten', 'dairy', 'eggs'],
    nutrition: { cal: '240 kcal', sugar: '15 g', fiber: '1 g', fat: '15 g', sodium: '90 mg' }, recipe: R({ flour: 25, butter: 25, eggs: 1, milk: 40, cream: 60, sugar: 15 }) },
  { slug: 'tiramisu', name: 'Tiramisu', price: 6, image: '/images/tiramisu.jpg', description: 'Espresso-soaked ladyfingers, mascarpone',
    ingredients: 'Mascarpone, ladyfinger biscuits (wheat flour), eggs, sugar, espresso, cocoa powder.', allergens: ['gluten', 'dairy', 'eggs'],
    nutrition: { cal: '400 kcal', sugar: '28 g', fiber: '1 g', fat: '25 g', sodium: '90 mg' }, recipe: R({ cheese: 80, flour: 20, eggs: 1, sugar: 20 }) },
  { slug: 'cookie', name: 'Chocolate Chip Cookie', price: 2.25, image: '/images/cookie.jpg', description: 'Chewy, big chocolate chips',
    ingredients: 'Wheat flour, butter, brown sugar, sugar, eggs, chocolate chips, baking soda, vanilla, salt.', allergens: ['gluten', 'dairy', 'eggs', 'soy'],
    nutrition: { cal: '210 kcal', sugar: '14 g', fiber: '1 g', fat: '10 g', sodium: '150 mg' }, recipe: R({ flour: 30, butter: 15, sugar: 20, eggs: 0.25, chocolate: 15 }) },
  { slug: 'cheesecake', name: 'Cheesecake', price: 5.5, image: '/images/cheesecake.jpg', description: 'Creamy New York style, slice',
    ingredients: 'Cream cheese, biscuit base (wheat flour), butter, sugar, eggs, sour cream, vanilla.', allergens: ['gluten', 'dairy', 'eggs'],
    nutrition: { cal: '410 kcal', sugar: '28 g', fiber: '1 g', fat: '28 g', sodium: '340 mg' }, recipe: R({ cheese: 100, flour: 20, butter: 15, sugar: 25, eggs: 0.5, cream: 20 }) },
]);
function withI18n(items) { return items.map(m => ({ ...m, i18n: MENU_I18N[m.slug] || {} })); }
const ING = [['flour', 'Flour', 'g', 15000], ['butter', 'Butter', 'g', 4000], ['sugar', 'Sugar', 'g', 4000], ['eggs', 'Eggs', '', 90],
  ['milk', 'Milk', 'ml', 4000], ['cream', 'Cream', 'ml', 3000], ['cheese', 'Cream cheese & mascarpone', 'g', 4000], ['apples', 'Apples', 'g', 5000],
  ['pumpkin', 'Pumpkin purée', 'g', 3000], ['blueberries', 'Blueberries', 'g', 2000], ['chocolate', 'Chocolate chips', 'g', 1500]];
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
      orders.push({ name: names[i % names.length], items, total: items.reduce((s, l) => s + l.qty * l.price, 0), createdAt: t, ...(now - t < 15 * 60e3 ? { status: 'pending' } : { status: 'done', doneAt: new Date(+t + rnd(3, 14) * 60e3) }) });
    }
  }
  orders.sort((a, b) => a.createdAt - b.createdAt).forEach((o, i) => (o.number = 1001 + i));
  await Order.insertMany(orders);
  const fixed = { blueberries: 0.2, chocolate: 0.22 }; // so the low-stock alert shows up in the demo
  for (const [key, , , full] of ING) await Ingredient.updateOne({ key }, { stock: full * (fixed[key] ?? rnd(0.4, 0.9)) });
}
