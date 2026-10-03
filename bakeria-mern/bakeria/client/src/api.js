import { useCallback, useEffect, useState } from 'react';
const BASE = import.meta.env.VITE_API_URL || ''; // only set this if the API lives on a different domain
// Grandma's shared PIN, remembered on this device. Sent with every request; only staff routes check it.
const PIN_KEY = 'bakeria-pin';
const store = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };
export const getPin = () => store(() => localStorage.getItem(PIN_KEY));
export const setPin = p => store(() => p ? localStorage.setItem(PIN_KEY, p) : localStorage.removeItem(PIN_KEY));
export const WRONG_PIN = 'Wrong PIN';

const call = async (url, opt = {}) => {
  try { return await fetch(BASE + '/api' + url, { ...opt, headers: { 'Content-Type': 'application/json', 'x-pin': getPin() || '' } }); }
  catch { throw new Error('Cannot reach the server. Is the API running?'); }
};
const j = async (url, opt = {}) => {
  const r = await call(url, opt);
  const text = await r.text();
  let d = null;
  try { d = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  if (!r.ok || d === null) throw new Error(d?.error || `The server answered ${r.status} with no data. Is the API running at ${BASE || location.origin}/api ?`);
  return d;
};
export const api = {
  menu: () => j('/menu'),
  order: b => j('/orders', { method: 'POST', body: JSON.stringify(b) }),
  orders: q => j('/orders?' + q),
  setStatus: (id, status) => j('/orders/' + id, { method: 'PATCH', body: JSON.stringify({ status }) }),
  inventory: () => j('/inventory'),
  restock: k => j('/inventory/' + k + '/restock', { method: 'POST' }),
  stats: d => j('/stats?days=' + d),
  track: id => j('/track/' + id),
  exportCsv: async () => {
    const r = await call('/export.csv');
    if (!r.ok) throw new Error(r.status === 401 ? WRONG_PIN : 'Export failed (' + r.status + ')');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(await r.blob()), download: 'bakeria-orders.csv' });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  seed: () => j('/seed', { method: 'POST' }),
  reset: () => j('/reset', { method: 'POST' }),
};
export const money = n => '$' + Number(n).toFixed(2);

// Fetch now, then re-fetch every `ms` so the screen stays live without sockets
export function usePoll(fn, deps = [], ms = 5000) {
  const [data, setData] = useState(null), [err, setErr] = useState('');
  const run = useCallback(() => fn().then(x => { setData(x); setErr(''); }).catch(e => setErr(e.message)), deps); // eslint-disable-line
  useEffect(() => { run(); const t = setInterval(run, ms); return () => clearInterval(t); }, [run, ms]);
  return [data, run, err];
}
