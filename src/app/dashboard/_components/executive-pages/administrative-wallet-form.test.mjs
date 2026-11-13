import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../../../../i18n/translate.mjs';
import { validFundingAmount } from '../../../../lib/wallet-funding-contract.mjs';

const require = createRequire(import.meta.url), icons = new Proxy({}, { get: () => () => null });
const address = `0x${'1'.repeat(40)}`, reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491';
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
const find = (node, predicate) => (typeof predicate === 'string' ? node?.type?.name === predicate : predicate(node)) ? node
  : React.Children.toArray(node?.props?.children).map(child => find(child, predicate)).find(Boolean);
const nodes = node => [node, ...React.Children.toArray(node?.props?.children).flatMap(nodes)];
function fixture(t, onContinue = async () => {}) {
  const state = [], refs = [], effects = [], queue = [], calls = [], submitted = [];
  let stateIndex = 0, refIndex = 0, effectIndex = 0, ids = 0;
  const hooks = { ...React, useState(initial) { const index = stateIndex++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
    return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }]; },
    useRef(initial) { return refs[refIndex++] ||= { current: initial }; }, useId: () => `admin-form-${ids++}`,
    useEffect(effect, deps) { const index = effectIndex++, previous = effects[index]; if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) queue.push(() => { previous?.cleanup?.(); effects[index] = { deps, effect, cleanup: effect() }; }); } };
  const pass = ({ children }) => children;
  const mocks = { react: hooks, 'lucide-react': icons,
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', t: (key, values) => translateMessage('es', key, values) }) },
    '@/components/ui/popover': { Popover: pass, PopoverContent: pass, PopoverTrigger: pass },
    '@/lib/meld-onramp-client.mjs': { ONRAMP_COUNTRIES: [['US'], ['MX'], ['CO'], ['ES']] },
    '@/lib/wallet-funding-client.mjs': { fundingRequestId: () => reference,
      readAdministrativeSandboxOptions: (country, provider, context) => new Promise((resolve, reject) => calls.push({ country, provider, ...context, resolve, reject })) },
    '@/lib/wallet-funding-contract.mjs': { validFundingAmount }, './wallet-funding.module.css': { default: new Proxy({}, { get: (_target, key) => key }) },
  };
  const code = ts.transpileModule(readFileSync(new URL('./WalletFundingForm.jsx', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => { if (id === 'react/jsx-runtime') return require(id); assert.ok(Object.hasOwn(mocks, id), `Unexpected administrative dependency: ${id}`); return mocks[id]; }, module, module.exports);
  const render = (props = {}) => { stateIndex = 0; refIndex = 0; effectIndex = 0; ids = 0;
    const tree = module.exports.AdministrativeSandboxFundingForm({ destinationAddress: address, onContinue: async input => { submitted.push(input); return onContinue(input); }, ...props });
    while (queue.length) queue.shift()(); return tree; };
  const stop = () => effects.forEach(effect => effect.cleanup?.()); t.after(stop);
  const choose = country => { find(render(), 'FundingCountryField').props.onChange(country); return render(); };
  const replayEffects = () => { effects.forEach(effect => effect.cleanup?.()); effects.forEach(effect => { effect.cleanup = effect.effect(); }); };
  return { render, choose, calls, submitted, exports: module.exports, stop, replayEffects };
}
const card = (currency = 'USD', minimum = 50, maximum = 25000) => ({ method: 'CREDIT_DEBIT_CARD', currencyCode: currency, minimumAmount: minimum, maximumAmount: maximum });
async function resolveRoutes(h, methodFactory = () => [card()]) {
  for (const call of h.calls.filter(call => !call.signal.aborted)) call.resolve({ country: call.country, sourceCurrencyCode: call.sourceCurrencyCode, serviceProvider: call.provider,
    routes: [{ serviceProvider: call.provider, paymentMethods: methodFactory(call) }] });
  await settle(); h.render(); return h.render();
}

test('administrative residence starts empty and never discovers, opens a checkout or creates a personal wallet automatically', t => {
  const h = fixture(t); h.render(); const tree = h.render();
  assert.equal(find(tree, 'FundingCountryField').props.value, ''); assert.equal(h.calls.length, 0);
  assert.equal(find(tree, 'FundingSubmit').props.disabled, true); tree.props.onSubmit({ preventDefault() {} });
  assert.equal(h.submitted.length, 0);
  for (const country of ['', 'US', 'CO', 'ES']) assert.deepEqual(h.exports.fundingCurrencyChoices(country), ['USD']);
  assert.deepEqual(h.exports.fundingCurrencyChoices('MX'), ['USD', 'MXN']);
  assert.equal(h.exports.eligiblePaymentMethods([{ paymentMethods: [card()] }], 30).length, 0);
  assert.deepEqual(h.exports.eligiblePaymentMethods([{ paymentMethods: [card()] }], 50), ['CREDIT_DEBIT_CARD']);
  assert.deepEqual(h.exports.eligiblePaymentMethods([{ paymentMethods: [card()] }], 25000), ['CREDIT_DEBIT_CARD']);
  assert.deepEqual(h.exports.eligiblePaymentMethods([{ paymentMethods: [card()] }], 25000.01), []);
});

test('administrative USD presets and accessible slider use 50 to 25000 and retain precise manual input', t => {
  const h = fixture(t), amountNode = find(h.render(), 'FundingAmountField'), changes = [];
  const tree = amountNode.type({ ...amountNode.props, onChange: value => changes.push(value) });
  const all = nodes(tree), slider = all.find(node => node?.type === 'input' && node.props.type === 'range');
  assert.equal(slider.props.min, 50); assert.equal(slider.props.max, 25000); assert.equal(slider.props.step, '0.01');
  assert.equal(all.filter(node => node?.type === 'button').length, 8);
  assert.equal(all.filter(node => node?.type === 'bdi').length, 10);
  for (const key of ['End', 'Home']) slider.props.onKeyDown({ key, preventDefault() {} });
  const input = all.find(node => node?.type === 'input' && node.props.type === 'number'); input.props.onChange({ target: { value: '125.25' } });
  assert.deepEqual(changes, ['25000', '50', '125.25']);
  assert.match(renderToStaticMarkup(tree), /quickAmounts|amountSliderGroup/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /15,?000|30,00/);
});

test('MXN uses exact provider bounds and only canonical cards, Apple Pay and Google Pay without a USD conversion floor', async t => {
  const h = fixture(t); h.choose('MX');
  find(h.render(), 'FundingCurrencyField').props.onChange('MXN'); h.render();
  assert.equal(h.calls.length, 4); assert.ok(h.calls.slice(0, 2).every(call => call.signal.aborted));
  let tree = await resolveRoutes(h, call => call.provider === 'TRANSAK' ? [card('MXN', 200, 20000), { method: 'SPEI', currencyCode: 'MXN', minimumAmount: 1, maximumAmount: 999999 },
    { method: 'APPLE_PAY', currencyCode: 'MXN', minimumAmount: 300, maximumAmount: 10000 }, { method: 'GOOGLE_PAY', currencyCode: 'MXN', minimumAmount: 300, maximumAmount: 10000 }, card('USD', 50, 25000)] : []);
  const field = find(tree, 'FundingMethodField'); assert.deepEqual(field.props.methods, ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'GOOGLE_PAY']);
  assert.equal(find(tree, 'FundingAmountField').props.amount, ''); assert.equal(find(tree, 'FundingAmountField').props.minimumAmount, 200);
  assert.equal(find(tree, 'FundingSubmit').props.disabled, true); assert.equal(h.submitted.length, 0);
  assert.ok(field.props.onUseMinimum); field.props.onUseMinimum(); tree = h.render();
  assert.equal(find(tree, 'FundingAmountField').props.amount, '200'); assert.equal(find(tree, 'FundingSubmit').props.disabled, false);
  tree.props.onSubmit({ preventDefault() {} }); await settle();
  assert.deepEqual(h.submitted, [{ requestId: reference, amount: 200, countryCode: 'MX', sourceCurrencyCode: 'MXN', serviceProvider: 'TRANSAK', paymentMethodType: 'CREDIT_DEBIT_CARD' }]);
});

test('changing amount preserves explicit provider and method and offers that selected method minimum without more discovery', async t => {
  const h = fixture(t); h.choose('MX'); find(h.render(), 'FundingCurrencyField').props.onChange('MXN'); h.render();
  let tree = await resolveRoutes(h, call => [card('MXN', call.provider === 'BANXA' ? 500 : 100, 20000), { method: 'APPLE_PAY', currencyCode: 'MXN', minimumAmount: 700, maximumAmount: 10000 }]);
  find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')).props.onChange({ target: { value: 'BANXA' } }); h.render();
  find(h.render(), 'FundingMethodField').props.onChange('CREDIT_DEBIT_CARD'); h.render();
  find(h.render(), 'FundingAmountField').props.onChange('1000'); tree = h.render();
  assert.equal(find(tree, 'FundingSubmit').props.disabled, false);
  find(tree, 'FundingAmountField').props.onChange('200'); tree = h.render();
  assert.equal(find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')).props.value, 'BANXA');
  assert.equal(find(tree, 'FundingMethodField').props.value, 'CREDIT_DEBIT_CARD'); assert.equal(find(tree, 'FundingMethodField').props.minimumUsd, 500);
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, ['CREDIT_DEBIT_CARD'], 'Banxa MXN cannot inherit Transak mobile-wallet rails');
  assert.equal(find(tree, 'FundingSubmit').props.disabled, true); assert.equal(h.calls.length, 4); assert.equal(h.submitted.length, 0);
  find(tree, 'FundingMethodField').props.onUseMinimum(); tree = h.render();
  assert.equal(find(tree, 'FundingAmountField').props.amount, '500'); assert.equal(find(tree, 'FundingSubmit').props.disabled, false);
  find(tree, node => node?.type === 'select' && node.props.id.endsWith('-provider')).props.onChange({ target: { value: 'TRANSAK' } }); h.render();
  find(h.render(), 'FundingMethodField').props.onChange('APPLE_PAY'); h.render();
  find(h.render(), 'FundingAmountField').props.onChange('200'); tree = h.render();
  assert.equal(find(tree, 'FundingMethodField').props.value, 'APPLE_PAY'); assert.equal(find(tree, 'FundingMethodField').props.minimumUsd, 700);
  assert.equal(find(tree, 'FundingSubmit').props.disabled, true);
});

test('country or currency changes discard late discovery, reset local amount units and reject stale submit handlers immediately', async t => {
  const h = fixture(t); h.choose('MX'); let tree = await resolveRoutes(h);
  const oldSubmit = tree.props.onSubmit;
  find(tree, 'FundingAmountField').props.onChange('100'); oldSubmit({ preventDefault() {} }); await settle(); assert.equal(h.submitted.length, 0);
  tree = h.render(); find(tree, 'FundingCurrencyField').props.onChange('MXN'); h.render();
  const local = h.calls.slice(-2);
  find(h.render(), 'FundingCountryField').props.onChange('CO'); h.render();
  assert.ok(local.every(call => call.signal.aborted));
  for (const call of local) call.resolve({ country: 'MX', sourceCurrencyCode: 'MXN', serviceProvider: call.provider, routes: [{ paymentMethods: [card('MXN', 200, 20000)] }] });
  await settle(); tree = h.render(); assert.equal(find(tree, 'FundingCurrencyField').props.value, 'USD'); assert.equal(find(tree, 'FundingAmountField').props.amount, '50');
  assert.deepEqual(find(tree, 'FundingMethodField').props.methods, []); assert.equal(find(tree, 'FundingSubmit').props.disabled, true);
});

test('manual administrative submit coalesces duplicate handlers and never retries or switches provider after a failure', async t => {
  let reject; const h = fixture(t, () => new Promise((_resolve, failure) => { reject = failure; })); h.choose('US');
  const tree = await resolveRoutes(h); tree.props.onSubmit({ preventDefault() {} }); tree.props.onSubmit({ preventDefault() {} });
  assert.equal(h.submitted.length, 1);
  find(tree, 'FundingCountryField').props.onChange('MX'); assert.equal(find(h.render(), 'FundingCountryField').props.value, 'US');
  reject(Error('wallet_funding_provider_authentication_failed')); await settle();
  assert.equal(h.submitted.length, 1); assert.equal(h.calls.length, 2); assert.equal(find(h.render(), 'FundingMethodField').props.value, 'CREDIT_DEBIT_CARD');
});

test('residence instructions are contained in the info popover and local-currency copy exists in all languages', t => {
  const h = fixture(t), field = find(h.render(), 'FundingCountryField'), tree = field.type(field.props);
  const popover = find(tree, node => node?.props?.className === 'residencyPopover'); assert.ok(popover);
  const text = renderToStaticMarkup(popover); assert.match(text, /SSN/); assert.match(text, /residente/);
  assert.equal(nodes(tree).filter(node => node?.type === 'p').length, 2);
  for (const locale of ['es', 'en', 'ar', 'zh']) assert.notEqual(translateMessage(locale, 'funding.administrativeMxnLimits'), 'funding.administrativeMxnLimits');
});

test('a captured valid administrative submit and retry cannot start work after the form unmounts', async t => {
  const h = fixture(t); h.choose('US'); const tree = await resolveRoutes(h);
  assert.equal(find(tree, 'FundingSubmit').props.disabled, false);
  const submit = tree.props.onSubmit, retry = find(tree, 'FundingMethodField').props.onRetry;
  h.stop(); submit({ preventDefault() {} }); retry(); await settle();
  assert.equal(h.submitted.length, 0); assert.equal(h.calls.length, 2);
  assert.ok(h.calls.every(call => call.signal.aborted));
});

test('React cleanup and setup replay preserves a live manual submit without opening anything automatically', async t => {
  const h = fixture(t); h.choose('US'); const tree = await resolveRoutes(h);
  const submit = tree.props.onSubmit;
  h.replayEffects(); assert.equal(h.submitted.length, 0);
  submit({ preventDefault() {} }); await settle();
  assert.equal(h.submitted.length, 1); assert.equal(h.submitted[0].countryCode, 'US');
  assert.equal(h.submitted[0].serviceProvider, 'TRANSAK');
});
