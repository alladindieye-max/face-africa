import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabasePublicClient } from '@/lib/supabase';
import MediaKitButton from '@/components/MediaKitButton';

type PublicProfile = {
  id: string;
  slug: string;
  display_name: string;
  city: string;
  country: string;
  specialties: string[] | null;
  secondary_skills: string[] | null;
  social_metrics: Record<string, unknown> | null;
  experience: string | null;
  languages: string[] | null;
  availability: string | null;
  agency_name: string | null;
  public_bio: string | null;
  measurements: Record<string, unknown> | null;
  main_photo_path: string | null;
  portfolio_photo_paths: string[] | null;
  membership_tier: 'BASIC' | 'STANDARD' | 'PRO' | null;
  is_verified: boolean;
  is_featured: boolean;
};

const measurementLabels: Record<string, string> = {
  height: 'Taille',
  bust: 'Poitrine',
  chest: 'Tour de poitrine',
  waist: 'Tour de taille',
  hips: 'Hanches',
  shoe_size: 'Pointure',
  clothing_size: 'Taille de vêtement',
  eye_color: 'Couleur des yeux',
  hair_color: 'Couleur des cheveux',
  skin_tone: 'Teint',
  hair_type: 'Type de cheveux',
};

function TierBadge({ tier, verified, featured }: { tier: PublicProfile['membership_tier']; verified: boolean; featured: boolean }) {
  if (tier !== 'STANDARD' && tier !== 'PRO' && !verified && !featured) return null;
  return <div className="tags">{tier !== 'BASIC' && tier && <span className="tag" style={{ display: 'inline-flex', background: '#f3e8dd', color: '#573B2D', border: '1px solid #e3d2c3', fontWeight: 700 }}>{tier}</span>}{verified && <span className="tag" style={{ display: 'inline-flex', background: '#e7f0ff', color: '#174ea6', border: '1px solid #b7d0ff', fontWeight: 700 }}>Mannequin Vérifié ✓</span>}{featured && <span className="tag" style={{ display: 'inline-flex', background: '#f3e8dd', color: '#573B2D', border: '1px solid #e3d2c3', fontWeight: 700 }}>À la une</span>}</div>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Profil de mannequin — ${slug.replaceAll('-', ' ')}` };
}

export default async function ModelProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = createSupabasePublicClient();
  if (!client) return <main id="contenu-principal" className="wrap"><div className="page-title"><div className="eyebrow">Profil professionnel</div><h1>Le profil sera bientôt disponible.</h1><p className="lead">Le catalogue public n’est pas encore connecté à la base de données.</p><Link className="button" href="/mannequins">Retour au catalogue</Link></div></main>;

  const { data, error } = await client.from('public_model_profiles')
    .select('id,slug,display_name,city,country,specialties,secondary_skills,social_metrics,experience,languages,availability,agency_name,public_bio,measurements,main_photo_path,portfolio_photo_paths,membership_tier,is_verified,is_featured')
    .eq('slug', slug).maybeSingle();
  if (error || !data) notFound();

  const p = data as PublicProfile;
  const photoPaths = Array.from(new Set([p.main_photo_path, ...(p.portfolio_photo_paths || [])].filter((path): path is string => Boolean(path))));
  // Short-lived signed URLs keep the Storage bucket private while allowing the browser to load approved photos.
  const photos = await Promise.all(photoPaths.map(async (path) => {
    const { data: signed, error: signingError } = await client.storage.from('model-photos').createSignedUrl(path, 15 * 60);
    if (signingError || !signed?.signedUrl) { console.error('[FACEAFRICA] Photo signing failed', { path, message: signingError?.message || 'No signed URL returned' }); return null; }
    return { path, url: signed.signedUrl };
  }));
  const visiblePhotos = photos.filter((photo): photo is { path: string; url: string } => Boolean(photo));
  const publicMeasurements = Object.entries(p.measurements || {}).filter(([key, value]) => key in measurementLabels && value !== null && value !== '');
  // The public database view returns an empty object unless the mannequin opted in to showing measurements.

  return <>
    <style>{`@media print {
      .no-print, .topbar, .footer { display: none !important; }
      body { background: #fff !important; color: #111 !important; }
      main.wrap { max-width: 100% !important; padding: 0 !important; }
      .page-title { margin-top: 0 !important; }
      .model-grid { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px !important; }
      .portrait { min-height: 180px !important; break-inside: avoid; }
      .feature { break-inside: avoid; box-shadow: none !important; }
      a { color: #111 !important; text-decoration: none !important; }
    }`}</style>
    <header className="topbar no-print"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><Link className="button" href="/mannequins">← Catalogue</Link></div></header>
    <main className="wrap" style={{ maxWidth: 1000 }}>
      <div className="page-title"><div className="eyebrow">Smart Press Kit · FACEAFRICA</div><TierBadge tier={p.membership_tier} verified={p.is_verified} featured={p.is_featured} /><h1>{p.display_name}</h1><p className="lead">{p.city}, {p.country}</p>{p.membership_tier === 'PRO' && <p className="notice">Portfolio PRO · {visiblePhotos.length} photo(s) approuvée(s)</p>}<div className="no-print" style={{ marginTop: 16 }}><MediaKitButton /></div></div>
      {visiblePhotos.length ? <section aria-label="Portfolio photo" className="model-grid" style={{ marginBottom: 32, gridTemplateColumns: p.membership_tier === 'PRO' ? 'repeat(auto-fit, minmax(220px, 1fr))' : undefined }}>
        {visiblePhotos.map((photo, index) => <div className="portrait" key={photo.path} style={{ position: 'relative', overflow: 'hidden', minHeight: 300 }}>
          <Image src={photo.url} alt={`Photo ${index + 1} du portfolio de ${p.display_name}`} fill sizes="(max-width: 700px) 100vw, 50vw" style={{ objectFit: 'cover' }} unoptimized />
        </div>)}
      </section> : <section className="empty"><h3>Portfolio en préparation</h3><p className="muted">Aucune photo approuvée n’est disponible pour le moment. Les photos privées ou en attente de validation ne sont jamais affichées.</p></section>}
      <section className="feature">
        {(p.public_bio || (p.specialties || []).length > 0) && <><h2>À propos</h2>{p.public_bio && <p>{p.public_bio}</p>}{(p.specialties || []).length > 0 && <><h3>Spécialités</h3><div className="tags">{p.specialties?.map((s) => <span className="tag" key={s}>{s}</span>)}</div></>}</>}
        {(p.secondary_skills || []).length > 0 && <><h3>Compétences complémentaires</h3><div className="tags">{p.secondary_skills?.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div></>}
        {(() => { const safeSocialUrl = (value: unknown, hosts: string[]) => { if (typeof value !== 'string' || value.length > 300) return null; try { const url = new URL(value); return url.protocol === 'https:' && hosts.includes(url.hostname.toLowerCase()) ? url.href : null; } catch { return null; } }; const instagram = safeSocialUrl(p.social_metrics?.instagram_url, ['instagram.com', 'www.instagram.com']); const tiktok = safeSocialUrl(p.social_metrics?.tiktok_url, ['tiktok.com', 'www.tiktok.com']); return instagram || tiktok ? <><h3>Comptes sociaux</h3><div className="tags">{instagram && <a className="tag" href={instagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a>}{tiktok && <a className="tag" href={tiktok} target="_blank" rel="noopener noreferrer">TikTok ↗</a>}</div><p className="muted"><small>Les liens sont fournis par le profil. Les statistiques d’abonnés et d’engagement en temps réel ne sont pas encore connectées.</small></p></> : null; })()}
        {p.experience && <><h3>Expérience</h3><p>{p.experience}</p></>}
        {p.languages?.length ? <><h3>Langues</h3><p>{p.languages.join(', ')}</p></> : null}
        {p.availability && <><h3>Disponibilité</h3><p>{p.availability}</p></>}
        {p.agency_name && <><h3>Représentation</h3><p>{p.agency_name}</p></>}
        {publicMeasurements.length > 0 && <><h3>Mensurations et caractéristiques</h3><dl className="measurement-list">{publicMeasurements.map(([key, value]) => <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 6 }}><dt style={{ fontWeight: 600 }}>{measurementLabels[key]} :</dt><dd>{String(value)}</dd></div>)}</dl></>}
        <p className="notice no-print">Pour contacter ce mannequin, passez par FACEAFRICA. Les coordonnées personnelles ne sont pas affichées publiquement.</p>
        <Link className="button primary no-print" href={`/shooting-photo?model=${encodeURIComponent(p.display_name)}`}>Contacter via FACEAFRICA</Link>
      </section>
    </main>
    <footer className="footer no-print"><div className="wrap footer-inner"><strong>FACEAFRICA</strong><Link href="/mannequins">Retour au catalogue</Link></div></footer>
  </>;
}
