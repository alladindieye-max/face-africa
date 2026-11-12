'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function CastingApplyButton({ castingId, isDemo = false, allowDemoTest = false }: { castingId: string; isDemo?: boolean; allowDemoTest?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [kind, setKind] = useState<'success'|'error'|'info'>('info');

  async function apply() {
    if (isDemo && !allowDemoTest) { setKind('info'); setMessage('Ceci est un casting de démonstration : aucune candidature ne peut être envoyée depuis le site public.'); return; }
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
    if (error?.code === '23505') {
      setBusy(false);
      setKind('info'); setMessage('Vous avez déjà envoyé une candidature pour ce casting.');
      return;
    }
    if (error) {
      setBusy(false);
      setKind('error');
      setMessage(error.code === '42501'
        ? 'Ce casting n’accepte plus de candidatures ou votre profil ne remplit pas les conditions.'
        : 'Votre candidature n’a pas pu être enregistrée. Réessayez dans quelques instants.');
      return;
    }

    // The application is already safely stored. Email delivery is a separate notification step.
    const { error: emailError } = await client.functions.invoke('casting-application-confirmation', {
      body: { castingId },
    });
    setBusy(false);
    if (emailError) {
      console.error('casting_application_confirmation_unavailable', emailError.message);
      setKind('success');
      setMessage('Votre candidature a bien été enregistrée. Retrouvez son suivi dans votre espace mannequin. L’e-mail de confirmation n’a pas pu être envoyé pour le moment.');
      return;
    }
    setKind('success');
    setMessage('Votre candidature a bien été enregistrée. Un e-mail de confirmation vous a été envoyé. Retrouvez aussi son suivi dans votre espace mannequin.');
  }

  return <div className="feature" style={{display:'grid',gap:12}}>
    <button className="button primary" type="button" onClick={() => void apply()} disabled={busy || (isDemo && !allowDemoTest)}>
      {isDemo && !allowDemoTest ? 'Candidature désactivée (démo)' : isDemo ? (busy ? 'Envoi du test…' : 'Postuler (test technique)') : busy ? 'Envoi en cours…' : 'Postuler gratuitement'}
    </button>
    {message && <p role={kind==='error'?'alert':'status'} aria-live="polite" className="notice">{message} {message.includes('Connectez-vous') && <Link href="/connexion?next=%2Fcastings">Se connecter</Link>} {message.includes('Ouvrez votre espace') && <Link href="/espace">Mon espace</Link>}</p>}
    <p className="muted">{isDemo && allowDemoTest ? 'Mode test Preview uniquement : cette candidature technique sera enregistrée dans la base partagée.' : 'La candidature est gratuite. Votre profil doit être publié et validé par FACEAFRICA.'}</p>
  </div>;
}
