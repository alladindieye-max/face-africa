import Link from 'next/link';
import { createSupabasePublicClient } from '@/lib/supabase';

export const metadata = {
  title: 'Castings | FACEAFRICA',
  description: 'Les opportunités de casting mode, beauté et publicité sur FACEAFRICA.',
};

type Casting = {
  id: string;
  slug: string | null;
  title: string;
  cover_storage_path: string | null;
  description: string;
  city: string;
  country: string;
  location: string | null;
  casting_type: string;
  desired_profiles: string[] | null;
  selection_criteria: string | null;
  participation_terms: string | null;
  compensation_description: string | null;
  deadline_at: string | null;
  event_start_at: string | null;
};

function dateLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(date);
}

export default async function CastingsPage() {
  const client = createSupabasePublicClient();
  let castings: Casting[] = [];
  let unavailable = !client;

  if (client) {
    const result = await client
      .from('castings')
      .select('id,slug,title,cover_storage_path,description,city,country,location,casting_type,desired_profiles,selection_criteria,participation_terms,compensation_description,deadline_at,event_start_at')
      .eq('status', 'published')
      .or('deadline_at.is.null,deadline_at.gt.' + new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(30);
    if (result.error) unavailable = true;
    else castings = (result.data || []) as Casting[];
  }

  return (
    <>
      <header className="topbar">
        <div className="wrap nav">
          <Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link>
          <nav className="nav-links" aria-label="Navigation principale">
            <Link href="/mannequins">Mannequins</Link>
            <Link href="/shooting">Shooting photo</Link>
          </nav>
          <Link className="button primary" href="/inscription">Créer mon profil</Link>
        </div>
      </header>
      <main className="wrap">
        <section className="page-title">
          <div className="eyebrow">Opportunités professionnelles · Dakar et Afrique</div>
          <h1>Les castings FACEAFRICA.</h1>
          <p className="lead">Des opportunités mode, beauté, publicité et photographie, avec des critères clairs et des informations vérifiées.</p>
        </section>
        <section className="section">
          {unavailable ? (
            <div className="empty">
              <h2>Les castings arrivent bientôt.</h2>
              <p className="muted">Le service de publication n’est pas encore disponible. Réessayez plus tard.</p>
            </div>
          ) : castings.length === 0 ? (
            <div className="empty">
              <h2>Aucun casting actif pour le moment.</h2>
              <p className="muted">Les annonces seront affichées ici après validation par FACEAFRICA. Nous ne présentons pas d’exemples comme des opportunités réelles.</p>
              <Link className="button primary" href="/inscription">Préparer mon profil ↗</Link>
            </div>
          ) : (
            <div className="casting-grid">
              {castings.map((casting) => (
                <article className="casting" key={casting.id}>
                  <div className="location">{casting.city} · {casting.casting_type}</div>
                  <h2>{casting.title}</h2>
                  <p>{casting.description}</p>
                  <p className="muted">{casting.location ? casting.location + ' · ' : ''}{casting.country}</p>
                  {casting.desired_profiles?.length ? <div className="tags">{casting.desired_profiles.map((profile) => <span className="tag" key={profile}>{profile}</span>)}</div> : null}
                  {casting.selection_criteria ? <p><strong>Critères :</strong> {casting.selection_criteria}</p> : null}
                  {casting.participation_terms ? <p><strong>Modalités :</strong> {casting.participation_terms}</p> : null}
                  {casting.compensation_description ? <p><strong>Rémunération :</strong> {casting.compensation_description}</p> : null}
                  {dateLabel(casting.deadline_at) ? <p><strong>Date limite :</strong> {dateLabel(casting.deadline_at)}</p> : null}
                  <p className="notice">Candidature via FACEAFRICA : l’espace de candidature sera activé dans une prochaine étape.</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="footer">
        <div className="wrap footer-inner">
          <div><strong style={{ letterSpacing: '.15em' }}>FACEAFRICA</strong><br /><small>Le talent africain, sous les projecteurs.</small></div>
          <nav><Link href="/">Accueil</Link><Link href="/mannequins">Mannequins</Link><Link href="/confidentialite">Confidentialité</Link></nav>
          <small>© FACEAFRICA · Dakar, Sénégal</small>
        </div>
      </footer>
    </>
  );
}
