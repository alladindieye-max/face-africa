'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) { setReady(true); return; }
    let active = true;
    const loadAccount = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setDisplayName('');
        setReady(true);
        return;
      }
      const metadataName = String(nextUser.user_metadata?.artist_name || nextUser.user_metadata?.full_name || '');
      const { data } = await client.from('model_profiles').select('display_name').eq('user_id', nextUser.id).maybeSingle();
      if (active) {
        setDisplayName(data?.display_name || metadataName || nextUser.email?.split('@')[0] || 'Mon compte');
        setReady(true);
      }
    };
    void client.auth.getSession().then(({ data }) => loadAccount(data.session?.user ?? null));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      void loadAccount(session?.user ?? null);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [pathname]);

  async function signOut() {
    const client = createSupabaseBrowserClient();
    if (client) await client.auth.signOut();
    setMenuOpen(false);
    window.location.assign('/');
  }

  const initials = displayName.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'FA';

  return (
    <header className="topbar site-global-header">
      <div className="wrap nav site-global-nav">
        <Link href="/" className="brand" aria-label="FACEAFRICA — Accueil"><span className="brand-mark">FA</span><span>FACEAFRICA</span></Link>
        <nav className="nav-links site-global-links" aria-label="Navigation principale">
          <Link href="/mannequins">Mannequins</Link><Link href="/academy">Academy</Link><Link href="/photographes">Photographes</Link><Link href="/castings">Castings</Link><Link href="/marques">Marques</Link><Link href="/articles">Articles</Link>
        </nav>
        <div className="site-account">
          {ready && user ? (
            <div className="site-account-wrap">
              <button type="button" className="site-avatar" aria-label="Ouvrir le menu du compte" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>{initials}</button>
              <span className="site-account-name">{displayName}</span>
              {menuOpen && <div className="site-account-menu">
                <strong>{displayName}</strong>
                <Link href="/espace" onClick={() => setMenuOpen(false)}>Tableau de bord</Link>
                <Link href="/espace?tab=profile" onClick={() => setMenuOpen(false)}>Mon profil</Link>
                <Link href="/espace?tab=castings" onClick={() => setMenuOpen(false)}>Mes candidatures</Link>
                <button type="button" onClick={() => void signOut()}>Déconnexion</button>
              </div>}
            </div>
          ) : ready ? <><Link className="button" href="/connexion">Connexion</Link><Link className="button primary" href="/inscription">Créer mon profil</Link></> : <span className="site-account-loading" aria-label="Chargement du compte" />}
        </div>
      </div>
    </header>
  );
}
