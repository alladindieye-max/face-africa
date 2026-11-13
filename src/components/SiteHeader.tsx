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
    <style jsx global>{`
      .topbar:not(.site-global-header) { display: none !important; }
      .site-global-header { position: sticky; top: 0; z-index: 50; }
      .site-global-nav { min-height: 76px; }
      .site-global-links { gap: clamp(10px, 1.5vw, 22px); }
      .site-global-links a { white-space: nowrap; }
      .site-account { display: flex; align-items: center; gap: 8px; min-width: max-content; }
      .site-account-wrap { position: relative; display: flex; align-items: center; gap: 9px; }
      .site-avatar { width: 42px; height: 42px; border: 0; border-radius: 50%; background: var(--clay, #A65B3A); color: white; font-weight: 800; cursor: pointer; }
      .site-account-name { max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; font-weight: 700; }
      .site-account-menu { position: absolute; top: calc(100% + 12px); right: 0; z-index: 80; display: grid; gap: 4px; min-width: 220px; padding: 12px; border: 1px solid var(--line, #e3d2c3); border-radius: 12px; background: #fffaf4; box-shadow: 0 14px 36px #2b170f26; }
      .site-account-menu strong { padding: 8px 10px; overflow-wrap: anywhere; }
      .site-account-menu a, .site-account-menu button { display: block; padding: 10px; border: 0; border-radius: 7px; background: transparent; color: var(--deep, #573B2D); text-align: left; text-decoration: none; font: inherit; font-size: 14px; cursor: pointer; }
      .site-account-menu a:hover, .site-account-menu button:hover { background: #f3e8dd; }
      .site-account-loading { width: 90px; height: 38px; }
      @media (max-width: 950px) { .site-global-links { display: none; } .site-global-nav { min-height: 68px; } }
      @media (max-width: 430px) { .site-account-name { display: none; } .site-global-nav { gap: 8px; } .site-global-nav > .brand { gap: 7px; letter-spacing: .07em; font-size: 12px; } .site-global-nav > .brand .brand-mark { width: 38px; height: 38px; } .site-account .button { min-height: 38px; padding: 7px 9px; font-size: 11px; } }
    `}</style>
  );
}
