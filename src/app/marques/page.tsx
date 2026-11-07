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

const editorials = [
  { label: 'CASTING & CAMPAGNES', title: 'Les prochains visages de votre campagne.', image: 'https://images.pexels.com/photos/28649427/pexels-photo-28649427/free-photo-of-stylish-african-fashion-portrait-in-studio.jpeg?auto=compress&cs=tinysrgb&w=1200', href: '/castings', className: 'brand-editorial-tall' },
  { label: 'MODE CONTEMPORAINE', title: 'L’élégance africaine en mouvement.', image: 'https://images.pexels.com/photos/35073808/pexels-photo-35073808/free-photo-of-indoor-photoshoot-with-african-model-in-abuja-studio.jpeg?auto=compress&cs=tinysrgb&w=1000', href: '/mannequins', className: '' },
  { label: 'TALENTS CRÉATIFS', title: 'Une nouvelle scène, de nouvelles histoires.', image: 'https://images.pexels.com/photos/20611277/pexels-photo-20611277/free-photo-of-african-woman-posing-in-a-studio.jpeg?auto=compress&cs=tinysrgb&w=1000', href: '/photographes', className: '' },
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

      <main className="wrap brands-page brands-page-editorial">
        <section className="brands-hero brands-hero-visual">
          <div className="brands-hero-image" aria-hidden="true" />
          <div className="brands-hero-content">
            <div className="eyebrow">L’espace des marques · La scène mode africaine</div>
            <h1>Votre marque mérite <em>les bons visages.</em></h1>
            <p className="lead">Des talents singuliers. Des campagnes qui marquent. Connectez votre marque aux mannequins et créatifs qui font évoluer la mode, la beauté et l’image en Afrique.</p>
            <div className="brands-actions">
              <Link className="button primary" href="/annonceur">Lancer une campagne <span aria-hidden="true">↗</span></Link>
              <Link className="button" href="/castings">Voir les opportunités</Link>
            </div>
            <div className="brands-hero-note">Mode · Beauté · Éditorial · Publicité · Lifestyle</div>
          </div>
          <span className="brands-hero-stamp" aria-hidden="true">AFRICA<br/>IN FASHION</span>
        </section>

        <section className="brands-editorial-intro">
          <div><div className="eyebrow">L’image est votre signature</div><h2>Donnez vie à vos idées. <em>Faites rayonner vos campagnes.</em></h2></div>
          <p>FACEAFRICA vous aide à rencontrer les bons profils, à présenter vos briefs et à faire émerger des collaborations créatives sur la scène africaine.</p>
        </section>

        <section className="brands-editorial-grid" aria-label="Univers mode FACEAFRICA">
          {editorials.map((item) => (
            <Link href={item.href} className={`brand-editorial-card ${item.className}`} key={item.label} style={{ backgroundImage: `linear-gradient(180deg,transparent 35%,rgba(20,12,9,.78)),url("${item.image}")` }}>
              <span>{item.label}</span><h3>{item.title}</h3><b aria-hidden="true">↗</b>
            </Link>
          ))}
        </section>

        <section className="brands-benefit-section">
          <div className="eyebrow">Pour les marques et professionnels</div><h2>De l’idée à la collaboration.</h2>
          <div className="brands-benefits" aria-label="Les avantages FACEAFRICA">
            {benefits.map((benefit) => (
              <article className="brands-benefit" key={benefit.number}>
                <span className="brands-number">{benefit.number}</span><h3>{benefit.title}</h3><p>{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="brands-opportunities">
          <div><div className="eyebrow">Le tableau d’inspiration</div><h2>Les talents et les castings <em>à l’affiche.</em></h2><p>Explorez les opportunités publiées et imaginez votre prochaine campagne avec les profils FACEAFRICA.</p></div>
          <Link className="button primary" href="/castings">Explorer les annonces ↗</Link>
        </section>

        <section className="brands-process">
          <div className="eyebrow">Votre projet, notre accompagnement</div>
          <h2>Un parcours clair, de votre brief à sa publication.</h2>
          <ol>
            <li><span>1</span><div><strong>Présentez votre entreprise</strong><p>Connectez-vous et renseignez le nom de votre marque ou de votre agence.</p></div></li>
            <li><span>2</span><div><strong>Décrivez votre opportunité</strong><p>Ajoutez le titre, les détails, le lieu et le type de profils recherchés.</p></div></li>
            <li><span>3</span><div><strong>Notre équipe examine votre demande</strong><p>Le profil professionnel et l’annonce sont vérifiés avant toute publication. La soumission ne garantit pas une publication automatique.</p></div></li>
          </ol>
          <div className="brands-process-action">
            <div><strong>Votre prochaine campagne commence ici.</strong><p>Présentez votre projet à l’équipe FACEAFRICA.</p></div>
            <Link className="button primary" href="/annonceur">Accéder à l’espace annonceur ↗</Link>
          </div>
        </section>
      </main>

      <footer className="footer"><div className="wrap footer-inner"><strong>FACEAFRICA</strong><small>© FACEAFRICA · Espace Marques</small><Link href="/">Retour à l’accueil</Link></div></footer>
    </>
  );
}
