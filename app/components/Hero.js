'use client';
import { useRef } from 'react';

export default function Hero({ image, name, price, accent }) {
  const stage = useRef(null);
  function move(e) {
    const el = stage.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
    el.style.setProperty('--tx', `${(x * 18).toFixed(1)}px`);
  }
  function leave() {
    const el = stage.current;
    if (!el) return;
    ['--rx', '--ry', '--tx'].forEach((k) => el.style.removeProperty(k));
  }
  return (
    <section id="top" className="hero" style={{ '--accent': accent }}>
      <div className="hero-copy">
        <p className="eyebrow hero-in" style={{ '--d': '0ms' }}><i /> Drop 04 / Autumn 2026</p>
        <h1 className="hero-title">
          <span className="line"><span style={{ '--d': '80ms' }}>Run it.</span></span>
          <span className="line"><span style={{ '--d': '190ms' }}>Own it.</span></span>
          <span className="line"><span className="outline" style={{ '--d': '300ms' }}>Drop it.</span></span>
        </h1>
        <p className="hero-sub hero-in" style={{ '--d': '460ms' }}>
          Small-batch sneakers, released in limited runs. Pick your pair and join its waitlist with your email.
        </p>
        <div className="hero-actions hero-in" style={{ '--d': '560ms' }}>
          <a href="#drops" className="btn">Explore the drops</a>
          <a href="#waitlist" className="btn btn-ghost">How the waitlist works</a>
        </div>
        <dl className="hero-stats hero-in" style={{ '--d': '680ms' }}>
          <div><dt>05</dt><dd>pairs this drop</dd></div>
          <div><dt>0</dt><dd>restocks, ever</dd></div>
          <div><dt>1x</dt><dd>small-batch run</dd></div>
        </dl>
      </div>
      <div className="hero-stage-wrap hero-in" style={{ '--d': '300ms' }}>
        <div className="hero-stage" ref={stage} onMouseMove={move} onMouseLeave={leave}>
          <div className="hero-glow" />
          <img src={image} alt={`${name} sneaker`} className="hero-shoe" width="900" height="900" fetchPriority="high" />
          <div className="hero-tag">
            <span>Featured</span>
            <strong>{name}</strong>
            <em>{price}</em>
          </div>
        </div>
      </div>
      <a href="#drops" className="scroll-cue" aria-label="Scroll to drops"><span /></a>
    </section>
  );
}
