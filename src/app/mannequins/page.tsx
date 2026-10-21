import Image from 'next/image';
import Link from 'next/link';
import { createSupabasePublicClient } from '@/lib/supabase';

export const metadata = { title: 'Catalogue des mannequins' };

type Profile = {
  id: string;
  slug: string;
  display_name: string;
  city: string;
  country: string;
  specialties: string[] | null;
  main_photo_path: string | null;
  membership_tier: 'BASIC' | 'STANDARD' | 'PRO' | null;
  membership_sort_order: number;
};

type DisplayProfile = Profile & { photoUrl: string | null };

function TierBadge({ tier }: { tier: Profile['membership_tier'] }) {
  if (tier !== 'STANDARD' && tier !== 'PRO') return null;
  return <span className="tag" style={{ background: '#e7f0ff', color: '#174ea6', border: '1px solid #b7d0ff', fontWeight: 700 }}>Mannequin Vérifié ✓ · {tier}</span>;
}

export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ q?: string; city?: string; specialty?: string }> }) {
  const params = await searchParams;
  const client = createSupabasePublicClient();
  let profiles: DisplayProfile[] = [];
  const backendConfigured = Boolean(client);
  let error = false;

  if (client) {
    let query = client
      .from('public_model_profiles')
      .select('id,slug,display_name,city,country,specialties,main_photo_path,membership_tier,membership_sort_order')
      .order('membership_sort_order', { ascending: true })
      .order('city', { ascending: true })
      .order('display_name', { ascending: true })
      .limit(100);
    if (params.q) query = query.ilike('display_name', `%${params.q.replace(/[%_,]/g, '')}%`);
    if (params.city && params.city !== 'Toutes les villes') query = query.eq('city', params.city);
    if (params.specialty) query = query.contains('specialties', [params.specialty]);

    const result = await query;
    if (result.error) {
      error = true;
    } else {
      profiles = await Promise.all(((result.data || []) as Profile[]).map(async (profile) => {
        if (!profile.main_photo_path) return { ...profile, photoUrl: null };
        const { data } = await client.storage.from('model-photos').createSignedUrl(profile.main_photo_path, 60 * 60);
        return { ...profile, photoUrl: data?.signedUrl ?? null };
      }));
    }
  }

  return <>
    <header className="topbar"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><nav className="nav-links"><Link href="/">Accueil</Link><Link href="/mannequins">Mannequins</Link><Link href="/photographes">Nos Photographes</Link><Link href="/shooting-photo">Shooting</Link></nav><Link className="button primary" href="/inscription">Créer mon profil</Link></div></header>
    <main className="wrap">
      <div className="page-title"><div className="eyebrow">Catalogue professionnel</div><h1>Découvrez les mannequins.</h1><p className="lead">Explorez les profils publiés et validés par FACEAFRICA. Les profils STANDARD et PRO sont présentés en priorité.</p></div>
      <form className="search-panel" action="/mannequins">
        <div className="field"><label htmlFor="q">Nom ou prénom</label><input id="q" name="q" defaultValue={params.q} placeholder="Rechercher un mannequin" /></div>
        <div className="field"><label htmlFor="city">Ville</label><select id="city" name="city" defaultValue={params.city || 'Dakar'}><option>Dakar</option><option value="Toutes les villes">Toutes les villes</option></select></div>
        <div className="field"><label htmlFor="specialty">Spécialité</label><select id="specialty" name="specialty" defaultValue={params.specialty || ''}><option value="">Toutes les spécialités</option><option>Mode</option><option>Éditorial</option><option>Commercial</option><option>Défilé</option><option>Beauté</option><option>Lifestyle</option></select></div>
        <button className="button primary" type="submit">Rechercher</button>
      </form>
      <div className="results-line"><strong>{backendConfigured && !error ? `${profiles.length} profil(s) publié(s)` : 'Catalogue en préparation'}</strong><span className="muted">Seuls les profils publiés et validés sont affichés.</span></div>
      {!backendConfigured ? <div className="empty"><h3>Le catalogue est en cours de connexion.</h3><p className="muted">Configurez Supabase et appliquez les migrations pour afficher les profils réels. Aucun profil fictif n’est présenté comme un talent inscrit.</p></div>
        : error ? <div className="empty"><h3>Impossible de charger les profils.</h3><p className="muted">Vérifiez que les migrations du catalogue sont appliquées et réessayez.</p></div>
        : profiles.length === 0 ? <div className="empty"><h3>Aucun profil publié pour cette recherche.</h3><p className="muted">Essayez une autre ville ou retirez un filtre. Les profils en attente de validation restent privés.</p><Link className="button" href="/mannequins">Réinitialiser la recherche</Link></div>
        : <div className="model-grid">{profiles.map((p) => <article className="model-card" key={p.id}>
          <div className="portrait" style={{ position: 'relative', overflow: 'hidden' }}>
            {p.photoUrl ? <Image src={p.photoUrl} alt={`Portrait de ${p.display_name}`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" style={{ objectFit: 'cover' }} unoptimized />
              : <div className="empty"><p>{p.main_photo_path ? 'Photo momentanément indisponible' : 'Photo non encore validée'}</p></div>}
          </div>
          <div className="model-info"><TierBadge tier={p.membership_tier} /><h3>{p.display_name}</h3><p>{p.city}, {p.country}</p><div className="tags">{(p.specialties || []).slice(0, 3).map((s) => <span className="tag" key={s}>{s}</span>)}</div><Link className="button" href={`/mannequins/${p.slug}`}>Voir le profil</Link></div>
        </article>)}</div>}
    </main>
    <footer className="footer"><div className="wrap footer-inner"><strong>FACEAFRICA</strong><small>© FACEAFRICA · Catalogue professionnel</small><Link href="/">Retour à l’accueil</Link></div></footer>
  </>;
}
