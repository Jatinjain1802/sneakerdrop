import Header from './components/Header';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Catalogue from './components/Catalogue';
import Reveal from './components/Reveal';
import { listProducts, formatPrice } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let products = [];
  let failed = false;
  try {
    products = (await listProducts()).map((p) => ({
      id: p.id, name: p.name, tagline: p.tagline, description: p.description, image_url: p.image_url,
      accent: p.accent, status: p.status, price: formatPrice(p.price_cents),
    }));
  } catch (e) {
    console.error(e);
    failed = true;
  }
  const feature = products.find((p) => p.status === 'available') || products[0];

  return (
    <>
      <Header />
      <main>
        <Hero
          image={feature?.image_url || '/sneakers/volt-runner.jpg'}
          name={feature?.name || 'Volt Runner'}
          price={feature?.price || ''}
          accent={feature?.accent || '#c6ff3d'}
        />
        <Marquee />
        {failed ? (
          <section id="drops" className="section"><p className="empty">The catalogue is temporarily unavailable. Please refresh in a moment.</p></section>
        ) : (
          <Catalogue products={products} />
        )}

        <section id="craft" className="section craft">
          <Reveal className="section-head">
            <p className="eyebrow"><i /> Why SneakerDrop</p>
            <h2>Made in small runs. Meant to be worn.</h2>
          </Reveal>
          <div className="craft-grid">
            {[
              ['01', 'Limited by design', 'Each model is produced once, in a small batch. When it is gone, it is gone.'],
              ['02', 'Comfort engineered', 'Responsive cushioning, breathable uppers and soles tuned for how you actually move.'],
              ['03', 'List-first access', 'People on the waitlist hear about a release before it goes public.'],
            ].map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 110} className="craft-card">
                <span className="num">{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="waitlist" className="section cta">
          <Reveal className="cta-card">
            <p className="eyebrow"><i /> The waitlist</p>
            <h2>Never miss a drop.</h2>
            <p className="lead">Pick any pair above and join its waitlist with your email. One signup per pair, no spam.</p>
            <a href="#drops" className="btn">Choose your pair</a>
          </Reveal>
        </section>
      </main>
      <footer className="footer">
        <span>© 2026 SneakerDrop. A fictional brand built as a portfolio project.</span>
        <a href="/admin">Admin</a>
      </footer>
    </>
  );
}
