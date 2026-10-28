'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {createSupabaseBrowserClient} from '@/lib/supabase-browser';

export default function AdvertiserPage(){
 const client=createSupabaseBrowserClient();
 const [ready,setReady]=useState(false),[userId,setUserId]=useState(''),[message,setMessage]=useState('');
 const [businessName,setBusinessName]=useState(''),[activityType,setActivityType]=useState('Agence / marque');
 const [title,setTitle]=useState(''),[description,setDescription]=useState(''),[city,setCity]=useState('Dakar'),[country,setCountry]=useState('Sénégal'),[type,setType]=useState('Mode'),[deadline,setDeadline]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{void (async()=>{if(!client){setMessage('Service indisponible.');setReady(true);return;}const {data:{user}}=await client.auth.getUser();if(!user){setMessage('Connectez-vous pour soumettre une annonce.');setReady(true);return;}setUserId(user.id);const {data}=await client.from('advertisers').select('business_name,activity_type').eq('user_id',user.id).maybeSingle();if(data){setBusinessName(data.business_name||'');setActivityType(data.activity_type||'Agence / marque');}setReady(true);})();},[]);
 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(!client||!userId){setMessage('Connectez-vous avant de soumettre une annonce.');return;}
  if(!businessName.trim()){setMessage('Indiquez le nom de votre entreprise, agence ou marque.');return;}
  setBusy(true);setMessage('');
  const {data:existing,error:lookupError}=await client.from('advertisers').select('id').eq('user_id',userId).maybeSingle();
  if(lookupError){setBusy(false);setMessage('Impossible de vérifier votre profil professionnel : '+lookupError.message);return;}
  let advertiserId=existing?.id;
  if(!advertiserId){
   const {data:created,error:createError}=await client.from('advertisers').insert({user_id:userId,business_name:businessName.trim(),activity_type:activityType,city:city.trim(),country:country.trim(),status:'pending'}).select('id').single();
   if(createError||!created){setBusy(false);setMessage('Création du profil professionnel impossible : '+(createError?.message||'réponse invalide'));return;}
   advertiserId=created.id;
  }else{
   const {error:updateError}=await client.from('advertisers').update({business_name:businessName.trim(),activity_type:activityType,city:city.trim(),country:country.trim()}).eq('id',advertiserId);
   if(updateError){setBusy(false);setMessage('Mise à jour du profil professionnel impossible : '+updateError.message);return;}
  }
  const slug=title.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'-'+Date.now().toString(36);
  const {error}=await client.from('castings').insert({advertiser_id:advertiserId,slug,title:title.trim(),description:description.trim(),city:city.trim(),country:country.trim(),casting_type:type,status:'draft',deadline_at:deadline?new Date(deadline+'T23:59:00').toISOString():null});
  setBusy(false);
  if(error){setMessage('Profil professionnel enregistré, mais annonce non créée : '+error.message);return;}
  setMessage('Annonce enregistrée en brouillon. Votre profil professionnel et l’annonce devront être examinés par FACEAFRICA avant publication.');
  setTitle('');setDescription('');setDeadline('');
 }
 if(!ready)return <main className="wrap section"><p>Chargement…</p></main>;
 return <><header className="topbar"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><nav className="nav-links"><Link href="/castings">Castings publiés</Link><Link href="/articles">Articles</Link></nav><Link className="button" href="/connexion?next=%2Fannonceur">Connexion</Link></div></header><main className="wrap section" style={{maxWidth:850}}><div className="eyebrow">Espace professionnel</div><h1>Proposer une annonce</h1><p className="lead">Présentez votre opportunité de casting. Chaque annonce est examinée par l’équipe FACEAFRICA avant sa publication.</p>{message&&<p className="notice" role="status">{message}</p>}{!userId?<section className="feature"><p>Vous devez être connecté à votre compte pour déposer une annonce.</p><Link className="button primary" href="/connexion?next=%2Fannonceur">Se connecter</Link><p>Vous n’avez pas encore de compte ? <Link href="/inscription">Créer un compte</Link></p></section>:<form className="feature" onSubmit={submit}><h2>Votre profil professionnel</h2><label>Nom de l’entreprise, de l’agence ou de la marque *<input required maxLength={180} value={businessName} onChange={e=>setBusinessName(e.target.value)} /></label><label>Activité *<select value={activityType} onChange={e=>setActivityType(e.target.value)}><option>Agence / marque</option><option>Marque de mode</option><option>Agence de publicité</option><option>Photographe / production</option><option>Autre</option></select></label><label>Titre de l’annonce *<input required maxLength={180} value={title} onChange={e=>setTitle(e.target.value)} /></label><label>Description détaillée *<textarea required minLength={30} rows={6} value={description} onChange={e=>setDescription(e.target.value)} /></label><label>Type d’opportunité *<select value={type} onChange={e=>setType(e.target.value)}><option>Mode</option><option>Beauté</option><option>Publicité</option><option>Photographie</option><option>Vidéo</option><option>Lifestyle</option></select></label><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12}}><label>Ville *<input required value={city} onChange={e=>setCity(e.target.value)} /></label><label>Pays *<input required value={country} onChange={e=>setCountry(e.target.value)} /></label></div><label>Date limite (facultatif)<input type="date" min={new Date().toISOString().slice(0,10)} value={deadline} onChange={e=>setDeadline(e.target.value)} /></label><p className="notice">La soumission ne publie pas automatiquement l’annonce. L’administrateur doit contrôler et approuver le profil professionnel et l’annonce. Aucun paiement n’est demandé ici.</p><button className="button primary" disabled={busy}>{busy?'Envoi…':'Soumettre l’annonce'}</button></form>}</main><footer className="footer"><div className="wrap footer-inner"><Link href="/">Accueil FACEAFRICA</Link><Link href="/conditions">Conditions</Link><Link href="/confidentialite">Confidentialité</Link></div></footer></>;
}
