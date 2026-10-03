// Reset the demo: wipe orders, refill menu + inventory, reload 14 days of sample history.
// Usage (from bakeria/):  npm run reseed          or  npm run reseed -- --empty  (no sample orders)
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: [path.join(here, '.env'), path.join(here, '../.env')], quiet: true });
const empty = process.argv.includes('--empty');
await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bakeria');
await seed(!empty);
console.log(empty ? 'Reset: menu + full stock, no orders.' : 'Reseeded: menu, inventory and 14 days of sample orders.');
await mongoose.disconnect();
