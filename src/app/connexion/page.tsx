'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function ConnexionPage() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    const client = createSupabaseBrowserClient();
    if (!client) {
      setStatus('La connexion est momentanément indisponible. Réessayez plus tard.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    setBusy(true);
    const { error } = await client.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setStatus('Connexion impossible. Vérifiez vos informations et la confirmation de votre adresse email.');
      return;
    }
    const next = new URLSearchParams(window.location.search).get('next');
    const destination = next && next.startsWith('/') && !next.startsWith('//') ? next : '/espace';
    window.location.assign(destination);
  }

  return <main className="wrap" style={{ maxWidth: 620 }}>
    <header className="topbar"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><Link href="/" className="button">Accueil</Link></div></header>
    <section className="page-title"><div className="eyebrow">Espace personnel</div><h1>Connexion</h1><p className="lead">Connectez-vous à votre compte FACEAFRICA.</p></section>
    <form className="feature" onSubmit={submit}>
      <div className="field"><label htmlFor="email">Adresse email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={320}/></div>
      <div className="field" style={{ marginTop: 16 }}><label htmlFor="password">Mot de passe</label><input id="password" name="password" type="password" autoComplete="current-password" required/></div>
      <p><Link href="/mot-de-passe-oublie">Mot de passe oublié ?</Link></p>
      <button className="button primary" type="submit" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
      {status && <p className="notice" role="status" aria-live="polite">{status}</p>}
      <p className="notice">Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>.</p>
    </form>
  </main>;
}
