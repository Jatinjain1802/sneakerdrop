'use client';
import { useMemo, useRef, useState } from 'react';
import Reveal from './Reveal';
import WaitlistModal from './WaitlistModal';

const LABEL = { available: 'Available', sold_out: 'Sold out', coming_soon: 'Coming soon' };
const FILTERS = [
  ['all', 'All'],
  ['available', 'Available'],
  ['coming_soon', 'Coming soon'],
  ['sold_out', 'Sold out'],
];

function Card({ p, onJoin, index }) {
  const ref = useRef(null);
  function move(e) {
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 8).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--my', `${(y + 0.5) * 100}%`);
  }
  function leave() {
    const el = ref.current;
    ['--rx', '--ry'].forEach((k) => el.style.removeProperty(k));
  }
  const cta = 'Join the waitlist';
  return (
    <Reveal delay={(index % 3) * 90}>
      <article className={`card status-${p.status}`} ref={ref} onMouseMove={move} onMouseLeave={leave} style={{ '--accent': p.accent }}>
        <div className="card-media">
          <img src={p.image_url} alt={`${p.name} sneaker`} loading="lazy" width="600" height="600" />
          <span className={`badge badge-${p.status}`}><i />{LABEL[p.status] || p.status}</span>
        </div>
        <div className="card-body">
          <div className="card-top">
            <h3>{p.name}</h3>
            <span className="price">{p.price}</span>
          </div>
          {p.tagline ? <p className="tagline">{p.tagline}</p> : null}
          <p className="desc">{p.description}</p>
          <button className="btn btn-block" onClick={() => onJoin(p)}>{cta}<span aria-hidden="true">→</span></button>
        </div>
      </article>
    </Reveal>
  );
}

export default function Catalogue({ products }) {
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);
  const shown = useMemo(() => (filter === 'all' ? products : products.filter((p) => p.status === filter)), [products, filter]);

  return (
    <section id="drops" className="section">
      <Reveal className="section-head">
        <p className="eyebrow"><i /> The current drop</p>
        <h2>Five pairs. One run.</h2>
        <p className="lead">Every pair below is pulled live from our database. Availability changes the moment we change it.</p>
      </Reveal>

      <div className="filters" role="tablist" aria-label="Filter by availability">
        {FILTERS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={filter === k} className={`chip ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
            {label}
            <small>{k === 'all' ? products.length : products.filter((p) => p.status === k).length}</small>
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="empty">No sneakers are listed right now. Check back soon.</p>
      ) : shown.length === 0 ? (
        <p className="empty">Nothing in this view right now.</p>
      ) : (
        <div className="grid">
          {shown.map((p, i) => (
            <Card key={p.id} p={p} index={i} onJoin={setActive} />
          ))}
        </div>
      )}

      <WaitlistModal product={active} onClose={() => setActive(null)} />
    </section>
  );
}
