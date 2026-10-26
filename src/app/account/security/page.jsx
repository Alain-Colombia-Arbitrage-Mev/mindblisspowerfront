import PhoneOptIn from './PhoneOptIn';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Validación SMS opcional | Mindbliss Power', robots: { index: false, follow: false } };

export default function SecurityPage() {
  return <PhoneOptIn />;
}
