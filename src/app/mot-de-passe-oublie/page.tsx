'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function MotDePasseOubliePage() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    const client = createSupabaseBrowserClient();
    if (!client) {
      setStatus('Ce service est momentanément indisponible. Réessayez plus tard.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    setBusy(true);
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://faceafrica.vercel.app/reinitialiser-mot-de-passe',
    });
    setBusy(false);
    setStatus(error
      ? 'La demande n’a pas pu être traitée. Réessayez plus tard.'
      : 'Si cette adresse peut recevoir un lien de récupération, un email sera envoyé. Vérifiez aussi vos courriers indésirables.');
  }

  return <main className="wrap" style={{ maxWidth: 620 }}>
    <header className="topbar"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><Link href="/connexion" className="button">Connexion</Link></div></header>
    <section className="page-title"><div className="eyebrow">Sécurité du compte</div><h1>Mot de passe oublié ?</h1><p className="lead">Indiquez l’adresse email de votre compte pour demander un lien de récupération.</p></section>
    <form className="feature" onSubmit={submit}>
      <div className="field"><label htmlFor="email">Adresse email</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={320}/></div>
      <button className="button primary" style={{ marginTop: 18 }} type="submit" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer le lien de récupération'}</button>
      {status && <p className="notice" role="status" aria-live="polite">{status}</p>}
    </form>
  </main>;
}
