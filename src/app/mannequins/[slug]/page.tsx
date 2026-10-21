import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabasePublicClient } from '@/lib/supabase';

type PublicProfile = {
  id: string;
  slug: string;
  display_name: string;
  city: string;
  country: string;
  specialties: string[] | null;
  experience: string | null;
  languages: string[] | null;
  availability: string | null;
  agency_name: string | null;
  public_bio: string | null;
  measurements: Record<string, unknown> | null;
  phone_public: string | null;
  email_public: string | null;
  main_photo_path: string | null;
  portfolio_photo_paths: string[] | null;
  membership_tier: 'BASIC' | 'STANDARD' | 'PRO' | null;
};

const measurementLabels: Record<string, string> = {
  height: 'Taille',
  bust: 'Poitrine',
  chest: 'Poitrine',
  waist: 'Tour de taille',
  hips: 'Hanches',
  shoe_size: 'Pointure',
  clothing_size: 'Taille de vêtement',
  eye_color: 'Couleur des yeux',
  hair_color: 'Couleur des cheveux',
};

function TierBadge({ tier }: { tier: PublicProfile['membership_tier'] }) {
  if (tier !== 'STANDARD' && tier !== 'PRO') return null;
  return <span className="tag" style={{ display: 'inline-flex', background: '#e7f0ff', color: '#174ea6', border: '1px solid #b7d0ff', fontWeight: 700 }}>Mannequin Vérifié ✓ · {tier}</span>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Profil de mannequin — ${slug.replaceAll('-', ' ')}` };
}

export default async function ModelProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = createSupabasePublicClient();
  if (!client) return <main className="wrap"><div className="page-title"><div className="eyebrow">Profil professionnel</div><h1>Le profil sera bientôt disponible.</h1><p className="lead">Le catalogue public n’est pas encore connecté à la base de données.</p><Link className="button" href="/mannequins">Retour au catalogue</Link></div></main>;

  const { data, error } = await client.from('public_model_profiles')
    .select('id,slug,display_name,city,country,specialties,experience,languages,availability,agency_name,public_bio,measurements,phone_public,email_public,main_photo_path,portfolio_photo_paths,membership_tier')
    .eq('slug', slug).maybeSingle();
  if (error || !data) notFound();

  const p = data as PublicProfile;
  const photoPaths = Array.from(new Set([p.main_photo_path, ...(p.portfolio_photo_paths || [])].filter((path): path is string => Boolean(path))));
  // Short-lived signed URLs keep the Storage bucket private while allowing the browser to load approved photos.
  const photos = await Promise.all(photoPaths.map(async (path) => {
    const { data: signed, error: signingError } = await client.storage.from('model-photos').createSignedUrl(path, 15 * 60);
    return !signingError && signed?.signedUrl ? { path, url: signed.signedUrl } : null;
  }));
  const visiblePhotos = photos.filter((photo): photo is { path: string; url: string } => Boolean(photo));
  // The public view already applies each model's visibility preferences. Render only scalar values.
  const visibleMeasurements = Object.entries(p.measurements || {}).filter(([, value]) =>
    (typeof value === 'string' || typeof value === 'number') && String(value).trim() !== ''
  );

  return <>
    <header className="topbar"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><Link className="button" href="/mannequins">← Catalogue</Link></div></header>
    <main className="wrap" style={{ maxWidth: 1000 }}>
      <div className="page-title"><div className="eyebrow">Profil professionnel · FACEAFRICA</div><TierBadge tier={p.membership_tier} /><h1>{p.display_name}</h1><p className="lead">{p.city}, {p.country}</p></div>
      {visiblePhotos.length ? <section aria-label="Portfolio photo" className="model-grid" style={{ marginBottom: 32 }}>
        {visiblePhotos.map((photo, index) => <div className="portrait" key={photo.path} style={{ position: 'relative', overflow: 'hidden', minHeight: 300 }}>
          <Image src={photo.url} alt={`Photo ${index + 1} du portfolio de ${p.display_name}`} fill sizes="(max-width: 700px) 100vw, 50vw" style={{ objectFit: 'cover' }} unoptimized />
        </div>)}
      </section> : <section className="empty"><h3>Portfolio en préparation</h3><p className="muted">Aucune photo approuvée n’est disponible pour le moment. Les photos privées ou en attente de validation ne sont jamais affichées.</p></section>}
      <section className="feature">
        <h2>À propos</h2><p>{p.public_bio || 'Aucune biographie publique renseignée.'}</p>
        <h3>Spécialités</h3><div className="tags">{(p.specialties || []).length ? p.specialties?.map((s) => <span className="tag" key={s}>{s}</span>) : <span className="muted">Non renseignées</span>}</div>
        {p.experience && <><h3>Expérience</h3><p>{p.experience}</p></>}
        {p.languages?.length ? <><h3>Langues</h3><p>{p.languages.join(', ')}</p></> : null}
        {p.availability && <><h3>Disponibilité</h3><p>{p.availability}</p></>}
        {p.agency_name && <><h3>Représentation</h3><p>{p.agency_name}</p></>}
        {visibleMeasurements.length > 0 && <><h3>Mensurations et caractéristiques</h3><div className="tags">{visibleMeasurements.map(([key, value]) => <span className="tag" key={key}>{measurementLabels[key] || key.replaceAll('_', ' ')} : {String(value)}</span>)}</div></>}
        {p.phone_public && <p>Téléphone professionnel : {p.phone_public}</p>}
        {p.email_public && <p>Email professionnel : {p.email_public}</p>}
        <p className="notice">Seules les informations autorisées par le profil public sont affichées. Les coordonnées et mensurations restent masquées si le mannequin ne les a pas rendues publiques.</p>
        <Link className="button primary" href={`/shooting-photo?model=${encodeURIComponent(p.display_name)}`}>Demander une séance photo</Link>
      </section>
    </main>
    <footer className="footer"><div className="wrap footer-inner"><strong>FACEAFRICA</strong><Link href="/mannequins">Retour au catalogue</Link></div></footer>
  </>;
}
