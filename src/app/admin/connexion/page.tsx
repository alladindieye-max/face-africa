import { redirect } from 'next/navigation';

export default function AdminConnexionPage() {
  redirect('/connexion?next=%2Fadmin');
}
