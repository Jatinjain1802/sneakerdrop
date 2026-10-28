'use client';
import { useCallback, useEffect, useState } from 'react';

const STATUS = { available: 'Available', sold_out: 'Sold out', coming_soon: 'Coming soon' };
const EMPTY = { name: '', tagline: '', description: '', price: '', image_url: '/sneakers/volt-runner.jpg', accent: '#c6ff3d', status: 'available', sort_order: 0 };

async function api(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json' } });
  if (res.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Session expired');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function Dashboard({ email }) {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null | {id?, ...fields}
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(''), 2600);
  };

  const load = useCallback(async () => {
    try {
      const [p, w] = await Promise.all([api('/api/admin/products'), api('/api/admin/waitlist')]);
      setProducts(p.products);
      setEntries(w.entries);
    } catch (e) {
      flash(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(p, status) {
    try {
      await api(`/api/admin/products/${p.id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, status } : x)));
      flash(`${p.name} is now ${STATUS[status].toLowerCase()}`);
    } catch (e) { flash(e.message); }
  }

  async function remove(p) {
    if (!window.confirm(`Delete ${p.name}? Its waitlist signups are deleted too.`)) return;
    try {
      await api(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      flash(`${p.name} deleted`);
      load();
    } catch (e) { flash(e.message); }
  }

  async function removeEntry(en) {
    if (!window.confirm(`Remove ${en.email} from ${en.product_name}?`)) return;
    try {
      await api(`/api/admin/waitlist/${en.id}`, { method: 'DELETE' });
      load();
    } catch (e) { flash(e.message); }
  }

  async function save(e) {
    e.preventDefault();
    const body = JSON.stringify({ ...editing, price: Number(editing.price) });
    try {
      if (editing.id) await api(`/api/admin/products/${editing.id}`, { method: 'PUT', body });
      else await api('/api/admin/products', { method: 'POST', body });
      flash(editing.id ? 'Changes saved' : 'Sneaker added');
      setEditing(null);
      load();
    } catch (er) { flash(er.message); }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  const shownEntries = filter === 'all' ? entries : entries.filter((x) => String(x.product_id) === filter);
  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  return (
    <div className="admin">
      <header className="admin-top">
        <a href="/" className="logo"><span className="logo-mark">SD</span><span>SneakerDrop</span><em>Admin</em></a>
        <div className="admin-user">
          <span>{email}</span>
          <a href="/" target="_blank" rel="noreferrer" className="btn btn-small btn-ghost">View site</a>
          <button className="btn btn-small btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="admin-body">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'products'} className={tab === 'products' ? 'on' : ''} onClick={() => setTab('products')}>Products <small>{products.length}</small></button>
          <button role="tab" aria-selected={tab === 'waitlist'} className={tab === 'waitlist' ? 'on' : ''} onClick={() => setTab('waitlist')}>Waitlist <small>{entries.length}</small></button>
        </div>

        {loading ? <p className="empty">Loading…</p> : tab === 'products' ? (
          <section>
            <div className="admin-bar">
              <h1>Products</h1>
              <button className="btn btn-small" onClick={() => setEditing({ ...EMPTY })}>+ Add sneaker</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Sneaker</th><th>Price</th><th>Availability</th><th>Waitlist</th><th /></tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td><div className="cell-shoe"><img src={p.image_url} alt="" /><div><strong>{p.name}</strong><small>{p.tagline}</small></div></div></td>
                      <td>${(p.price_cents / 100).toFixed(2)}</td>
                      <td>
                        <select value={p.status} onChange={(e) => setStatus(p, e.target.value)} aria-label={`Availability for ${p.name}`} className={`sel sel-${p.status}`}>
                          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </td>
                      <td>{p.waitlist_count}</td>
                      <td className="actions">
                        <button className="link" onClick={() => setEditing({ ...p, price: (p.price_cents / 100).toString() })}>Edit</button>
                        <button className="link danger" onClick={() => remove(p)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {!products.length && <tr><td colSpan="5" className="empty">No products yet. Add your first sneaker.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section>
            <div className="admin-bar">
              <h1>Waitlist submissions</h1>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by product" className="sel">
                <option value="all">All products</option>
                {products.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Email</th><th>Product</th><th>Joined</th><th /></tr></thead>
                <tbody>
                  {shownEntries.map((en) => (
                    <tr key={en.id}>
                      <td>{en.email}</td>
                      <td>{en.product_name}</td>
                      <td>{new Date(en.created_at).toLocaleString()}</td>
                      <td className="actions"><button className="link danger" onClick={() => removeEntry(en)}>Remove</button></td>
                    </tr>
                  ))}
                  {!shownEntries.length && <tr><td colSpan="4" className="empty">No signups yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}>
          <form className="modal modal-form" onSubmit={save}>
            <button type="button" className="modal-close" onClick={() => setEditing(null)} aria-label="Close">×</button>
            <h3>{editing.id ? 'Edit sneaker' : 'Add sneaker'}</h3>
            <div className="form-grid">
              <div><label>Name</label><input value={editing.name} onChange={set('name')} required minLength={2} maxLength={80} /></div>
              <div><label>Price (USD)</label><input type="number" min="0" step="0.01" value={editing.price} onChange={set('price')} required /></div>
              <div className="span2"><label>Tagline</label><input value={editing.tagline} onChange={set('tagline')} maxLength={100} /></div>
              <div className="span2"><label>Description</label><textarea rows="3" value={editing.description} onChange={set('description')} required minLength={10} maxLength={600} /></div>
              <div className="span2"><label>Image URL (https:// or /path in /public)</label><input value={editing.image_url} onChange={set('image_url')} required /></div>
              <div><label>Availability</label>
                <select value={editing.status} onChange={set('status')}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              </div>
              <div><label>Accent colour</label><input type="color" value={editing.accent} onChange={set('accent')} /></div>
              <div><label>Sort order</label><input type="number" value={editing.sort_order} onChange={set('sort_order')} /></div>
            </div>
            <button className="btn btn-block">{editing.id ? 'Save changes' : 'Add sneaker'}</button>
          </form>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
