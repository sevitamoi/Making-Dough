import { useEffect, useState } from 'react';
import { api, money, usePoll } from '../api.js';
import { ALLERGEN_ICONS, LANGS, local, useLang } from '../i18n.js';
const NUTRITION = ['cal', 'sugar', 'fiber', 'fat', 'sodium'];
const LAST = 'bakeria-last-order'; // remember the customer's order so a refresh keeps the status screen
const load = () => { try { return JSON.parse(localStorage.getItem(LAST)); } catch { return null; } };
const save = o => { try { o ? localStorage.setItem(LAST, JSON.stringify(o)) : localStorage.removeItem(LAST); } catch { /* private mode */ } };

export default function Menu() {
  const [lang, setLang, t] = useLang();
  const [menu, refresh, loadErr] = usePoll(api.menu, [], 8000);
  const [cart, setCart] = useState({}), [hide, setHide] = useState([]), [name, setName] = useState('');
  const [placed, setPlacedRaw] = useState(load), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const setPlaced = o => { save(o); setPlacedRaw(o); };
  const langs = (
    <div className="chips langs" role="group" aria-label="Language">
      {Object.entries(LANGS).map(([k, label]) => (
        <button key={k} lang={k} className={'chip' + (k === lang ? ' on' : '')} aria-pressed={k === lang} onClick={() => setLang(k)}>{label}</button>
      ))}
    </div>
  );
  if (!menu) return <main>{langs}<p>{loadErr || t.loading}</p></main>;

  const by = Object.fromEntries(menu.map(m => [m.slug, local(m, lang)]));
  const lines = Object.entries(cart).filter(([s]) => by[s]);
  const total = lines.reduce((sum, [s, q]) => sum + by[s].price * q, 0);
  const add = (s, d) => setCart(c => {
    const n = (c[s] || 0) + d, { [s]: _, ...rest } = c;
    return n <= 0 ? rest : n > by[s].maxQty ? c : { ...c, [s]: n };
  });
  const place = async () => {
    setBusy(true);
    try {
      setErr('');
      const o = await api.order({ name, items: lines.map(([slug, qty]) => ({ slug, qty })) });
      setPlaced({ id: o._id, number: o.number, name: o.name, total: o.total, items: lines.map(([s, q]) => `${q} × ${by[s].name}`) });
      setCart({});
    } catch (e) { setErr(e.message); }
    setBusy(false);
    refresh();
  };
  const allergen = a => `${ALLERGEN_ICONS[a] || ''} ${t.a[a] || a}`.trim();
  const shown = menu.filter(m => !m.allergens.some(a => hide.includes(a))).map(m => by[m.slug]);

  return (
    <main>
      {langs}
      <h2 className="lead">{t.lead}</h2>
      <p className="sub">{t.sub}</p>
      <div className="chips"><span>{t.hideWith}</span>
        {Object.keys(ALLERGEN_ICONS).map(a => (
          <button key={a} className={'chip' + (hide.includes(a) ? ' on' : '')} aria-pressed={hide.includes(a)}
            onClick={() => setHide(h => h.includes(a) ? h.filter(x => x !== a) : [...h, a])}>{allergen(a)}</button>
        ))}
      </div>
      <p className="note warn-note">{t.traces}</p>
      <div className="layout">
        <div className="grid">
          {shown.length ? shown.map(m => {
            const n = cart[m.slug] || 0, canAdd = n < m.maxQty;
            return (
              <article className="item" key={m.slug}>
                <div className="pic">{m.image && <img src={m.image} alt={m.name} loading="lazy" />}</div>
                <div className="body">
                  <div className="row"><h3>{m.name}</h3><span className="price">{money(m.price)}</span></div>
                  <p className="ing">{m.description}</p>
                  <div className="tags">
                    {m.allergens.length ? m.allergens.map(a => <span className="tag" key={a}>{allergen(a)}</span>) : <span className="tag free">{t.noAllergens}</span>}
                  </div>
                  <details className="facts">
                    <summary>{t.facts}</summary>
                    <p><b>{t.ingredients}:</b> {m.ingredients}</p>
                    {m.nutrition && <dl>{NUTRITION.map(k => m.nutrition[k] && <div key={k}><dt>{t.n[k]}</dt><dd>{m.nutrition[k]}</dd></div>)}</dl>}
                    <p className="note">{t.serving}</p>
                  </details>
                  <div style={{ marginTop: 'auto' }}>
                    {n ? (
                      <div className="qty">
                        <button aria-label={`${t.removeOne}: ${m.name}`} onClick={() => add(m.slug, -1)}>−</button><b>{n}</b>
                        <button aria-label={`${t.addOne}: ${m.name}`} disabled={!canAdd} onClick={() => add(m.slug, 1)}>+</button>
                      </div>
                    ) : <button className="btn full" disabled={!canAdd} onClick={() => add(m.slug, 1)}>{canAdd ? t.add : t.soldOut}</button>}
                  </div>
                </div>
              </article>
            );
          }) : <p className="empty">{t.emptyFilter}</p>}
        </div>

        {placed ? <OrderStatus order={placed} t={t} onDone={() => setPlaced(null)} /> : (
          <div className="panel cart"><h2>{t.yourOrder}</h2>
            {lines.length ? lines.map(([s, q]) => <div className="line" key={s}><span>{q} × {by[s].name}</span><span>{money(by[s].price * q)}</span></div>)
              : <p className="empty">{t.tapAdd}</p>}
            <div className="total">{t.total} {money(total)}</div>
            <label htmlFor="nm">{t.nameLabel}</label>
            <input id="nm" value={name} onChange={e => setName(e.target.value)} placeholder={t.namePh} />
            {err && <p className="err" role="alert">{err}</p>}
            <button className="btn full" disabled={!lines.length || busy} onClick={place}>{busy ? t.placing : t.place}</button>
            <p className="note">{t.payNote}</p>
          </div>
        )}
      </div>
    </main>
  );
}

// Live "is it ready?" panel: polls this one order until Grandma marks it ready
function OrderStatus({ order, t, onDone }) {
  const [status, setStatus] = useState('pending');
  useEffect(() => {
    let stop = false;
    const check = () => api.track(order.id).then(o => !stop && setStatus(o.status))
      .catch(e => !stop && /not found/i.test(e.message) && onDone()); // order wiped (e.g. demo reset)
    check();
    const timer = setInterval(check, 5000);
    return () => { stop = true; clearInterval(timer); };
  }, [order.id]); // eslint-disable-line
  const ready = status === 'done';
  return (
    <div className={'panel confirm' + (ready ? ' ready' : '')} role="status" aria-live="polite">
      <p>{ready ? t.ready : t.placed}</p>
      <div className="num">#{order.number}</div>
      <p>{ready ? t.comeUp(order.name) : t.making(order.name)}</p>
      {order.items && <p className="note">{order.items.join(', ')}</p>}
      <p>{t.pay} <b>{money(order.total)}</b></p>
      <button className="btn" onClick={onDone}>{ready ? t.newOrder : t.orderMore}</button>
    </div>
  );
}
