import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { isPagarCommissionsHost } from '@/lib/pagar-commissions-bff.mjs';
import { PAGAR_COMMISSIONS_PAGE } from '@/lib/pagar-commissions-contract.mjs';
import { BonusesDashboardPage } from "../_components/executive-pages/BonusesDashboardPage";

export default async function BonusesPage() {
  if (isPagarCommissionsHost((await headers()).get('host'))) redirect(PAGAR_COMMISSIONS_PAGE);
  return <BonusesDashboardPage />;
}
