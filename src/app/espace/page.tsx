'use client';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type P = { id:string; user_id:string; slug:string|null; display_name:string; city:string; country:string; bio:string|null; specialties:string[]; experience:string|null; languages:string[]; availability:string|null; agency_name:string|null; measurements:Record<string,unknown>; phone_public:string|null; email_public:string|null; status:string; rejection_reason:string|null; membership_tier:string };
type Photo = { id:string; storage_path:string; photo_type:string; moderation_status:string; created_at:string };

export default function EspacePage() {
 const client=createSupabaseBrowserClient();
 const [profile,setProfile]=useState<P|null>(null), [photos,setPhotos]=useState<Photo[]>([]);
 const [busy,setBusy]=useState(false), [loading,setLoading]=useState(true), [message,setMessage]=useState(''), [uid,setUid]=useState('');
 async function load(){
  if(!client){setMessage('Service indisponible pour le moment.');setLoading(false);return;}
  const {data:{user}}=await client.auth.getUser();
  if(!user){window.location.assign('/connexion?next=%2Fespace');return;}
  setUid(user.id);
  const {data:initialData,error}=await client.from('model_profiles').select('*').eq('user_id',user.id).maybeSingle();
  let data=initialData;
  if(error){setMessage('Impossible de charger le profil. Réessayez plus tard.');setLoading(false);return;}
  if(!data){
   const meta=user.user_metadata||{};
   const name=String(meta.artist_name||'Mon profil');
   const slugBase=name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'mannequin';
   const {data:created,error:ce}=await client.from('model_profiles').insert({user_id:user.id,slug:slugBase+'-'+user.id.slice(0,8),display_name:name,city:String(meta.city||'Dakar'),country:String(meta.country||'Sénégal'),specialties:[],languages:[],measurements:{},visibility:{},professional_links:{},status:'draft',membership_tier:'BASIC'}).select('*').single();
   if(ce){setMessage('Compte connecté, mais le profil n’a pas pu être créé. Actualisez la page ou contactez FACEAFRICA.');setLoading(false);return;} data=created;
  }
  setProfile(data as P);
  const {data:rows}=await client.from('model_photos').select('id,storage_path,photo_type,moderation_status,created_at').eq('model_profile_id',data.id).order('created_at',{ascending:false});
  setPhotos((rows||[]) as Photo[]);setLoading(false);
 }
 useEffect(()=>{void load();},[]);
 function change<K extends keyof P>(key:K,value:P[K]){setProfile(old=>old?{...old,[key]:value}:old);}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!client||!profile)return;setBusy(true);setMessage('');
  const base=profile.display_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'mannequin';
  const changes={display_name:profile.display_name.trim(),slug:base+'-'+profile.id.slice(0,8),city:profile.city.trim(),country:profile.country.trim(),bio:profile.bio||null,specialties:profile.specialties,languages:profile.languages,experience:profile.experience||null,availability:profile.availability||null,agency_name:profile.agency_name||null,measurements:profile.measurements||{},phone_public:profile.phone_public||null,email_public:profile.email_public||null};
  const {data,error}=await client.from('model_profiles').update(changes).eq('id',profile.id).select('*').single();setBusy(false);
  if(error){setMessage('Enregistrement refusé. Les profils publiés doivent repasser en validation auprès de FACEAFRICA.');return;}
  setProfile(data as P);setMessage('Informations enregistrées. Les changements publics peuvent nécessiter une validation.');
 }
 async function submitForReview(){if(!client||!profile)return;setBusy(true);const {data,error}=await client.from('model_profiles').update({status:'pending_review'}).eq('id',profile.id).select('*').single();setBusy(false);if(error){setMessage('Impossible d’envoyer le profil en validation. Enregistrez d’abord vos informations ou contactez FACEAFRICA.');return;}setProfile(data as P);setMessage('Votre profil a été envoyé à FACEAFRICA pour validation.');}
 async function upload(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!client||!profile)return;const input=e.currentTarget.elements.namedItem('photo') as HTMLInputElement;const file=input.files?.[0];
  if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){setMessage('Formats autorisés : JPG, PNG ou WEBP, 8 Mo maximum.');return;}
  setBusy(true);setMessage('');const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';const path=uid+'/'+profile.id+'/'+crypto.randomUUID()+'.'+ext;
  const {error:up}=await client.storage.from('model-photos').upload(path,file,{contentType:file.type,upsert:false});
  if(up){setBusy(false);setMessage('Envoi impossible. Les droits de stockage doivent être configurés.');return;}
  const photoType=photos.some(existing=>existing.photo_type==='main')?'portfolio':'main';
  const {error:row}=await client.from('model_photos').insert({model_profile_id:profile.id,storage_path:path,photo_type:photoType,moderation_status:'pending',sort_order:photos.length});
  if(row){await client.storage.from('model-photos').remove([path]);setBusy(false);setMessage('Photo envoyée mais non enregistrée. Réessayez.');return;}
  input.value='';setBusy(false);setMessage('Photo reçue et mise en attente de validation.');await load();
 }
 async function removePhoto(p:Photo){if(!client||!confirm('Supprimer cette photo ?'))return;const {error}=await client.from('model_photos').delete().eq('id',p.id);if(error){setMessage('Suppression impossible.');return;}await client.storage.from('model-photos').remove([p.storage_path]);setPhotos(old=>old.filter(x=>x.id!==p.id));setMessage('Photo supprimée.');}
 if(loading)return <main className="wrap page-title"><h1>Mon espace mannequin</h1><p>Chargement…</p></main>;
 const statusLabels:Record<string,string>={draft:'Brouillon',pending_review:'En attente de validation',published:'Publié',rejected:'Modifications demandées',suspended:'Suspendu'};
 return <><header className="topbar"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><nav className="nav-links"><Link href="/mannequins">Catalogue</Link><Link href="/admin">Administration</Link></nav><button className="button" onClick={async()=>{await client?.auth.signOut();window.location.assign('/');}}>Déconnexion</button></div></header>
 <main id="contenu-principal" className="wrap" style={{maxWidth:920}}><section className="page-title"><div className="eyebrow">Espace personnel sécurisé</div><h1>Mon espace mannequin</h1><p className="lead">Modifiez vos informations et gérez votre portfolio. Vos photos restent privées jusqu’à leur validation.</p></section>
 {message&&<p className="notice" role="status">{message}</p>}{profile&&<><section className="feature" style={{marginBottom:22}}><h2>Statut de mon profil</h2><p><strong>{statusLabels[profile.status]||profile.status}</strong> · Offre {profile.membership_tier}</p>{profile.rejection_reason&&<p>{profile.rejection_reason}</p>}</section>
 <form className="feature" onSubmit={save}><h2>Mes informations professionnelles</h2><div className="search-panel" style={{boxShadow:'none',margin:0,padding:0,border:0,gridTemplateColumns:'1fr 1fr'}}>
 <div className="field"><label htmlFor="display_name">Nom d’artiste</label><input id="display_name" required maxLength={100} value={profile.display_name} onChange={e=>change('display_name',e.target.value)}/></div>
 <div className="field"><label htmlFor="city">Ville</label><input id="city" required value={profile.city} maxLength={100} onChange={e=>change('city',e.target.value)}/></div>
 <div className="field"><label htmlFor="country">Pays</label><input id="country" required value={profile.country} maxLength={100} onChange={e=>change('country',e.target.value)}/></div>
 <div className="field"><label htmlFor="specialties">Spécialités (virgules)</label><input id="specialties" value={(profile.specialties||[]).join(', ')} onChange={e=>change('specialties',e.target.value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,12))}/></div>
 <div className="field" style={{gridColumn:'1/-1'}}><label htmlFor="bio">Biographie</label><textarea id="bio" rows={4} maxLength={2000} value={profile.bio||''} onChange={e=>change('bio',e.target.value)}/></div>
 <div className="field"><label htmlFor="experience">Expérience</label><textarea id="experience" rows={3} value={profile.experience||''} maxLength={1500} onChange={e=>change('experience',e.target.value)}/></div>
 <div className="field"><label htmlFor="languages">Langues (virgules)</label><input id="languages" value={(profile.languages||[]).join(', ')} onChange={e=>change('languages',e.target.value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,12))}/></div>
 <div className="field"><label htmlFor="availability">Disponibilité</label><input id="availability" value={profile.availability||''} maxLength={300} onChange={e=>change('availability',e.target.value)}/></div>
 <div className="field"><label htmlFor="agency_name">Agence (facultatif)</label><input id="agency_name" value={profile.agency_name||''} maxLength={150} onChange={e=>change('agency_name',e.target.value)}/></div>
 {(['height','bust','waist','hips','shoe_size'] as const).map(k=><div className="field" key={k}><label htmlFor={k}>{({height:'Taille (cm)',bust:'Poitrine (cm)',waist:'Tour de taille (cm)',hips:'Hanches (cm)',shoe_size:'Pointure'} as Record<string,string>)[k]}</label><input id={k} value={String(profile.measurements?.[k]??'')} onChange={e=>change('measurements',{...profile.measurements,[k]:e.target.value})}/></div>)}
 <div className="field"><label htmlFor="phone_public">Téléphone public (facultatif)</label><input id="phone_public" value={profile.phone_public||''} type="tel" maxLength={40} onChange={e=>change('phone_public',e.target.value)}/></div>
 <div className="field"><label htmlFor="email_public">Email professionnel public (facultatif)</label><input id="email_public" value={profile.email_public||''} type="email" maxLength={320} onChange={e=>change('email_public',e.target.value)}/></div>
 </div><p className="notice">N’indiquez que les coordonnées que vous acceptez de rendre publiques.</p><button className="button primary" disabled={busy}>{busy?'Enregistrement…':'Enregistrer mes informations'}</button>{['draft','rejected'].includes(profile.status)&&<button type="button" className="button" style={{marginLeft:10}} disabled={busy} onClick={()=>void submitForReview()}>Envoyer en validation</button>}</form>
 <section className="feature" style={{marginTop:22}}><h2>Mon portfolio photo</h2><p className="muted">JPG, PNG ou WEBP, 8 Mo maximum. Toute photo reste privée jusqu’à sa validation.</p><form onSubmit={upload}><div className="field"><label htmlFor="photo">Choisir une photo</label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required/></div><button className="button primary" style={{marginTop:14}} disabled={busy}>{busy?'Envoi…':'Envoyer la photo'}</button></form>
 <div className="model-grid" style={{marginTop:20}}>{photos.map(p=><article className="model-card" key={p.id}><div className="portrait" style={{height:100,display:'grid',placeItems:'center'}}><span className="tag">Photo privée</span></div><div className="model-info"><p>{{pending:'En attente',approved:'Validée',rejected:'Refusée'}[p.moderation_status]||p.moderation_status}</p><button type="button" className="button" onClick={()=>void removePhoto(p)}>Supprimer</button></div></article>)}</div>{!photos.length&&<p className="muted">Aucune photo envoyée pour le moment.</p>}</section></>}
 </main><footer className="footer"><div className="wrap footer-inner"><strong>FACEAFRICA</strong><Link href="/">Accueil</Link></div></footer></>;
}