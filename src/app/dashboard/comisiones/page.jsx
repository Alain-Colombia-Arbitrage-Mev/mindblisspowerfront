import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { isPagarCommissionsHost } from '@/lib/pagar-commissions-bff.mjs';
import PagarCommissionsPage from '../_components/executive-pages/PagarCommissionsPage';

export default async function CommissionsPage() {
  if (!isPagarCommissionsHost((await headers()).get('host'))) notFound();
  return <PagarCommissionsPage />;
}
