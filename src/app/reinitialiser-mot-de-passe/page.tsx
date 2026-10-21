'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function ReinitialiserMotDePassePage() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirmation') || '');
    if (password.length < 12) {
      setStatus('Le mot de passe doit contenir au moins 12 caractères.');
      return;
    }
    if (password !== confirmation) {
      setStatus('Les deux mots de passe ne correspondent pas.');
      return;
    }
    const client = createSupabaseBrowserClient();
    if (!client) {
      setStatus('Ce service est momentanément indisponible. Réessayez plus tard.');
      return;
    }
    setBusy(true);
    const { error } = await client.auth.updateUser({ password });
    setBusy(false);
    setStatus(error
      ? 'Le lien de récupération est invalide ou expiré. Demandez un nouveau lien.'
      : 'Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.');
  }

  return <main className="wrap" style={{ maxWidth: 620 }}>
    <header className="topbar"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><Link href="/connexion" className="button">Connexion</Link></div></header>
    <section className="page-title"><div className="eyebrow">Sécurité du compte</div><h1>Choisir un nouveau mot de passe</h1><p className="lead">Utilisez au moins 12 caractères.</p></section>
    <form className="feature" onSubmit={submit}>
      <div className="field"><label htmlFor="password">Nouveau mot de passe</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required/></div>
      <div className="field" style={{ marginTop: 16 }}><label htmlFor="confirmation">Confirmer le mot de passe</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={12} required/></div>
      <button className="button primary" style={{ marginTop: 18 }} type="submit" disabled={busy}>{busy ? 'Modification…' : 'Modifier le mot de passe'}</button>
      {status && <p className="notice" role="status" aria-live="polite">{status}</p>}
    </form>
  </main>;
}
