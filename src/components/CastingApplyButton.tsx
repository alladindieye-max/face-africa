'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function CastingApplyButton({ castingId }: { castingId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [kind, setKind] = useState<'success'|'error'|'info'>('info');

  async function apply() {
    const client = createSupabaseBrowserClient();
    if (!client) { setKind('error'); setMessage('Le service de candidature est momentanément indisponible. Réessayez plus tard.'); return; }
    setBusy(true); setMessage('');
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      setBusy(false);
      setKind('info');
      setMessage('Connectez-vous à votre compte mannequin pour candidater.');
      return;
    }
    const { data: profile, error: profileError } = await client.from('model_profiles').select('id,status').eq('user_id', user.id).maybeSingle();
    if (profileError || !profile) {
      setBusy(false); setKind('error');
      setMessage('Votre profil mannequin est introuvable. Ouvrez votre espace pour le créer.');
      return;
    }
    if (profile.status !== 'published') {
      setBusy(false); setKind('info');
      setMessage('Votre profil doit être publié et validé par FACEAFRICA avant de pouvoir candidater.');
      return;
    }
    const { error } = await client.from('casting_applications').insert({
      casting_id: castingId,
      model_profile_id: profile.id,
      status: 'submitted'
    });
    setBusy(false);
    if (error?.code === '23505') {
      setKind('info'); setMessage('Vous avez déjà envoyé une candidature pour ce casting.');
      return;
    }
    if (error) {
      setKind('error');
      setMessage(error.code === '42501'
        ? 'Ce casting n’accepte plus de candidatures ou votre profil ne remplit pas les conditions.'
        : 'Votre candidature n’a pas pu être enregistrée. Réessayez dans quelques instants.');
      return;
    }
    setKind('success');
    setMessage('Votre candidature a bien été enregistrée. Retrouvez son suivi dans votre espace mannequin.');
  }

  return <div className="feature" style={{display:'grid',gap:12}}>
    <button className="button primary" type="button" onClick={() => void apply()} disabled={busy}>
      {busy ? 'Envoi en cours…' : 'Postuler gratuitement'}
    </button>
    {message && <p role={kind==='error'?'alert':'status'} aria-live="polite" className="notice">{message} {message.includes('Connectez-vous') && <Link href="/connexion?next=%2Fcastings">Se connecter</Link>} {message.includes('Ouvrez votre espace') && <Link href="/espace">Mon espace</Link>}</p>}
    <p className="muted">La candidature est gratuite. Votre profil doit être publié et validé par FACEAFRICA.</p>
  </div>;
}
