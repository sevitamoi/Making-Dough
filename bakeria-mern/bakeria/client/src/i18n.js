import { useEffect, useState } from 'react';
// Customer-side text. Allergen names, nutrition labels and "per serving" come from the menu info cards
// (Socratica Baking_Hackathon/bakery-menu (1).html); the ordering text is our own translation.
// Item names/descriptions/ingredients come from the API (MenuItem.i18n, see server/menu-i18n.js).
export const LANGS = { en: 'English', fr: 'Français', zh: '中文', it: 'Italiano', es: 'Español' };

const T = {
  en: {
    lead: 'Fresh today', sub: 'Order from your phone, then pay and pick up at the counter.', loading: 'Loading menu…',
    hideWith: 'Hide anything with:', traces: 'Everything is baked in one kitchen, so traces of any allergen are possible. If you have a serious allergy, please ask us at the counter.',
    noAllergens: 'no common allergens', facts: 'Nutrition & ingredients', ingredients: 'Ingredients', serving: 'Per serving',
    add: 'Add', soldOut: 'Sold out', addOne: 'Add one', removeOne: 'Remove one', emptyFilter: 'Everything on the menu has one of those allergens. Clear a filter to see more.',
    yourOrder: 'Your order', tapAdd: 'Tap "Add" on anything you like.', total: 'Total', nameLabel: 'Name or table number', namePh: 'e.g. Table 4',
    place: 'Place order', placing: 'Placing…', payNote: 'Pay at the counter when you pick up.',
    placed: 'Order placed. Your number is', ready: 'Ready for pickup!', comeUp: n => `Come on up, ${n}.`,
    making: n => `Thanks, ${n}! We're making it now. This page updates by itself.`, pay: 'Pay at the counter:',
    newOrder: 'Done, start a new order', orderMore: 'Order something else',
    n: { cal: 'Calories', sugar: 'Sugar', fiber: 'Fiber', fat: 'Fat', sodium: 'Sodium' },
    a: { gluten: 'Gluten', dairy: 'Dairy', eggs: 'Eggs', soy: 'Soy', peanuts: 'Peanuts', treenuts: 'Tree nuts' },
  },
  fr: {
    lead: 'Frais du jour', sub: 'Commandez depuis votre téléphone, puis payez et récupérez au comptoir.', loading: 'Chargement du menu…',
    hideWith: 'Masquer ce qui contient :', traces: 'Tout est préparé dans la même cuisine, des traces de tout allergène sont donc possibles. En cas d’allergie grave, demandez-nous au comptoir.',
    noAllergens: 'aucun allergène courant', facts: 'Valeurs nutritionnelles et ingrédients', ingredients: 'Ingrédients', serving: 'Par portion',
    add: 'Ajouter', soldOut: 'Épuisé', addOne: 'Ajouter un', removeOne: 'Retirer un', emptyFilter: 'Tous les produits contiennent un de ces allergènes. Retirez un filtre pour en voir plus.',
    yourOrder: 'Votre commande', tapAdd: 'Touchez « Ajouter » sur ce qui vous plaît.', total: 'Total', nameLabel: 'Nom ou numéro de table', namePh: 'ex. Table 4',
    place: 'Commander', placing: 'Envoi…', payNote: 'Payez au comptoir en récupérant votre commande.',
    placed: 'Commande passée. Votre numéro est', ready: 'Prête à récupérer !', comeUp: n => `Venez au comptoir, ${n}.`,
    making: n => `Merci, ${n} ! Nous la préparons. Cette page se met à jour toute seule.`, pay: 'À payer au comptoir :',
    newOrder: 'Terminé, nouvelle commande', orderMore: 'Commander autre chose',
    n: { cal: 'Calories', sugar: 'Sucres', fiber: 'Fibres', fat: 'Matières grasses', sodium: 'Sodium' },
    a: { gluten: 'Gluten', dairy: 'Produits laitiers', eggs: 'Œufs', soy: 'Soja', peanuts: 'Arachides', treenuts: 'Fruits à coque' },
  },
  zh: {
    lead: '今日新鲜出炉', sub: '用手机下单，到柜台付款取餐。', loading: '正在加载菜单…',
    hideWith: '隐藏含有以下成分的产品：', traces: '所有产品都在同一厨房制作，可能含有任何过敏原的微量成分。如有严重过敏，请在柜台咨询我们。',
    noAllergens: '不含常见过敏原', facts: '营养成分与配料', ingredients: '配料', serving: '每份',
    add: '加入', soldOut: '已售完', addOne: '加一份', removeOne: '减一份', emptyFilter: '所有产品都含有所选过敏原。请取消一个筛选查看更多。',
    yourOrder: '您的订单', tapAdd: '点击喜欢的产品上的“加入”。', total: '合计', nameLabel: '姓名或桌号', namePh: '例如：4号桌',
    place: '下单', placing: '正在下单…', payNote: '取餐时在柜台付款。',
    placed: '下单成功。您的号码是', ready: '可以取餐了！', comeUp: n => `${n}，请到柜台取餐。`,
    making: n => `谢谢，${n}！我们正在制作。本页面会自动更新。`, pay: '柜台付款：',
    newOrder: '完成，开始新订单', orderMore: '再点别的',
    n: { cal: '热量 (千卡)', sugar: '糖', fiber: '膳食纤维', fat: '脂肪', sodium: '钠' },
    a: { gluten: '麸质', dairy: '乳制品', eggs: '鸡蛋', soy: '大豆', peanuts: '花生', treenuts: '树坚果' },
  },
  it: {
    lead: 'Freschi di oggi', sub: 'Ordina dal telefono, poi paga e ritira al banco.', loading: 'Caricamento del menu…',
    hideWith: 'Nascondi ciò che contiene:', traces: 'Tutto è preparato nella stessa cucina, quindi sono possibili tracce di qualsiasi allergene. Se hai un’allergia grave, chiedi al banco.',
    noAllergens: 'nessun allergene comune', facts: 'Valori nutrizionali e ingredienti', ingredients: 'Ingredienti', serving: 'Per porzione',
    add: 'Aggiungi', soldOut: 'Esaurito', addOne: 'Aggiungi uno', removeOne: 'Togli uno', emptyFilter: 'Tutti i prodotti contengono uno di questi allergeni. Togli un filtro per vederne altri.',
    yourOrder: 'Il tuo ordine', tapAdd: 'Tocca “Aggiungi” su ciò che ti piace.', total: 'Totale', nameLabel: 'Nome o numero del tavolo', namePh: 'es. Tavolo 4',
    place: 'Ordina', placing: 'Invio…', payNote: 'Paga al banco quando ritiri.',
    placed: 'Ordine effettuato. Il tuo numero è', ready: 'Pronto da ritirare!', comeUp: n => `Vieni pure al banco, ${n}.`,
    making: n => `Grazie, ${n}! Lo stiamo preparando. Questa pagina si aggiorna da sola.`, pay: 'Da pagare al banco:',
    newOrder: 'Fatto, nuovo ordine', orderMore: 'Ordina qualcos’altro',
    n: { cal: 'Calorie', sugar: 'Zuccheri', fiber: 'Fibre', fat: 'Grassi', sodium: 'Sodio' },
    a: { gluten: 'Glutine', dairy: 'Latticini', eggs: 'Uova', soy: 'Soia', peanuts: 'Arachidi', treenuts: 'Frutta a guscio' },
  },
  es: {
    lead: 'Recién horneado', sub: 'Pide desde tu teléfono y luego paga y recoge en el mostrador.', loading: 'Cargando el menú…',
    hideWith: 'Ocultar lo que contenga:', traces: 'Todo se hornea en la misma cocina, así que puede haber trazas de cualquier alérgeno. Si tienes una alergia grave, pregúntanos en el mostrador.',
    noAllergens: 'sin alérgenos comunes', facts: 'Información nutricional e ingredientes', ingredients: 'Ingredientes', serving: 'Por porción',
    add: 'Añadir', soldOut: 'Agotado', addOne: 'Añadir uno', removeOne: 'Quitar uno', emptyFilter: 'Todo el menú contiene alguno de esos alérgenos. Quita un filtro para ver más.',
    yourOrder: 'Tu pedido', tapAdd: 'Toca «Añadir» en lo que te guste.', total: 'Total', nameLabel: 'Nombre o número de mesa', namePh: 'p. ej. Mesa 4',
    place: 'Hacer pedido', placing: 'Enviando…', payNote: 'Paga en el mostrador al recoger.',
    placed: 'Pedido realizado. Tu número es', ready: '¡Listo para recoger!', comeUp: n => `Acércate al mostrador, ${n}.`,
    making: n => `¡Gracias, ${n}! Lo estamos preparando. Esta página se actualiza sola.`, pay: 'A pagar en el mostrador:',
    newOrder: 'Listo, nuevo pedido', orderMore: 'Pedir algo más',
    n: { cal: 'Calorías', sugar: 'Azúcares', fiber: 'Fibra', fat: 'Grasas', sodium: 'Sodio' },
    a: { gluten: 'Gluten', dairy: 'Lácteos', eggs: 'Huevos', soy: 'Soja', peanuts: 'Cacahuetes', treenuts: 'Frutos secos' },
  },
};
export const ALLERGEN_ICONS = { gluten: '🌾', dairy: '🥛', eggs: '🥚', soy: '🫘', peanuts: '🥜', treenuts: '🌰' };

const KEY = 'bakeria-lang';
const initial = () => {
  try { const saved = localStorage.getItem(KEY); if (T[saved]) return saved; } catch { /* storage blocked */ }
  const nav = (navigator.language || 'en').slice(0, 2);
  return T[nav] ? nav : 'en';
};

// Current language (remembered per device, defaults to the phone's language) + its strings
export function useLang() {
  const [lang, setLang] = useState(initial);
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
    try { localStorage.setItem(KEY, lang); } catch { /* storage blocked */ }
  }, [lang]);
  return [lang, setLang, T[lang]];
}

// An item's text in the chosen language, falling back to English
export const local = (m, lang) => ({ ...m, ...(m.i18n?.[lang] || {}) });
