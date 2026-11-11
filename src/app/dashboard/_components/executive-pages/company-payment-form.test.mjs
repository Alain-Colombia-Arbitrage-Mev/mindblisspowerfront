import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as values from '../../../../lib/personal-company-payment-values.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';

const require = createRequire(import.meta.url);
let locale = 'es';
const source = readFileSync(new URL('CompanyPaymentForm.jsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', code)(id => {
  if (id === 'react') return { ...React, useId: () => 'payment-test' };
  if (id === 'react/jsx-runtime') return require(id);
  if (id === 'lucide-react') return new Proxy({}, { get: () => () => null });
  if (id === '@/i18n/LanguageProvider') return { useI18n: () => ({ locale, t: (key, variables) => translateMessage(locale, key, variables) }) };
  if (id === '@/lib/personal-company-payment-values.mjs') return values;
  if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, name) => name }) };
  assert.fail(`Presentation unexpectedly imports ${id}`);
}, module, module.exports);
const { CompanyPaymentForm, CompanyPaymentReview, CompanyPaymentNetworks } = module.exports;
const find = (node, predicate) => predicate(node) ? node : React.Children.toArray(node?.props?.children).map(child => find(child, predicate)).find(Boolean);
const text = node => typeof node === 'string' ? node : React.Children.toArray(node?.props?.children).map(text).join('');
const button = (tree, label) => find(tree, node => node?.type === 'button' && text(node) === label);
const properties = patch => ({ balanceAtomic: '100000000', amount: '25.123456', connected: true,
  onAmountChange() {}, onMax() {}, onReview() {}, onRefresh() {}, onConnect() {}, ...patch });
const payment = patch => ({ paymentId: 'd8a4c010-cc33-44da-a297-8b3c6440f491', walletAddress: `0x${'1'.repeat(40)}`,
  ...values.PERSONAL_COMPANY_PAYMENT, status: 'prepared', abandonedAt: null, amountAtomic: '25123456', expiresAt: new Date(Date.now() + 60000).toISOString(), ...patch });
function assertMerchantPresentation(html) {
  assert.ok(!html.toLowerCase().includes(values.PERSONAL_COMPANY_PAYMENT.recipientAddress.slice(2)),
    'The merchant address must not appear in rendered text, hidden elements, titles or ARIA/data attributes');
  assert.match(html, />Mindbliss</);
  assert.ok(html.includes(translateMessage(locale, 'companyPayment.recipientLabel')));
}

test('form is presentation only and invokes review, MAX and refresh exclusively through user controls', () => {
  let reviewed = 0, maximum = 0, refreshed = 0;
  const tree = CompanyPaymentForm(properties({ onReview: () => reviewed++, onMax: () => maximum++, onRefresh: () => refreshed++ }));
  assert.equal(reviewed + maximum + refreshed, 0);
  tree.props.onSubmit({ preventDefault() {} });
  button(tree, translateMessage('es', 'companyPayment.max')).props.onClick();
  find(tree, node => node?.type === 'button' && node.props['aria-label'] === translateMessage('es', 'companyPayment.refreshBalance')).props.onClick();
  assert.deepEqual([reviewed, maximum, refreshed], [1, 1, 1]);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /25123456|25\.123456/);
  assertMerchantPresentation(html);
  assert.match(html, /Ethereum/);
  assert.doesNotMatch(html, /\bPOL\b/);
  assert.doesNotMatch(source, /useEffect|useReown|fetch\(|BrowserProvider|eth_sendTransaction|createPersonalCompanyPaymentTransfer/);
});

test('exact amount validation prevents zero, rounding, excessive decimals and sending more than the balance', () => {
  for (const amount of ['', '0', '0.000000', '0.0000001', '100.000001', '1e2', ' 20', 'NaN']) {
    let reviewed = 0;
    const tree = CompanyPaymentForm(properties({ amount, onReview: () => reviewed++ }));
    assert.equal(button(tree, translateMessage('es', 'companyPayment.review')).props.disabled, true, amount);
    tree.props.onSubmit({ preventDefault() {} });
    assert.equal(reviewed, 0);
  }
  const smallest = CompanyPaymentForm(properties({ balanceAtomic: '1', amount: '0.000001' }));
  assert.equal(button(smallest, translateMessage('es', 'companyPayment.review')).props.disabled, false);
  const large = CompanyPaymentForm(properties({ balanceAtomic: '9007199254740993123456', amount: '9007199254740993.123456' }));
  assert.equal(button(large, translateMessage('es', 'companyPayment.review')).props.disabled, false);
});

test('disconnected wallets offer connection of the existing wallet and busy/loading states block submission', () => {
  let connected = 0, reviewed = 0;
  const disconnected = CompanyPaymentForm(properties({ connected: false, onConnect: () => connected++, onReview: () => reviewed++ }));
  button(disconnected, translateMessage('es', 'companyPayment.connect')).props.onClick();
  disconnected.props.onSubmit({ preventDefault() {} });
  assert.equal(connected, 1);
  assert.equal(reviewed, 0);
  assert.equal(find(disconnected, node => node?.type === 'input' && node.props.id.endsWith('-amount')).props.disabled, true);
  for (const patch of [{ busy: true }, { loading: true }, { balanceAtomic: null }]) {
    const tree = CompanyPaymentForm(properties({ ...patch, onReview: () => reviewed++ }));
    tree.props.onSubmit({ preventDefault() {} });
    assert.equal(reviewed, 0);
    assert.equal(find(tree, node => node?.type === 'button' && node.props.type === 'submit').props.disabled, true);
  }
});

test('a verified owner can fill MAX on the selected network before connecting, without reviewing or sending', () => {
  let maximum = 0, reviewed = 0;
  const tree = CompanyPaymentForm(properties({ connected: false, canRefresh: true, chainId: 137,
    balanceAtomic: '28433366', amount: '28.433366', onMax: () => maximum++, onReview: () => reviewed++ }));
  assert.equal(button(tree, translateMessage('es', 'companyPayment.max')).props.disabled, false);
  button(tree, translateMessage('es', 'companyPayment.max')).props.onClick();
  tree.props.onSubmit({ preventDefault() {} });
  assert.equal(maximum, 1); assert.equal(reviewed, 0);
  assert.ok(button(tree, translateMessage('es', 'companyPayment.reconnect')));
});

test('the amount field labels and links its validation error, normalizing decimal separators without converting to numbers', () => {
  const changed = [];
  const tree = CompanyPaymentForm(properties({ amount: '100.000001', onAmountChange: value => changed.push(value) }));
  const input = find(tree, node => node?.type === 'input' && node.props.id.endsWith('-amount'));
  assert.equal(find(tree, node => node?.type === 'label' && node.props.htmlFor === input.props.id)?.props.children, translateMessage('es', 'companyPayment.amountLabel'));
  assert.equal(input.props['aria-invalid'], true);
  assert.ok(find(tree, node => node?.props?.id === input.props['aria-describedby'] && node.props.role === 'alert'));
  input.props.onChange({ target: { value: '5,123456' } });
  input.props.onChange({ target: { value: '5٫123456' } });
  assert.deepEqual(changed, ['5.123456', '5.123456']);
});

test('review shows the exact transfer and only opens wallet confirmation after a user click', () => {
  let confirmed = 0, backed = 0;
  const tree = CompanyPaymentReview({ payment: payment(), onConfirm: () => confirmed++, onBack: () => backed++ });
  assert.equal(confirmed, 0);
  const html = renderToStaticMarkup(tree);
  assert.ok(html.includes('25.123456 USDT'));
  assert.ok(html.includes(`0x${'1'.repeat(40)}`));
  assertMerchantPresentation(html);
  assert.ok(html.includes(translateMessage('es', 'companyPayment.gasCopy')));
  assert.ok(html.includes(translateMessage('es', 'companyPayment.allocationPending')));
  button(tree, translateMessage('es', 'companyPayment.confirmInWallet')).props.onClick();
  button(tree, translateMessage('es', 'companyPayment.back')).props.onClick();
  assert.deepEqual([confirmed, backed], [1, 1]);
});

test('invalid, expired or wrong-destination review data can never invoke the confirmation callback', () => {
  for (const patch of [{ recipientAddress: `0x${'2'.repeat(40)}` }, { tokenAddress: `0x${'2'.repeat(40)}` },
    { recipientAddress: [] }, { walletAddress: [] }, { chainId: 137 }, { tokenDecimals: 18 }, { status: 'confirmed' },
    { amountAtomic: '0' }, { amountAtomic: 1 }, { expiresAt: new Date(Date.now() - 1).toISOString() }, { paymentId: 'not-a-uuid' },
    { abandonedAt: new Date().toISOString() }, { abandonedAt: false }, { abandonedAt: '' }]) {
    let confirmed = 0;
    const tree = CompanyPaymentReview({ payment: payment(patch), onConfirm: () => confirmed++, onBack() {} });
    const confirm = button(tree, translateMessage('es', 'companyPayment.confirmInWallet'));
    assert.equal(confirm.props.disabled, true);
    confirm.props.onClick();
    assert.equal(confirmed, 0);
  }
});

test('all supported locales identify Mindbliss without its address while preserving the sender, amount and selected network', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    for (const chainId of [1, 137]) {
      const record = payment(values.personalCompanyPaymentPolicy(chainId));
      const form = renderToStaticMarkup(CompanyPaymentForm(properties({ chainId })));
      const review = renderToStaticMarkup(CompanyPaymentReview({ payment: record, onConfirm() {}, onBack() {} }));
      assert.doesNotMatch(form + review, /companyPayment\./);
      assertMerchantPresentation(form); assertMerchantPresentation(review);
      assert.ok(form.includes('25.123456')); assert.ok(review.includes('25.123456 USDT'));
      assert.ok(review.includes(record.walletAddress));
      const network = translateMessage(locale, chainId === 137 ? 'companyPayment.legacyNetwork' : 'companyPayment.network');
      assert.ok(form.includes(network)); assert.ok(review.includes(network));
    }
  }
  locale = 'es';
});

test('network choices expose independent balances and update only the selected network through explicit controls', () => {
  const changes=[];
  const choices=CompanyPaymentNetworks({chainId:137,balances:[{chainId:1,balanceAtomic:'10000000'},{chainId:137,balanceAtomic:'7000000'}],onChange:value=>changes.push(value)});
  const radios=React.Children.toArray(React.Children.toArray(choices.props.children)[1].props.children);
  assert.equal(radios.length,2); assert.equal(radios[0].props['aria-checked'],false); assert.equal(radios[1].props['aria-checked'],true);
  assert.ok(renderToStaticMarkup(choices).includes('10 USDT')); assert.ok(renderToStaticMarkup(choices).includes('7 USDT'));
  assert.ok(!renderToStaticMarkup(choices).includes('17 USDT')); assert.deepEqual(changes,[]);
  radios[0].props.onClick(); radios[1].props.onClick(); assert.deepEqual(changes,[1]);
  let prevented = 0, focused = '';
  radios[1].props.onKeyDown({ key: 'ArrowLeft', preventDefault() { prevented++; }, currentTarget: { parentElement: { querySelector: selector => ({ focus() { focused = selector; } }) } } });
  assert.equal(prevented, 1); assert.deepEqual(changes, [1, 1]); assert.equal(focused, '[data-chain-id="1"]');
  const unavailable=renderToStaticMarkup(CompanyPaymentNetworks({chainId:1,balances:[{chainId:1,balanceAtomic:'10000000',error:'unavailable'},{chainId:137,balanceAtomic:'7000000'}]}));
  assert.match(unavailable,/— USDT/); assert.match(unavailable,/7 USDT/); assert.doesNotMatch(unavailable,/10 USDT/);
});

test('Polygon review and form use the fixed Polygon token, POL gas and only the selected network balance', () => {
  for(locale of ['es','en','ar','zh']) {
    let confirmed=0; const record=payment(values.personalCompanyPaymentPolicy(137));
    const review=CompanyPaymentReview({payment:record,onConfirm:()=>confirmed++,onBack(){}});
    const html=renderToStaticMarkup(review);
    assert.ok(html.includes(translateMessage(locale,'companyPayment.legacyNetwork')));
    assert.ok(html.includes(translateMessage(locale,'companyPayment.polygonGasCopy')));
    assert.ok(!html.includes(translateMessage(locale,'companyPayment.gasCopy')));
    assert.equal(button(review,translateMessage(locale,'companyPayment.confirmInWallet')).props.disabled,false);
    button(review,translateMessage(locale,'companyPayment.confirmInWallet')).props.onClick(); assert.equal(confirmed,1);
    const form=CompanyPaymentForm(properties({chainId:137,balanceAtomic:'7000000',amount:'7.000001'}));
    assert.equal(button(form,translateMessage(locale,'companyPayment.review')).props.disabled,true);
  }
  locale='es';
});

test('connection restoration preserves MAX and displays a precise gas notice for the selected chain before SDK auth', () => {
  for (const chainId of [1,137]) {
    const tree=CompanyPaymentForm(properties({connected:false,canRefresh:true,chainId,nativeBalanceAtomic:'0'}));
    assert.equal(button(tree,translateMessage('es','companyPayment.max')).props.disabled,false);
    assert.ok(button(tree,translateMessage('es','companyPayment.reconnect')));
    const html=renderToStaticMarkup(tree);
    assert.ok(html.includes(translateMessage('es',chainId===137?'companyPayment.polygonZeroGas':'companyPayment.zeroGas')));
    const waiting=CompanyPaymentForm(properties({connected:false,canRefresh:true,chainId,restoring:true}));
    assert.equal(button(waiting,translateMessage('es','companyPayment.restoring')).props.disabled,true);
    assert.ok(renderToStaticMarkup(waiting).includes(translateMessage('es','companyPayment.restoringCopy')));
    assert.equal(button(waiting,translateMessage('es','companyPayment.max')).props.disabled,false);
  }
});

test('connected but unlinked wallets show Verify wallet in every locale, and verification never submits the payment form', () => {
  for(locale of ['es','en','ar','zh']) {
    let verifies=0, reviews=0;
    const tree=CompanyPaymentForm(properties({connected:false,canRefresh:false,needsVerification:true,onConnect:()=>verifies++,onReview:()=>reviews++}));
    const verify=button(tree,translateMessage(locale,'companyPayment.verifyWallet'));
    assert.ok(verify); assert.equal(verify.props.type,'button'); assert.equal(verify.props.disabled,false);
    assert.equal(button(tree,translateMessage(locale,'companyPayment.connect')),undefined);
    assert.ok(renderToStaticMarkup(tree).includes(translateMessage(locale,'companyPayment.verifyWalletCopy')));
    verify.props.onClick(); tree.props.onSubmit({preventDefault(){}}); assert.equal(verifies,1); assert.equal(reviews,0);
    const waiting=CompanyPaymentForm(properties({connected:false,canRefresh:false,needsVerification:true,busy:true}));
    assert.equal(button(waiting,translateMessage(locale,'funding.verifyingWallet')).props.disabled,true);
  }
  locale='es';
});
