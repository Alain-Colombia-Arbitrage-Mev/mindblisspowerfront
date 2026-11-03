import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Acceso | Mindbliss Power', robots: { index: false, follow: false } };

export default function SecurityPage() {
  redirect('/login');
}
