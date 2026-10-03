import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const Ingredient = model('Ingredient', new Schema({
  key: { type: String, unique: true }, name: String, unit: String,
  stock: Number, full: Number, lowAt: Number,
}));

export const MenuItem = model('MenuItem', new Schema({
  slug: { type: String, unique: true }, name: String, price: Number, image: String,
  description: String, ingredients: String, allergens: [String],
  nutrition: { cal: String, sugar: String, fiber: String, fat: String, sodium: String }, // per serving
  i18n: Schema.Types.Mixed, // { fr: { name, description, ingredients }, zh: …, it: …, es: … } (see menu-i18n.js)
  recipe: [{ key: String, qty: Number }], // what one item consumes from inventory
}));

export const Order = model('Order', new Schema({
  number: Number, name: String,
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  items: [{ slug: String, name: String, qty: Number, price: Number }],
  total: Number, doneAt: Date,
}, { timestamps: true }));
