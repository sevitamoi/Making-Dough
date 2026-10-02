import { useState } from 'react';
import { api, money, usePoll } from '../api.js';
const ALLERGENS = ['nuts', 'dairy', 'gluten', 'eggs'];

export default function Menu() {
  const [menu, refresh, loadErr] = usePoll(api.menu, [], 8000);
  const [cart, setCart] = useState({}), [hide, setHide] = useState([]), [name, setName] = useState('');
  const [placed, setPlaced] = useState(null), [err, setErr] = useState('');
  if (!menu) return <main><p>{loadErr || 'Loading menu…'}</p></main>;

  const by = Object.fromEntries(menu.map(m => [m.slug, m]));
  const lines = Object.entries(cart);
  const total = lines.reduce((t, [s, q]) => t + by[s].price * q, 0);
  const add = (s, d) => setCart(c => {
    const n = (c[s] || 0) + d, { [s]: _, ...rest } = c;
    return n <= 0 ? rest : n > by[s].maxQty ? c : { ...c, [s]: n };
  });
  const place = async () => {
    try { setErr(''); setPlaced(await api.order({ name, items: lines.map(([slug, qty]) => ({ slug, qty })) })); setCart({}); }
    catch (e) { setErr(e.message); }
    refresh();
  };
  const shown = menu.filter(m => !m.allergens.some(a => hide.includes(a)));

  return (
    <main>
      <h2 className="lead">Fresh today</h2>
      <p className="sub">Order from your phone. Allergens are listed on every item.</p>
      <div className="chips"><span>Hide anything with:</span>
        {ALLERGENS.map(a => (
          <button key={a} className={'chip' + (hide.includes(a) ? ' on' : '')} aria-pressed={hide.includes(a)}
            onClick={() => setHide(h => h.includes(a) ? h.filter(x => x !== a) : [...h, a])}>{a}</button>
        ))}
      </div>
      <div className="layout">
        <div className="grid">
          {shown.length ? shown.map(m => {
            const n = cart[m.slug] || 0, canAdd = n < m.maxQty;
            return (
              <article className="item" key={m.slug}>
                <div className="pic" style={{ background: m.bg }} aria-hidden>{m.emoji}</div>
                <div className="body">
                  <div className="row"><h3>{m.name}</h3><span className="price">{money(m.price)}</span></div>
                  <p className="ing">{m.description}</p>
                  <div className="tags">
                    {m.allergens.length ? m.allergens.map(a => <span className="tag" key={a}>contains {a}</span>) : <span className="tag free">no common allergens</span>}
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    {n ? (
                      <div className="qty">
                        <button aria-label={'Remove one ' + m.name} onClick={() => add(m.slug, -1)}>−</button><b>{n}</b>
                        <button aria-label={'Add one ' + m.name} disabled={!canAdd} onClick={() => add(m.slug, 1)}>+</button>
                      </div>
                    ) : <button className="btn full" disabled={!canAdd} onClick={() => add(m.slug, 1)}>{canAdd ? 'Add' : 'Sold out'}</button>}
                  </div>
                </div>
              </article>
            );
          }) : <p className="empty">Everything on the menu has one of those allergens. Clear a filter to see more.</p>}
        </div>

        {placed ? (
          <div className="panel confirm" role="status">
            <p>Order placed. Your number is</p><div className="num">#{placed.number}</div>
            <p>Thanks, {placed.name}! Pay at the counter: <b>{money(placed.total)}</b></p>
            <button className="btn" onClick={() => setPlaced(null)}>Order something else</button>
          </div>
        ) : (
          <div className="panel cart"><h2>Your order</h2>
            {lines.length ? lines.map(([s, q]) => <div className="line" key={s}><span>{q} × {by[s].name}</span><span>{money(by[s].price * q)}</span></div>)
              : <p className="empty">Tap "Add" on anything you like.</p>}
            <div className="total">Total {money(total)}</div>
            <label htmlFor="nm">Name or table number</label>
            <input id="nm" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Table 4" />
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn full" disabled={!lines.length} onClick={place}>Place order</button>
            <p className="note">Pay at the counter when you pick up.</p>
          </div>
        )}
      </div>
    </main>
  );
}
