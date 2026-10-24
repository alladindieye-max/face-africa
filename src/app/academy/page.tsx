import Link from 'next/link';

export const metadata = {
  title: 'FACEAFRICA Academy',
  description: 'Micro-formations pour les mannequins et créateurs de contenu en Afrique de l’Ouest.',
};

const courses = [
  {
    category: 'Acting & Casting',
    title: 'Réussir un casting caméra',
    description: 'Préparer sa présentation, comprendre une consigne et gagner en aisance face à la caméra.',
    level: 'Débutant',
    format: 'Parcours vidéo',
    status: 'Bientôt disponible',
  },
  {
    category: 'Droit & Business',
    title: 'Comprendre les droits à l’image',
    description: 'Les points à vérifier avant de signer une autorisation ou un contrat de cession de droits.',
    level: 'Essentiel',
    format: 'Guide pratique',
    status: 'Bientôt disponible',
  },
  {
    category: 'Content Creation',
    title: 'Créer des Reels professionnels',
    description: 'Construire une courte vidéo, préparer son tournage et organiser son contenu pour les marques.',
    level: 'Débutant',
    format: 'Atelier vidéo',
    status: 'Bientôt disponible',
  },
];

export default function AcademyPage() {
  return <>
    <header className="topbar"><div className="wrap nav"><Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link><nav className="nav-links"><Link href="/mannequins">Mannequins</Link><Link href="/academy">Academy</Link><Link href="/shooting-photo">Prestations</Link></nav><Link className="button primary" href="/inscription">Rejoindre FACEAFRICA</Link></div></header>
    <main className="wrap">
      <section className="page-title">
        <div className="eyebrow">Apprendre · progresser · entreprendre</div>
        <h1>FACEAFRICA Academy</h1>
        <p className="lead">Des ressources pour développer tes compétences, protéger ton image et construire une activité professionnelle durable dans la mode et la création de contenu.</p>
      </section>
      <section className="feature" style={{ marginBottom: 28 }}>
        <h2>Apprendre à devenir un Modelpreneur</h2>
        <p>Le mannequinat ne se limite pas aux shootings. Développe aussi tes compétences en casting, en droit à l’image et en création de contenu.</p>
        <div className="tags"><span className="tag">Casting</span><span className="tag">Droits à l’image</span><span className="tag">Reels & TikTok</span><span className="tag">Business</span></div>
      </section>
      <div className="results-line"><strong>Parcours de formation</strong><span className="muted">Le catalogue s’enrichira progressivement.</span></div>
      <section className="model-grid" aria-label="Catalogue des formations">
        {courses.map((course) => <article className="model-card" key={course.title}>
          <div className="portrait" style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#f3e8dd' }}>
            <span style={{ color: '#573B2D', fontWeight: 700 }}>{course.category}</span>
          </div>
          <div className="model-info">
            <div className="tags"><span className="tag">{course.level}</span><span className="tag">{course.format}</span></div>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <p className="muted"><small>{course.status} — aucun paiement n’est demandé pour le moment.</small></p>
          </div>
        </article>)}
      </section>
      <section className="feature" style={{ marginTop: 28, marginBottom: 28 }}>
        <h2>Bibliothèque vidéo</h2>
        <p>Retrouve les vidéos FACEAFRICA déjà publiées : portraits, conseils et coulisses. Les nouvelles formations seront ajoutées au fur et à mesure de leur validation.</p>
        <Link className="button primary" href="/videos">Voir les vidéos disponibles ↗</Link>
        <Link className="button" href="/articles" style={{ marginLeft: 8 }}>Lire les articles</Link>
      </section>
      <section className="feature" style={{ marginTop: 32 }}>
        <h2>Ateliers et masterclasses à Dakar</h2>
        <p>Les prochaines sessions physiques de coaching de marche, de préparation au casting et de création de contenu seront annoncées ici.</p>
        <p className="notice">Les inscriptions et réservations seront activées lorsque le calendrier et les modalités de participation seront configurés.</p>
        <Link className="button" href="/mannequins">Découvrir les mannequins</Link>
      </section>
    </main>
    <footer className="footer"><div className="wrap footer-inner"><strong>FACEAFRICA</strong><small>© FACEAFRICA · Academy</small><Link href="/">Retour à l’accueil</Link></div></footer>
  </>;
}
