'use client';
import { useEffect, useState } from 'react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <a href="#top" className="logo" aria-label="SneakerDrop home">
        <span className="logo-mark">SD</span>
        <span>SneakerDrop</span>
      </a>
      <nav className={`nav ${open ? 'open' : ''}`} aria-label="Primary">
        <a href="#drops" onClick={() => setOpen(false)}>The Drops</a>
        <a href="#craft" onClick={() => setOpen(false)}>Craft</a>
        <a href="#waitlist" onClick={() => setOpen(false)}>Waitlist</a>
      </nav>
      <a href="#drops" className="btn btn-small header-cta">Shop the drop</a>
      <button className={`burger ${open ? 'open' : ''}`} aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span /><span />
      </button>
    </header>
  );
}
