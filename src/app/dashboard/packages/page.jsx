import { Suspense } from 'react';
import { MemberSummaryProvider } from '@/hooks/useMemberSummary';
import CompanyPaymentPage from '../_components/executive-pages/CompanyPaymentPage';
import PaymentResultModal from './PaymentResultModal';

export const dynamic = 'force-dynamic';

// Company receipts are allocated later. Existing provider-return bookmarks
// retain independent verification and cannot activate a wallet transfer.
export default function PackagesPage() {
  return <MemberSummaryProvider fresh>
    <Suspense fallback={null}><PaymentResultModal /></Suspense>
    <CompanyPaymentPage />
  </MemberSummaryProvider>;
}
