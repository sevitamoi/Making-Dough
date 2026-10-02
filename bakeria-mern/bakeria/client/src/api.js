import { useCallback, useEffect, useState } from 'react';
const j = async (url, opt = {}) => {
  const r = await fetch('/api' + url, { headers: { 'Content-Type': 'application/json' }, ...opt });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Request failed');
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
