import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'FACEAFRICA — Les visages qui façonnent la mode africaine', template: '%s | FACEAFRICA' },
  description: 'Découvrez les mannequins photo, explorez leurs portfolios et accédez aux opportunités qui font grandir les talents africains.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: { title: 'FACEAFRICA', description: 'Les visages qui façonnent la mode africaine.', type: 'website', locale: 'fr_SN' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
