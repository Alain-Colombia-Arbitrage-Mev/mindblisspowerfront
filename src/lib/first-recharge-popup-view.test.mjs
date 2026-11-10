import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { registrationViewHarness, findRegistrationNode as find } from '../app/register/registration-view-test-harness.mjs';

const copy = {
  'common.close': 'Cerrar',
  'recharge.welcomeEyebrow': 'Tu primera recarga', 'recharge.welcomeTitle': 'Todo empieza con\ntu primera recarga.',
  'recharge.welcomeCopy': 'Añade saldo y deja tu wallet lista.', 'recharge.stepMethod': 'Elige tu método',
  'recharge.stepReview': 'Revisa importe, activo y red', 'recharge.stepConfirm': 'Confirma la recarga',
  'recharge.start': 'Hacer mi primera recarga', 'recharge.notNow': 'Ahora no',
  'recharge.methodsEyebrow': 'Recarga a tu manera', 'recharge.methodsTitle': 'Tu wallet está lista.',
  'recharge.methodsCopy': 'Elige una opción.', 'recharge.buyTitle': 'Recargar fondos',
  'recharge.buyCopy': 'Revisa las opciones.', 'recharge.buyAction': 'Recargar fondos',
  'recharge.receiveTitle': 'Recibir desde otra wallet', 'recharge.receiveCopy': 'Verifica activo y red.',
  'recharge.receiveAction': 'Ver cómo recibir', 'recharge.providerUnavailable': 'Reown no disponible.', 'recharge.later': 'Lo haré después',
  'recharge.providerMismatch': 'Wallet distinta.', 'recharge.reconnectWallet': 'Reconectar wallet vinculada',
  'recharge.reminderEyebrow': 'Tu wallet · Primera recarga', 'recharge.balanceAvailable': 'Saldo disponible',
  'recharge.reminderTitle': '¿Tu primera recarga?', 'recharge.reminderCopy': 'Añade saldo.',
  'recharge.recharge': 'Recargar mi wallet', 'recharge.continue': 'Seguir explorando',
  'overview.wallet': 'Mi wallet', 'overview.demo': 'Demo', 'overview.underReview': 'En revisión',
  'overview.active': 'Activa', 'overview.uncreated': 'Sin crear', 'overview.totalBalance': 'BALANCE TOTAL',
  'overview.demoCopy': 'Demo', 'overview.emptyWalletCopy': 'Crea tu wallet', 'overview.createWallet': 'Crear wallet',
  'overview.receive': 'Recibir', 'overview.topUp': 'Recargar saldo', 'overview.howItWorks': 'Cómo funciona',
};

const icons = new Proxy({}, { get: () => () => null });
const radix = {
  Root: ({ open, children }) => open ? React.createElement('div', null, children) : null,
  Portal: ({ children }) => children,
  Overlay: props => React.createElement('div', props),
  Content: ({ children, ...props }) => React.createElement('section', props, children),
  Title: ({ children, ...props }) => React.createElement('h2', props, children),
  Description: ({ children, ...props }) => React.createElement('p', props, children),
  Close: ({ children }) => children,
};
const i18n = { useI18n: () => ({ t: key => copy[key] ?? key }) };
const link = ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children);
function view(file) {
  return registrationViewHarness(`../../components/panel/overview/${file}`, {
    'next/link': { default: link }, 'lucide-react': icons,
    '@radix-ui/react-dialog': radix, '@/i18n/LanguageProvider': i18n,
    '@/lib/personal-wallet.mjs': { PERSONAL_WALLET_ASSET: 'USDT' },
  });
}

function button(tree, label) {
  return find(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(label));
}

test('the first-recharge popup advances through the Pen welcome and routes to the validated on-ramp', () => {
  let closed = 0;
  const harness = view('FirstRechargeDialog.jsx');
  const props = { open: true, initialStep: 'welcome', onOpenChange(value) { if (value === false) closed += 1; } };
  assert.match(renderToStaticMarkup(harness.render(props)), /Todo empieza con.*tu primera recarga/s);
  button(harness.render(props), 'Hacer mi primera recarga').props.onClick();
  const methods = harness.render(props);
  const html = renderToStaticMarkup(methods);
  assert.match(html, /Recargar fondos/);
  assert.equal(find(methods, node => node?.props?.href === '/dashboard/packages'), undefined);
  assert.equal(find(methods, node => node?.props?.href === '/dashboard/payments#wallet-steps').props.href, '/dashboard/payments#wallet-steps');
  const cryptoMethod = find(methods, node => node?.type?.name === 'RechargeMethod' && node?.props?.href === '/dashboard/payments#personal-wallet');
  cryptoMethod.props.onNavigate();
  assert.equal(closed, 1);
  harness.unmount();
});

test('the popup never opens a provider before backend route and quote validation', () => {
  const harness = view('FirstRechargeDialog.jsx');
  const tree = harness.render({ open: true, initialStep: 'methods', onOpenChange() {} });
  assert.match(renderToStaticMarkup(tree), /dashboard\/payments#personal-wallet/);
  assert.equal(find(tree, node => node?.type?.name === 'RechargeMethod' && typeof node?.props?.onClick === 'function'), undefined);
  harness.unmount();
});

test('the empty-balance reminder can continue to methods and every dismiss action closes the controlled popup', () => {
  let closed = 0;
  const harness = view('FirstRechargeDialog.jsx');
  const props = { open: true, initialStep: 'reminder', onOpenChange(value) { if (value === false) closed += 1; } };
  let tree = harness.render(props);
  assert.match(renderToStaticMarkup(tree), /0\.00.*USDT.*¿Tu primera recarga/s);
  button(tree, 'Seguir explorando').props.onClick();
  assert.equal(closed, 1);
  button(tree, 'Recargar mi wallet').props.onClick();
  tree = harness.render(props);
  assert.match(renderToStaticMarkup(tree), /Recarga a tu manera/);
  button(tree, 'Lo haré después').props.onClick();
  assert.equal(closed, 2);
  harness.unmount();
});

test('wallet actions only offer top-up guidance and never expose a withdrawal destination', () => {
  const opened = [];
  const harness = view('EarningsCard.jsx');
  const props = { onRecharge: step => opened.push(step) };
  const tree = harness.render(props);
  button(tree, 'Recargar saldo').props.onClick();
  button(tree, 'Cómo funciona').props.onClick();
  assert.deepEqual(opened, ['methods', 'welcome']);
  assert.doesNotMatch(renderToStaticMarkup(tree), /Retirar|Retiro|withdraw/i);
  assert.equal(find(tree, node => typeof node?.props?.href === 'string'), undefined);
  harness.unmount();
});

test('a confirmed empty wallet opens the welcome popup once per tab and keeps manual reopening available', t => {
  const originalStorage = globalThis.sessionStorage;
  const values = new Map();
  globalThis.sessionStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
  t.after(() => { if (originalStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = originalStorage; });
  const Earnings = props => React.createElement('wallet-card', props);
  const Popup = props => React.createElement('recharge-popup', props);
  const harness = registrationViewHarness('../../components/panel/overview/OverviewDashboard.jsx', {
    'next/link': { default: link }, 'next/dynamic': { default: () => Popup }, 'lucide-react': icons,
    '@/app/_components/ThemeToggle': { default: () => null },
    '@/lib/member-read.mjs': {
      validMemberSummary: () => true, validMemberTree: () => true,
      readMemberParts(_parts, { onPart }) {
        onPart('summary', { data: { wallet_balance_usd: '0', active_packages: 0 }, error: null });
        onPart('network', { data: { positioned: false, tree: [] }, error: null });
      },
    },
    '@/lib/payment-display.mjs': { formatPaymentMoney: value => `$${value}` },
    './EarningsCard': { default: Earnings },
    './OverviewDiscoveryCard': { default: () => null }, './PositionSnapshotCard': { default: () => null },
    '@/i18n/LanguageProvider': i18n,
    '@/i18n/LanguageSwitcher': { default: () => null },
  });
  harness.render();
  harness.render();
  let tree = harness.render();
  let popup = find(tree, node => node?.type === Popup);
  assert.equal(popup.props.open, true);
  assert.equal(popup.props.initialStep, 'welcome');
  assert.equal(values.get('mindbliss:first-recharge-popup:v1'), 'seen');
  popup.props.onOpenChange(false);
  tree = harness.render();
  popup = find(tree, node => node?.type === Popup);
  assert.equal(popup.props.open, false);
  find(tree, node => node?.type === Earnings).props.onRecharge('methods');
  tree = harness.render();
  popup = find(tree, node => node?.type === Popup);
  assert.equal(popup.props.open, true);
  assert.equal(popup.props.initialStep, 'methods');
  harness.unmount();
});
