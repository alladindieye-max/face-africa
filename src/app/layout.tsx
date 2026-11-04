import type { Metadata } from 'next';
import { Jost, Playfair_Display } from 'next/font/google';
import './globals.css';

const jost = Jost({ subsets: ['latin'], variable: '--font-jost', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'FACEAFRICA — Les visages qui façonnent la mode africaine', template: '%s | FACEAFRICA' },
  description: 'Découvrez les mannequins photo, explorez leurs portfolios et accédez aux opportunités qui font grandir les talents africains.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.faceafrica.com'),
  openGraph: { title: 'FACEAFRICA', description: 'Les visages qui façonnent la mode africaine.', type: 'website', locale: 'fr_SN', images: ['/og-faceafrica.png'] },
  twitter: { card: 'summary_large_image', title: 'FACEAFRICA', description: 'Les visages qui façonnent la mode africaine.', images: ['/og-faceafrica.png'] },
  appleWebApp: { capable: true, title: 'FACEAFRICA' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body className={`${jost.variable} ${playfair.variable}`}><a className="skip-link" href="#contenu-principal">Aller au contenu</a>{children}</body></html>;
}
