'use client';
import { useState } from 'react';

export default function Login() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: f.get('email'), password: f.get('password') }),
    });
    if (res.ok) {
      window.location.href = '/admin';
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Sign in failed');
      setBusy(false);
    }
  }
  return (
    <main className="admin-login">
      <form onSubmit={submit} className="login-card">
        <a href="/" className="logo"><span className="logo-mark">SD</span><span>SneakerDrop</span></a>
        <h1>Admin sign in</h1>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        <p className="form-msg err" role="alert">{error}</p>
        <button className="btn btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
