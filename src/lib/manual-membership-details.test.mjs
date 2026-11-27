import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as balances from './nowpayments-balances.mjs';
import { memberSessionOwnerKey } from './member-session-boundary.mjs';
import { translateMessage } from '../i18n/translate.mjs';
import { registrationViewHarness } from '../app/register/registration-view-test-harness.mjs';

const member = { email: 'owner@example.test', subject: 'owner-subject' };
const suspended = { email: 'other@example.test', subject: 'other-subject' };
const item = { principal_usd: '100.00', gross_usd: '100.00', fee_usd: '3.00', net_usd: '97.00', pv: '100',
  started_at: '2026-11-27T13:43:17Z', lock_until: '2027-11-27T13:43:17Z',
  roi_available_usd: '0.00', roi_locked_usd: '0.00', eligibility: 'locked' };
const policy = {
  provider: 'manual', read_model_status: 'operational', withdrawals_enabled: false,
  commissions: Object.fromEntries(['pending', 'available', 'funding_held', 'credited', 'paid_external'].map(key => [key + '_usd', '0.00'])),
  membership: { principal_locked_usd: '100.00', principal_available_usd: '0.00',
    roi_locked_usd: '0.00', roi_available_usd: '0.00', items: [item] },
};
policy.commissions.items = [];
const i18n = { useI18n: () => ({ locale: 'es', t: key => translateMessage('es', key) }) };
const nullComponent = { default: () => null };

function detailsHarness() {
  return registrationViewHarness('../../components/panel/overview/ManualMembershipDetails.jsx', {
    '@/i18n/LanguageProvider': i18n, '@/lib/nowpayments-balances.mjs': balances,
  });
}

test('the manual package view shows verified principal, PV and active ROI and identifies a review separately', () => {
  const detail = detailsHarness();
  const markup = renderToStaticMarkup(detail.render({ items: [item] }));
  assert.match(markup, /\$100\.00 USD/);
  assert.match(markup, /100 PV/);
  assert.match(markup, /ROI activo/);
  assert.doesNotMatch(markup, /97\.00|Retirar/);
  const underReview = renderToStaticMarkup(detail.render({ items: [{ ...item, eligibility: 'risk_review' }] }));
  assert.match(underReview, /ROI en revisión/);
  assert.doesNotMatch(underReview, /ROI activo/);
});

test('Resumen renders the manual membership for the resolved owner and hides a late response from the previous owner', () => {
  const detail = detailsHarness();
  let current = member;
  const requests = [];
  const page = registrationViewHarness('../../components/panel/overview/OverviewDashboard.jsx', {
    'next/link': nullComponent, 'next/dynamic': { default: () => () => null }, 'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/i18n/LanguageSwitcher': nullComponent, '@/i18n/LanguageProvider': i18n,
    '@/lib/member-read.mjs': { readMemberParts(parts, options) { requests.push({ parts, ...options }); },
      validMemberSummary: () => true, validMemberTree: () => true },
    '@/hooks/usePersonalWalletBalance': { usePersonalWalletBalance: () => ({ loading: true }) },
    '@/lib/personal-company-payment-values.mjs': { personalCompanyPaymentAtomic: () => null },
    '@/components/wallet/PersonalWalletBalances': nullComponent,
    './OverviewDiscoveryCard': nullComponent, './PositionSnapshotCard': nullComponent,
    '@/lib/member-session-context': { useMemberSession: () => current },
    '@/lib/member-session-boundary.mjs': { memberSessionOwnerKey },
    '@/components/member/useHistoricalPackageRights': { default: () => ({ data: null }) },
    '@/components/member/HistoricalPackageRightsCard': nullComponent,
    '@/components/member/RechargePackageCard': nullComponent,
    './ManualMembershipDetails': detail.exports,
  });
  page.render();
  assert.equal(requests[0].parts.summary.url, '/api/payments/me');
  requests[0].onPart('summary', { data: { active_packages: 1, manual_memberships: policy } });
  const verified = renderToStaticMarkup(page.render());
  assert.match(verified, /Mis membresías/);
  assert.match(verified, /100\.00 USD.*100 PV.*ROI activo/s);
  current = suspended;
  assert.doesNotMatch(renderToStaticMarkup(page.render()), /ROI activo/);
  assert.equal(requests[0].signal.aborted, true);
  requests[0].onPart('summary', { data: { active_packages: 1, manual_memberships: policy } });
  requests[1].onPart('summary', { data: { active_packages: 0, manual_memberships: { ...policy, provider: 'nowpayments' } } });
  assert.doesNotMatch(renderToStaticMarkup(page.render()), /100 PV|ROI activo/);
  page.unmount();
});
