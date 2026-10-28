'use client';
import { useEffect, useRef, useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function WaitlistModal({ product, onClose }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [msg, setMsg] = useState('');
  const input = useRef(null);

  useEffect(() => {
    if (!product) return;
    setEmail('');
    setState('idle');
    setMsg('');
    const t = setTimeout(() => input.current?.focus(), 80);
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [product, onClose]);

  if (!product) return null;

  async function submit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setState('error');
      setMsg('Enter a valid email address.');
      input.current?.focus();
      return;
    }
    setState('loading');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, productId: product.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState('done');
        setMsg(data.message || "You're on the list.");
      } else {
        setState('error');
        setMsg(data.error || 'Something went wrong.');
      }
    } catch {
      setState('error');
      setMsg('Network error. Please try again.');
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="wl-title" style={{ '--accent': product.accent }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-shoe"><img src={product.image_url} alt="" /></div>
        {state === 'done' ? (
          <div className="modal-done">
            <svg viewBox="0 0 52 52" className="tick" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M14 27l8 8 16-17" /></svg>
            <h3 id="wl-title">{msg}</h3>
            <p>Your email is saved for this pair. One signup per email per pair.</p>
            <button className="btn" onClick={onClose}>Back to the drops</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="eyebrow"><i /> Waitlist</p>
            <h3 id="wl-title">{product.name}</h3>
            <p className="modal-sub">Leave your email to join the waitlist for this pair.</p>
            <label htmlFor="wl-email">Email address</label>
            <input
              id="wl-email"
              ref={input}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={state === 'error'}
              aria-describedby="wl-msg"
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === 'error') setState('idle');
              }}
              maxLength={254}
            />
            <p id="wl-msg" className={`form-msg ${state === 'error' ? 'err' : ''}`} role="alert">{state === 'error' ? msg : ''}</p>
            <button className="btn btn-block" disabled={state === 'loading'}>
              {state === 'loading' ? 'Joining…' : 'Join the waitlist'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
