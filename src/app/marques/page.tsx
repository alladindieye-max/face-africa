import Link from 'next/link';

export const metadata = {
  title: 'Espace Marques',
  description: 'Présentez votre marque, trouvez des talents et proposez vos campagnes à la communauté FACEAFRICA.',
};

const benefits = [
  { number: '01', title: 'Accédez aux talents', description: 'Découvrez des mannequins, photographes et profils créatifs pour vos campagnes et productions.' },
  { number: '02', title: 'Diffusez vos castings', description: 'Présentez votre projet, précisez le profil recherché et recevez une annonce après examen par FACEAFRICA.' },
  { number: '03', title: 'Développez votre visibilité', description: 'Associez votre marque à un réseau dédié à la mode, à la beauté et à la création en Afrique.' },
];

export default function MarquesPage() {
  return (
    <>
      <header className="topbar">
        <div className="wrap nav">
          <Link href="/" className="brand"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link>
          <nav className="nav-links">
            <Link href="/mannequins">Mannequins</Link>
            <Link href="/photographes">Photographes</Link>
            <Link href="/castings">Castings</Link>
            <Link href="/academy">Academy</Link>
          </nav>
          <Link className="button primary" href="/annonceur">Espace professionnel</Link>
        </div>
      </header>

      <main className="wrap brands-page">
        <section className="brands-hero">
          <div className="eyebrow">L’espace des partenaires</div>
          <h1>Votre marque mérite les bons visages.</h1>
          <p className="lead">Connectez votre marque aux talents qui font évoluer la mode, la beauté et la création de contenu en Afrique. FACEAFRICA vous accompagne pour présenter vos projets et diffuser vos opportunités.</p>
          <div className="brands-actions">
            <Link className="button primary" href="/annonceur">Présenter mon projet <span aria-hidden="true">↗</span></Link>
            <Link className="button" href="/castings">Découvrir les castings</Link>
          </div>
          <div className="brands-hero-note">Mode · Beauté · Publicité · Production · Lifestyle</div>
        </section>

        <section className="brands-intro">
          <div>
            <div className="eyebrow">Pour les marques et professionnels</div>
            <h2>Transformez vos idées en collaborations.</h2>
          </div>
          <p>Que vous prépariez une campagne, un shooting ou un casting, trouvez un point d’entrée simple pour présenter votre besoin à notre équipe.</p>
        </section>

        <section className="brands-benefits" aria-label="Les avantages FACEAFRICA">
          {benefits.map((benefit) => (
            <article className="brands-benefit" key={benefit.number}>
              <span className="brands-number">{benefit.number}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </section>

        <section className="brands-process">
          <div className="eyebrow">Comment ça marche</div>
          <h2>Un parcours clair, de votre brief à sa publication.</h2>
          <ol>
            <li><span>1</span><div><strong>Présentez votre entreprise</strong><p>Connectez-vous et renseignez le nom de votre marque ou de votre agence.</p></div></li>
            <li><span>2</span><div><strong>Décrivez votre opportunité</strong><p>Ajoutez le titre, les détails, le lieu et le type de profils recherchés.</p></div></li>
            <li><span>3</span><div><strong>Notre équipe examine votre demande</strong><p>Le profil professionnel et l’annonce sont vérifiés avant toute publication. La soumission ne garantit pas une publication automatique.</p></div></li>
          </ol>
          <div className="brands-process-action">
            <div><strong>Vous avez une campagne à lancer ?</strong><p>Présentez votre projet à FACEAFRICA.</p></div>
            <Link className="button primary" href="/annonceur">Accéder à l’espace annonceur ↗</Link>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner"><strong>FACEAFRICA</strong><small>© FACEAFRICA · Espace Marques</small><Link href="/">Retour à l’accueil</Link></div>
      </footer>
    </>
  );
}
