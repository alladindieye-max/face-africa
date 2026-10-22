'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import './admin.css';

type Profile = {id:string;display_name:string;city:string;country:string;status:string;membership_tier:string;created_at:string};
type Activity = {id:string|number;action:string;entity_type:string;created_at:string;metadata:Record<string,unknown>|null};
const statusLabel:Record<string,string>={draft:'Brouillon',pending_review:'En validation',published:'Publié',rejected:'Modifications demandées',suspended:'Suspendu'};
function pill(status:string){const cls=status==='published'||status==='approved'?'fa-pill fa-pill-ok':status==='rejected'||status==='suspended'?'fa-pill fa-pill-no':'fa-pill';return <span className={cls}>{statusLabel[status]||status}</span>;}
export default function AdminPage(){
 const client=createSupabaseBrowserClient();
 const [loading,setLoading]=useState(true),[allowed,setAllowed]=useState(false),[message,setMessage]=useState('');
 const [profiles,setProfiles]=useState<Profile[]>([]),[activity,setActivity]=useState<Activity[]>([]);
 const [counts,setCounts]=useState({profiles:0,photos:0,castings:0,shootings:0,users:0,openPhotos:0});
 useEffect(()=>{void load();},[]);
 async function load(){
  if(!client){setMessage('Service indisponible.');setLoading(false);return;}
  const {data:{user}}=await client.auth.getUser();
  if(!user){window.location.assign('/connexion?next=%2Fadmin');return;}
  const {data:account}=await client.from('user_profiles').select('role').eq('id',user.id).maybeSingle();
  if(account?.role!=='admin'){setLoading(false);return;} setAllowed(true);
  const [p,ph,c,sh,u,pend,log]=await Promise.all([
   client.from('model_profiles').select('id,display_name,city,country,status,membership_tier,created_at',{count:'exact'}).order('created_at',{ascending:false}).limit(8),
   client.from('model_photos').select('id',{count:'exact',head:true}),
   client.from('castings').select('id',{count:'exact',head:true}).in('status',['pending_payment','payment_pending','paid_pending_review']),
   client.from('shooting_requests').select('id',{count:'exact',head:true}).in('status',['received','under_review','finding_photographer']),
   client.from('user_profiles').select('id',{count:'exact',head:true}),
   client.from('model_photos').select('id',{count:'exact',head:true}).eq('moderation_status','pending'),
   client.from('audit_log').select('id,action,entity_type,created_at,metadata').order('created_at',{ascending:false}).limit(6)
  ]);
  if(p.error)setMessage('Impossible de charger les profils. Vérifiez les politiques d’accès Supabase.');
  else setProfiles((p.data||[]) as Profile[]);
  setCounts({profiles:p.count||0,photos:ph.count||0,castings:c.count||0,shootings:sh.count||0,users:u.count||0,openPhotos:pend.count||0});
  setActivity((log.data||[]) as Activity[]);setLoading(false);
 }
 if(loading)return <main className="fa-admin fa-main"><h1 className="fa-title">Administration FACEAFRICA</h1><p>Vérification des autorisations…</p></main>;
 if(!allowed)return <main className="fa-admin fa-main" style={{maxWidth:760,margin:'0 auto'}}><Link href="/" className="fa-row">← FACEAFRICA</Link><h1 className="fa-title">Espace administrateur</h1><section className="fa-card"><h2>Accès non autorisé</h2><p>Cette zone est réservée aux comptes auxquels le rôle administrateur a été attribué dans Supabase.</p><Link className="fa-button fa-primary" href="/connexion?next=%2Fadmin">Se connecter</Link></section></main>;
 return <div className="fa-admin"><div className="fa-app"><aside className="fa-sidebar">
  <Link className="fa-logo" href="/"><span className="fa-logo-mark">F</span>FACEAFRICA</Link>
  <Link className="fa-nav-link" aria-current="page" href="/admin">Tableau de bord</Link>
  <div className="fa-nav-label">Modération</div><Link className="fa-nav-link" href="/admin/moderation">Profils à valider</Link><Link className="fa-nav-link" href="/admin/moderation?tab=photos">Photos <i className="fa-count">{counts.openPhotos}</i></Link><Link className="fa-nav-link" href="/admin/moderation?tab=castings">Annonces</Link><Link className="fa-nav-link" href="/admin/moderation">Signalements</Link>
  <div className="fa-nav-label">Activité</div><Link className="fa-nav-link" href="/admin/shootings">Shootings</Link><Link className="fa-nav-link" href="/admin/shootings">Photographes</Link><Link className="fa-nav-link" href="/admin/shootings">Annonceurs</Link>
  <div className="fa-nav-label">Plateforme</div><Link className="fa-nav-link" href="/admin/conformite">Conformité</Link><Link className="fa-nav-link" href="/admin/conformite#parametres">Paramètres</Link>
  <div className="fa-nav-label">Plateforme</div><Link className="fa-nav-link" href="/admin/conformite#parametres">Paramètres</Link><Link className="fa-nav-link" href="/espace">Espace mannequin ↗</Link>
 </aside><main className="fa-main">
  <div className="fa-top"><div><h1 className="fa-title">Tableau de bord</h1><p className="fa-muted">Vue d’ensemble de l’activité réelle de FACEAFRICA</p></div><div className="fa-row"><input className="fa-search" aria-label="Rechercher" placeholder="Rechercher un profil…" onKeyDown={e=>{if(e.key==='Enter'){const q=(e.currentTarget.value||'').trim();if(q)window.location.assign('/admin/moderation?q='+encodeURIComponent(q));}}}/><span className="fa-role">Administrateur</span><button type="button" className="fa-button" onClick={async()=>{await client?.auth.signOut();window.location.assign('/connexion');}}>Déconnexion</button></div></div>
  {message&&<p className="fa-notice" role="status">{message}</p>}
  <section className="fa-kpis">
   <article className="fa-kpi"><div className="fa-muted">Profils mannequins</div><div className="fa-kpi-number">{counts.profiles}</div><Link href="/admin/moderation">Ouvrir la file →</Link></article>
   <article className="fa-kpi"><div className="fa-muted">Photos à modérer</div><div className="fa-kpi-number">{counts.openPhotos}</div><Link href="/admin/moderation?tab=photos">Modérer →</Link></article>
   <article className="fa-kpi"><div className="fa-muted">Annonces à examiner</div><div className="fa-kpi-number">{counts.castings}</div><Link href="/admin/moderation?tab=castings">Examiner →</Link></article>
   <article className="fa-kpi"><div className="fa-muted">Demandes de shooting actives</div><div className="fa-kpi-number">{counts.shootings}</div><Link href="/admin/shootings">Gérer →</Link></article>
   <article className="fa-kpi"><div className="fa-muted">Comptes enregistrés</div><div className="fa-kpi-number">{counts.users}</div></article>
   <article className="fa-kpi"><div className="fa-muted">Photos enregistrées</div><div className="fa-kpi-number">{counts.photos}</div></article>
  </section>
  <div className="fa-columns">
   <section className="fa-card"><div className="fa-top"><h2 className="fa-subtitle">Profils récents</h2><Link href="/admin/moderation">Tout voir →</Link></div><div className="fa-scroll"><table className="fa-table"><thead><tr><th>Profil</th><th>Formule</th><th>Statut</th></tr></thead><tbody>{profiles.map(p=><tr key={p.id}><td><strong>{p.display_name}</strong><br/><span className="fa-muted">{p.city}, {p.country}</span></td><td>{p.membership_tier}</td><td>{pill(p.status)}</td></tr>)}</tbody></table></div>{!profiles.length&&<p className="fa-muted">Aucun profil enregistré pour le moment.</p>}</section>
   <section className="fa-card"><div className="fa-top"><h2 className="fa-subtitle">Journal récent</h2><Link href="/admin/conformite">Journal complet →</Link></div>{activity.map(a=><div key={a.id} style={{padding:'10px 0',borderBottom:'1px solid #efe3d6'}}><strong>{a.action}</strong><div className="fa-muted">{a.entity_type} · {new Date(a.created_at).toLocaleString('fr-FR')}</div></div>)}{!activity.length&&<p className="fa-muted">Aucune activité journalisée pour le moment.</p>}</section>
  </div>
 </main></div></div>;
}
