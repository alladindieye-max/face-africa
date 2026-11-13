'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const primaryItems = [
  { href: '/', label: 'Accueil', icon: '⌂' },
  { href: '/mannequins', label: 'Talents', icon: '◉' },
  { href: '/castings', label: 'Castings', icon: '✦' },
  { href: '/photographes', label: 'Photo', icon: '▧' },
];

export default function MobileAppNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    void client.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  const moreItems = user
    ? [{ href: '/academy', label: 'Academy' }, { href: '/marques', label: 'Marques' }, { href: '/articles', label: 'Articles' }, { href: '/shooting-photo', label: 'Shooting photo' }, { href: '/espace', label: 'Mon espace mannequin' }]
    : [{ href: '/academy', label: 'Academy' }, { href: '/marques', label: 'Marques' }, { href: '/articles', label: 'Articles' }, { href: '/shooting-photo', label: 'Shooting photo' }, { href: '/connexion', label: 'Connexion' }, { href: '/inscription', label: 'Créer mon profil' }];
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {menuOpen && <button className="mobile-menu-backdrop" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />}
      {menuOpen && (
        <section className="mobile-more-panel" aria-label="Autres rubriques">
          <div className="mobile-more-heading"><strong>Explorer FACEAFRICA</strong><button onClick={() => setMenuOpen(false)} aria-label="Fermer">×</button></div>
          <div className="mobile-more-grid">
            {moreItems.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}<span aria-hidden="true">↗</span></Link>)}
          </div>
        </section>
      )}
      <nav className="mobile-app-nav" aria-label="Navigation mobile">
        {primaryItems.map(item => (
          <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={isActive(item.href) ? 'active' : ''}>
            <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <button type="button" aria-expanded={menuOpen} aria-label="Ouvrir les autres rubriques" className={menuOpen ? 'active' : ''} onClick={() => setMenuOpen(value => !value)}>
          <span className="mobile-nav-icon" aria-hidden="true">☰</span>
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
