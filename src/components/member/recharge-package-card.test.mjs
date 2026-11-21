import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness } from '../../app/register/registration-view-test-harness.mjs';
import { translateMessage } from '../../i18n/translate.mjs';
import { rechargePackageTier } from '../../lib/recharge-package-contract.mjs';

const ownerA = { subject: 'member-a', email: 'synthetic@example.test' };
const ownerB = { ...ownerA, subject: 'member-b' };
const topUp = { package: { level: 3, ceilingUsdMinor: 25_000, grossUsdMinor: 13_789, confirmedAt: '2026-11-20T13:15:30.000Z' } };
const receipt = { ...topUp, pagarBenefits: { activeGrossUsdMinor: 13_789, roiAccruedUsdMinor: 42, ownPv: 137, bonusCreditedUsdMinor: 260 } };
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture(t, read, locale = 'es') {
  const calls = [], browser = new EventTarget(), retire = new Set();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  const subscribe = callback => { retire.add(callback); return () => retire.delete(callback); };
  const view = registrationViewHarness('../../components/member/RechargePackageCard.jsx', {
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale, t: (key, variables) => translateMessage(locale, key, variables) }) },
    '@/lib/recharge-package-client.mjs': { readRechargePackage(subject, { signal }) { calls.push({ subject, signal }); return read(subject); } },
    '@/lib/recharge-package-contract.mjs': { rechargePackageTier },
    '@/lib/member-logout-sync.mjs': { subscribeMemberLogout: subscribe },
    '@/lib/member-session-sync.mjs': { subscribeMemberSessionReplacement: subscribe },
    'next/link': { default: ({ prefetch: _prefetch, ...props }) => createElement('a', props) },
    'lucide-react': { BadgeCheck: () => null, Clock3: () => null }, './recharge-package.module.css': { default: {} },
  });
  t.after(() => { view.unmount(); if (original) Object.defineProperty(globalThis, 'window', original); else delete globalThis.window; });
  return { calls, browser, retire, render: (session = ownerA, compact = false) => view.render({ session, compact }) };
}

test('confirmed Pagar gross determines the active package in all portal languages, with more detail in profile', async t => {
  for (const locale of ['es', 'en', 'ar', 'zh']) await t.test(locale, async child => {
    const h = fixture(child, async () => receipt, locale);
    assert.equal(h.render(), null); await settle();
    const compact = renderToStaticMarkup(h.render(ownerA, true)), profile = renderToStaticMarkup(h.render(ownerA));
    const level = new Intl.NumberFormat(locale).format(receipt.package.level);
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'code' }).format(137.89);
    for (const html of [compact, profile]) {
      assert.ok(html.includes(translateMessage(locale, 'rechargePackage.title')));
      assert.ok(html.includes(translateMessage(locale, 'rechargePackage.level', { level })));
      assert.ok(html.includes(money));
      assert.doesNotMatch(html, /href="\/dashboard\/wallet-personal\/pay"/);
    }
    assert.ok(profile.includes(translateMessage(locale, 'rechargePackage.ceiling')));
    assert.ok(!compact.includes(translateMessage(locale, 'rechargePackage.ceiling')));
    assert.equal(h.calls.length, 1);
  });
});

test('a top-up without a Pagar credit displays a pending payment rather than an active package', async t => {
  const h = fixture(t, async () => ({
    ...topUp, pagarBenefits: { activeGrossUsdMinor: 0, roiAccruedUsdMinor: 0, ownPv: 0, bonusCreditedUsdMinor: 0 },
  }));
  h.render(); await settle();
  const html = renderToStaticMarkup(h.render());
  assert.match(html, />Pago pendiente</);
  assert.match(html, /Tu paquete se activa cuando se confirma el pago completo desde Pagar/);
  assert.match(html, /href="\/dashboard\/wallet-personal\/pay"/);
  assert.doesNotMatch(html, /Paquete activo|Paquete 3|Total bruto pagado/);
});

test('a legacy top-up snapshot cannot prove payment or prompt a second payment', async t => {
  const h = fixture(t, async () => topUp);
  h.render(); await settle();
  const html = renderToStaticMarkup(h.render());
  assert.match(html, />Estado del paquete en verificación</);
  assert.doesNotMatch(html, /Paquete activo|Paquete 3|href="\/dashboard\/wallet-personal\/pay"/);
});

test('pending top-ups cannot upgrade the already active package and the upper bound stays inclusive', async t => {
  const h = fixture(t, async () => ({
    ...receipt, pagarBenefits: { ...receipt.pagarBenefits, activeGrossUsdMinor: 5_000 },
  }));
  h.render(); await settle();
  const html = renderToStaticMarkup(h.render());
  assert.match(html, />Paquete activo</);
  assert.match(html, />Paquete 1</);
  assert.match(html, />Total bruto pagado</);
  assert.match(html, /Las nuevas recargas cuentan para tu paquete cuando se confirma su pago completo/);
  assert.doesNotMatch(html, />Paquete 3</);
});

test('focus refresh is bounded to one read and a late previous-account response cannot show a package', async t => {
  let resolveLate;
  const late = new Promise(resolve => { resolveLate = resolve; });
  let first = true;
  const h = fixture(t, async subject => {
    if (subject === ownerB.subject) return { package: null };
    if (first) { first = false; return receipt; }
    return late;
  });
  assert.equal(h.render(), null); await settle(); assert.ok(h.render());
  h.browser.dispatchEvent(new Event('focus')); h.browser.dispatchEvent(new Event('focus'));
  assert.equal(h.calls.length, 2);
  assert.equal(h.render(ownerB), null);
  assert.equal(h.calls[1].signal.aborted, true);
  resolveLate(receipt); await settle(); assert.equal(h.render(ownerB), null);
  assert.deepEqual(h.calls.map(value => value.subject), [ownerA.subject, ownerA.subject, ownerB.subject]);
});

test('the package card identifies virtual commission balances separately from PV and clears them on account change', async t => {
  const h = fixture(t, async subject => subject === ownerA.subject
    ? receipt
    : { package: null });
  h.render(); await settle();
  const html = renderToStaticMarkup(h.render(ownerA, true));
  for (const key of ['pagar', 'roi', 'pv']) assert.ok(html.includes(translateMessage('es', `rechargePackage.${key}`)));
  assert.match(html, /<dt>Saldo virtual de comisiones<\/dt>/);
  assert.ok(html.includes(new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', currencyDisplay: 'code' }).format(2.60)));
  assert.equal(h.render(ownerB), null);
});

test('confirmed logout clears the package immediately and retires its listener without a new read', async t => {
  const h = fixture(t, async () => receipt);
  h.render(); await settle(); assert.ok(h.render());
  for (const retire of h.retire) retire();
  h.browser.dispatchEvent(new Event('focus'));
  assert.equal(h.render(), null);
  assert.equal(h.calls[0].signal.aborted, true);
  assert.equal(h.calls.length, 1);
});
