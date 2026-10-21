import Link from 'next/link';

export const metadata = {
  title: 'Castings | FACEAFRICA',
  description: 'Les opportunités de casting mode, beauté et publicité sur FACEAFRICA.',
};

export default function CastingsPage() {
  return (
    <>
      <header className="topbar">
        <div className="wrap nav">
          <Link href="/" className="brand">
            <span className="brand-mark">FA</span>
            <span>FACEAFRICA</span>
          </Link>
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
          <p className="lead">
            Des opportunités mode, beauté, publicité et photographie, avec des critères clairs
            et des informations de candidature vérifiées.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/inscription">Préparer mon profil ↗</Link>
            <Link className="button" href="/mannequins">Découvrir les mannequins</Link>
          </div>
        </section>
        <section className="section">
          <div className="casting-grid">
            <article className="casting">
              <div className="location">MODE · DAKAR</div>
              <h2>Défilés et éditoriaux</h2>
              <p>Les annonces publiées préciseront le profil recherché, le lieu, les dates et les modalités de candidature.</p>
              <span className="tag">Annonces en préparation</span>
            </article>
            <article className="casting">
              <div className="location">BEAUTÉ · PUBLICITÉ</div>
              <h2>Campagnes de marque</h2>
              <p>Les campagnes validées pourront inclure une affiche, une description et un contact de candidature communiqué par l’annonceur.</p>
              <span className="tag">Annonces en préparation</span>
            </article>
            <article className="casting">
              <div className="location">PHOTO · CRÉATION</div>
              <h2>Projets photo et portfolio</h2>
              <p>Les opportunités seront affichées après vérification afin de limiter les annonces trompeuses et les demandes abusives.</p>
              <span className="tag">Annonces en préparation</span>
            </article>
          </div>
          <p className="notice">
            Aucune annonce active n’est publiée pour le moment. Nous ne présentons pas ces exemples comme des castings réels.
            Les candidatures et les annonces seront activées lorsque la publication et la modération seront configurées.
          </p>
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
