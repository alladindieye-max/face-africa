'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type ModelProfile = {
  id: string;
  display_name: string;
  city: string;
  country: string;
  bio: string | null;
  specialties: string[] | null;
  experience: string | null;
  languages: string[] | null;
  availability: string | null;
  agency_name: string | null;
  phone_public: string | null;
  email_public: string | null;
  status: string;
};

const blank = {
  display_name: '', city: 'Dakar', country: 'Sénégal', bio: '',
  specialties: '', experience: '', languages: '', availability: '',
  agency_name: '', phone_public: '', email_public: '',
};

export default function ModelWorkspacePage() {
  const client = createSupabaseBrowserClient();
  const [form, setForm] = useState(blank);
  const [userId, setUserId] = useState('');
  const [profileId, setProfileId] = useState('');
  const [profileStatus, setProfileStatus] = useState('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!client) {
        if (active) { setMessage('La connexion à Supabase n’est pas configurée.'); setLoading(false); }
        return;
      }
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData.user) {
        if (active) { setMessage('Connectez-vous avec votre compte FACEAFRICA pour gérer votre profil.'); setLoading(false); }
        return;
      }
      const user = authData.user;
      const { data, error } = await client.from('model_profiles')
        .select('id,display_name,city,country,bio,specialties,experience,languages,availability,agency_name,phone_public,email_public,status')
        .eq('user_id', user.id).maybeSingle();
      if (!active) return;
      setUserId(user.id);
      if (error) setMessage('Impossible de charger le profil. Vérifiez que la migration de la base de données a été appliquée.');
      else if (data) {
        const p = data as ModelProfile;
        setProfileId(p.id);
        setProfileStatus(p.status);
        setForm({
          display_name: p.display_name || '', city: p.city || 'Dakar', country: p.country || 'Sénégal',
          bio: p.bio || '', specialties: (p.specialties || []).join(', '), experience: p.experience || '',
          languages: (p.languages || []).join(', '), availability: p.availability || '',
          agency_name: p.agency_name || '', phone_public: p.phone_public || '', email_public: p.email_public || '',
        });
      } else setMessage('Votre espace est prêt. Complétez votre profil puis enregistrez-le.');
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [client]);

  function update<K extends keyof typeof blank>(key: K, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || !userId) { setMessage('Connectez-vous avant d’enregistrer votre profil.'); return; }
    setSaving(true); setMessage('');
    const payload = {
      user_id: userId,
      display_name: form.display_name.trim(),
      city: form.city.trim() || 'Dakar',
      country: form.country.trim() || 'Sénégal',
      bio: form.bio.trim() || null,
      specialties: form.specialties.split(',').map((v) => v.trim()).filter(Boolean).slice(0, 12),
      experience: form.experience.trim() || null,
      languages: form.languages.split(',').map((v) => v.trim()).filter(Boolean).slice(0, 12),
      availability: form.availability.trim() || null,
      agency_name: form.agency_name.trim() || null,
      phone_public: form.phone_public.trim() || null,
      email_public: form.email_public.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const result = profileId
      ? await client.from('model_profiles').update(payload).eq('id', profileId).select('id,status').single()
      : await client.from('model_profiles').insert({ ...payload, status: 'draft' }).select('id,status').single();
    setSaving(false);
    if (result.error) {
      setMessage(result.error.message.includes('row-level security')
        ? 'La base a refusé cette modification. Un profil déjà publié doit être remis en brouillon par un administrateur avant modification.'
        : 'Enregistrement impossible : ' + result.error.message);
      return;
    }
    setProfileId(result.data.id);
    setProfileStatus(result.data.status);
    setMessage('Profil enregistré. Il reste privé tant que FACEAFRICA ne l’a pas validé.');
  }

  return (
    <>
      <header className="topbar"><div className="wrap nav">
        <Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link>
        <Link href="/mannequins" className="button">Voir le catalogue</Link>
      </div></header>
      <main className="wrap" style={{ maxWidth: 850 }}>
        <section className="page-title">
          <div className="eyebrow">Espace personnel</div>
          <h1>Mon profil mannequin.</h1>
          <p className="lead">Renseignez vos informations professionnelles. Les coordonnées ne sont publiques que selon les règles de visibilité du profil.</p>
        </section>
        {loading ? <div className="empty">Chargement de votre espace…</div> : !userId ? (
          <div className="empty"><h2>Connexion nécessaire</h2><p>{message}</p><Link className="button primary" href="/inscription">Créer un compte</Link><p className="notice">Si vous avez déjà un compte, la page de connexion doit être utilisée pour ouvrir votre espace.</p></div>
        ) : (
          <form className="feature" onSubmit={save}>
            <div className="results-line"><strong>État du profil</strong><span className="tag">{profileStatus === 'published' ? 'Publié' : profileStatus === 'pending_review' ? 'En validation' : profileStatus === 'rejected' ? 'À corriger' : 'Brouillon privé'}</span></div>
            <p className="notice">Un profil brouillon n’est pas visible dans le catalogue public. Les photos et la comp card seront ajoutées après la configuration du stockage sécurisé.</p>
            <div className="search-panel" style={{ boxShadow: 'none', margin: 0, padding: 0, border: 0 }}>
              <div className="field"><label htmlFor="display_name">Nom professionnel *</label><input id="display_name" value={form.display_name} onChange={(e) => update('display_name', e.target.value)} maxLength={120} required /></div>
              <div className="field"><label htmlFor="city">Ville *</label><input id="city" value={form.city} onChange={(e) => update('city', e.target.value)} maxLength={100} required /></div>
              <div className="field"><label htmlFor="country">Pays *</label><input id="country" value={form.country} onChange={(e) => update('country', e.target.value)} maxLength={100} required /></div>
              <div className="field"><label htmlFor="specialties">Spécialités (séparées par des virgules)</label><input id="specialties" value={form.specialties} onChange={(e) => update('specialties', e.target.value)} placeholder="Mode, beauté, éditorial" maxLength={300} /></div>
              <div className="field"><label htmlFor="languages">Langues (séparées par des virgules)</label><input id="languages" value={form.languages} onChange={(e) => update('languages', e.target.value)} placeholder="Français, wolof, anglais" maxLength={200} /></div>
              <div className="field"><label htmlFor="experience">Expérience</label><input id="experience" value={form.experience} onChange={(e) => update('experience', e.target.value)} maxLength={1000} /></div>
              <div className="field"><label htmlFor="availability">Disponibilité</label><input id="availability" value={form.availability} onChange={(e) => update('availability', e.target.value)} maxLength={300} /></div>
              <div className="field"><label htmlFor="agency_name">Agence (facultatif)</label><input id="agency_name" value={form.agency_name} onChange={(e) => update('agency_name', e.target.value)} maxLength={150} /></div>
              <div className="field"><label htmlFor="phone_public">Téléphone professionnel</label><input id="phone_public" type="tel" value={form.phone_public} onChange={(e) => update('phone_public', e.target.value)} maxLength={30} /></div>
              <div className="field"><label htmlFor="email_public">Email professionnel</label><input id="email_public" type="email" value={form.email_public} onChange={(e) => update('email_public', e.target.value)} maxLength={320} /></div>
              <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="bio">Description professionnelle</label><textarea id="bio" rows={5} value={form.bio} onChange={(e) => update('bio', e.target.value)} maxLength={2500} /></div>
            </div>
            <button className="button primary" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer mon profil'}</button>
            {message && <p className="notice" role="status" aria-live="polite">{message}</p>}
          </form>
        )}
      </main>
      <footer className="footer"><div className="wrap footer-inner"><strong>FACEAFRICA</strong><Link href="/">Accueil</Link></div></footer>
    </>
  );
}
