import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabasePublicClient } from '@/lib/supabase';
import CastingApplyButton from '@/components/CastingApplyButton';

export const dynamic = 'force-dynamic';

type Casting = {
  id: string; slug: string | null; title: string; cover_storage_path: string | null;
  description: string; city: string; country: string; location: string | null;
  casting_type: string; desired_profiles: string[] | null; selection_criteria: string | null;
  participation_terms: string | null; compensation_description: string | null;
  deadline_at: string | null; event_start_at: string | null; event_end_at: string | null;
};

function dateLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Casting — ${slug.replaceAll('-', ' ')} | FACEAFRICA`, description: 'Détails et candidature gratuite aux castings FACEAFRICA.' };
}

export default async function CastingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = createSupabasePublicClient();
  if (!client) notFound();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const query = client.from('castings')
    .select('id,slug,title,cover_storage_path,description,city,country,location,casting_type,desired_profiles,selection_criteria,participation_terms,compensation_description,deadline_at,event_start_at,event_end_at')
    .eq('status', 'published').eq('is_demo', false)
    .or(isUuid ? `slug.eq.${slug},id.eq.${slug}` : `slug.eq.${slug}`)
    .maybeSingle();
  const { data, error } = await query;
  if (error || !data) notFound();
  const casting = data as Casting;
  const deadline = dateLabel(casting.deadline_at);
  const eventStart = dateLabel(casting.event_start_at);
  const eventEnd = dateLabel(casting.event_end_at);

  return <>
    <header className="topbar"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><Link href="/castings" className="button">← Tous les castings</Link></div></header>
    <main id="contenu-principal" className="wrap" style={{maxWidth:900}}>
      <section className="page-title">
        <div className="eyebrow">Casting vérifié · {casting.casting_type}</div>
        <h1>{casting.title}</h1>
        <p className="lead">{casting.city}, {casting.country}{casting.location ? ' · '+casting.location : ''}</p>
        <div className="tags"><span className="tag">{casting.casting_type}</span>{deadline && <span className="tag">Clôture : {deadline}</span>}</div>
      </section>
      <section className="feature" style={{display:'grid',gap:18}}>
        <h2>Description du projet</h2><p style={{whiteSpace:'pre-wrap'}}>{casting.description}</p>
        {casting.desired_profiles?.length ? <><h2>Profils recherchés</h2><div className="tags">{casting.desired_profiles.map(item=><span className="tag" key={item}>{item}</span>)}</div></> : null}
        {casting.selection_criteria ? <><h2>Critères de sélection</h2><p style={{whiteSpace:'pre-wrap'}}>{casting.selection_criteria}</p></> : null}
        {casting.participation_terms ? <><h2>Modalités de participation</h2><p style={{whiteSpace:'pre-wrap'}}>{casting.participation_terms}</p></> : null}
        <h2>Rémunération</h2><p>{casting.compensation_description?.trim() || 'À confirmer avec FACEAFRICA avant toute participation.'}</p>
        {eventStart && <p><strong>Date prévue :</strong> {eventStart}{eventEnd && eventEnd !== eventStart ? ' – '+eventEnd : ''}</p>}
        {deadline && <p><strong>Date limite de candidature :</strong> {deadline}</p>}
      </section>
      <section style={{margin:'24px 0'}}><CastingApplyButton castingId={casting.id}/></section>
    </main>
    <footer className="footer"><div className="wrap footer-inner"><strong>FACEAFRICA</strong><Link href="/castings">Retour aux castings</Link></div></footer>
  </>;
}
