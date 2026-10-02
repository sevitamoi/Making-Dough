import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { api, money, usePoll } from '../api.js';

const hr12 = h => (h % 12 || 12) + (h < 12 ? 'am' : 'pm');
const ago = t => Math.max(0, Math.round((Date.now() - new Date(t)) / 60000));

export default function Dashboard() {
  const [days, setDays] = useState(7);
  const [stats, refStats] = usePoll(() => api.stats(days), [days]);
  const [orders, refOrders] = usePoll(() => Promise.all([api.orders('status=pending'), api.orders('status=done&limit=6')]), []);
  const [inv, refInv] = usePoll(api.inventory, []);
  const [addr, setAddr] = useState(location.origin);
  const refresh = () => { refStats(); refOrders(); refInv(); };
  if (!stats || !orders || !inv) return <main><p>Loading dashboard…</p></main>;

  const [pending, recent] = orders;
  const low = inv.filter(i => i.stock <= i.lowAt);
  const delta = stats.today.revenue - stats.prev.revenue;
  const aov = stats.totals.orders ? stats.totals.revenue / stats.totals.orders : 0;
  const top = Math.max(1, stats.best[0]?.qty || 1);
  const mark = async (o, s) => { await api.setStatus(o._id, s); refresh(); };

  return (
    <main>
      <h2 className="lead">Today at the shop</h2>
      <p className="sub">Updates every few seconds. New orders from phones show up on their own.</p>
      {low.length > 0 && (
        <div className="alert" role="alert">Running low: {low.map(i => `${i.name} (${Math.round(i.stock)}${i.unit} left)`).join(', ')}. Restock below.</div>
      )}

      <div className="stats">
        <div className="stat">Sales today<b>{money(stats.today.revenue)}</b>{delta >= 0 ? '+' : '−'}{money(Math.abs(delta))} vs yesterday</div>
        <div className="stat">Orders today<b>{stats.today.orders}</b>{stats.pending} waiting right now</div>
        <div className="stat">Average order<b>{money(aov)}</b>over the last {days} days</div>
        <div className="stat save">Time saved<b>{stats.savings.hours.toFixed(1)} hrs</b>over {days} days of orders</div>
        <div className="stat save">Money saved<b>{money(stats.savings.labor + stats.savings.waste)}</b>{money(stats.savings.labor)} labor + {money(stats.savings.waste)} less waste</div>
      </div>

      <section className="panel wide">
        <div className="row"><h2>Sales over time</h2>
          <div className="chips">{[7, 14, 30].map(d => <button key={d} className={'chip' + (d === days ? ' on' : '')} onClick={() => setDays(d)}>{d} days</button>)}</div>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <AreaChart data={stats.series} margin={{ left: -10, right: 8 }}>
              <CartesianGrid stroke="#eadfe7" vertical={false} />
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} fontSize={12} />
              <YAxis tickFormatter={v => '$' + v} fontSize={12} />
              <Tooltip formatter={(v, n) => [n === 'revenue' ? money(v) : v, n === 'revenue' ? 'Sales' : 'Orders']} />
              <Area dataKey="revenue" stroke="#6b2d5c" fill="#e7c9dc" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="cols">
        <section className="panel"><h2>Orders to make ({pending.length})</h2>
          {pending.length ? pending.map(o => (
            <div className={'order' + (ago(o.createdAt) > 10 ? ' late' : '')} key={o._id}>
              <div><b>#{o.number} · {o.name}</b>
                <small>{o.items.map(i => `${i.qty} × ${i.name}`).join(', ')}</small>
                <small>{ago(o.createdAt)} min ago · {money(o.total)}{ago(o.createdAt) > 10 ? ' · waiting a while' : ''}</small></div>
              <button className="btn sm" onClick={() => mark(o, 'done')}>Mark ready</button>
            </div>
          )) : <p className="empty">All caught up. New orders appear here.</p>}
          {recent.length > 0 && <><h3 className="mini">Recently finished</h3>
            {recent.map(o => <div className="order done" key={o._id}><div><b>#{o.number} · {o.name}</b><small>{money(o.total)}</small></div>
              <button className="btn sm alt" onClick={() => mark(o, 'pending')}>Undo</button></div>)}</>}
        </section>

        <section className="panel"><h2>Inventory</h2>
          {inv.map(i => {
            const isLow = i.stock <= i.lowAt;
            return (
              <div className="inv" key={i.key}>
                <div className="row"><span>{i.name}</span>
                  <span className={isLow ? 'low-t' : ''}>{Math.round(i.stock)}{i.unit} {isLow && <button className="btn sm" onClick={async () => { await api.restock(i.key); refresh(); }}>Restock</button>}</span></div>
                <div className="bar"><i className={isLow ? 'low' : ''} style={{ width: Math.max(2, i.stock / i.full * 100) + '%' }} /></div>
              </div>
            );
          })}
        </section>
      </div>

      <div className="cols">
        <section className="panel"><h2>Best sellers</h2>
          {stats.best.map(b => (
            <div className="bs" key={b._id}><span>{b._id}</span><div className="bar"><i style={{ width: b.qty / top * 100 + '%' }} /></div><b>{b.qty}</b></div>
          ))}
        </section>
        <section className="panel"><h2>Busiest hours</h2>
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={stats.hours} margin={{ left: -20 }}>
                <XAxis dataKey="hour" tickFormatter={hr12} fontSize={12} /><YAxis allowDecimals={false} fontSize={12} />
                <Tooltip labelFormatter={hr12} formatter={v => [v, 'Orders']} />
                <Bar dataKey="orders" fill="#a63d6f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="note">Bake more just before these hours.</p>
        </section>
      </div>

      <section className="panel"><h2>Menu QR code</h2>
        <div className="qrrow">
          <div id="qr"><QRCodeSVG value={addr} size={128} /></div>
          <div><label htmlFor="addr">Menu address</label>
            <input id="addr" value={addr} onChange={e => setAddr(e.target.value)} />
            <p className="note">To scan with a phone, replace "localhost" with your laptop's Wi-Fi address (for example http://192.168.1.20:5173).</p>
            <div className="tools"><button className="btn sm" onClick={async () => { await api.seed(); refresh(); }}>Load sample data</button>
              <button className="btn sm alt" onClick={async () => { await api.reset(); refresh(); }}>Clear all orders</button></div></div>
        </div>
      </section>
      <p className="note">Savings assume 2 min of staff time per hand-taken order at $18/hr, plus 4% of sales in avoided waste. Change these at the top of server/index.js.</p>
    </main>
  );
}
