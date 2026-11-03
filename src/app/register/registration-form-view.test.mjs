import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as model from './registration-model.mjs';
import * as contacts from './contact-phone-model.mjs';
import * as emailOtp from '../../lib/email-otp-client.mjs';
import * as referral from '../../lib/referral-attribution.js';
import * as access from '../login/better-auth-login.mjs';
import { registrationViewHarness, findRegistrationNode as find, registrationFieldStub, registrationButtonStub } from './registration-view-test-harness.mjs';

const contactView = ({ id, label, value }) => React.createElement('div', null, label, React.createElement('input', { id, value: value.national, readOnly: true }));
const valid = { fullName: 'Synthetic Member', email: 'member@example.test', acceptsPrivacy: true };
function view(cooldown = { active: false, label: '', start() {} }, attribution = { bindReferralCodeToEmail() {} }, onCooldown = () => {}, sync = () => Promise.resolve({ ok: true })) {
  return registrationViewHarness('./BetterAuthRegisterForm.jsx', {
    '@/lib/referral-sync.mjs': { beginVerifiedReferralSync: sync },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    'lucide-react': { ArrowLeft: () => null, CheckCircle2: () => null, Mail: () => null, UserPlus: () => null },
    '../_components/AuthShell': { default: ({ children }) => React.createElement('main', null, children) },
    '@/lib/useResendCooldown': { useResendCooldown: (seconds, scope) => { onCooldown(seconds, scope); return cooldown; }, suggestEmailFix: () => '' },
    '@/lib/referral-attribution': attribution,
    '@/lib/email-otp-client.mjs': emailOtp,
    '../login/better-auth-login.mjs': access,
    './RegistrationFields': { RegistrationField: registrationFieldStub, RegistrationButton: registrationButtonStub },
    './ContactPhoneField': { default: contactView },
    './contact-phone-model.mjs': contacts,
    './registration-model.mjs': model,
  });
}
const props = { initialSearch: 'ref=MP-REFERRAL&side=R' };
function enterValid(harness, values = valid) {
  let tree = harness.render(props);
  for (const [id, value] of Object.entries(values)) {
    const field = find(tree, node => node?.props?.id === id);
    field.props.onChange(id.startsWith('contact') ? value : { target: { value, checked: value } });
    tree = harness.render(props);
  }
  return tree;
}
const submit = tree => find(tree, node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
const signupAck = () => Response.json({ ok: true, mode: 'better-auth', email: valid.email, userConfirmed: false, requiresConfirmation: true, resendAfter: 300 });
const confirmationAck = () => Response.json({ ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: false, sessionEstablished: true });
const canonicalAccess = (ready = true, email = valid.email) => Response.json({ authenticated: ready, mode: 'better-auth', email });
function browser(t) {
  const previous = globalThis.window, destinations = [];
  globalThis.window = { location: { assign: href => destinations.push(href) } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  return destinations;
}

test('registration remains email-only with the existing two-step design and optional contacts, never a phone challenge', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('render must not send messages or create an account'));
  const harness = view();
  const html = renderToStaticMarkup(harness.render());
  assert.match(html, /Paso 1 de 2/);
  assert.match(html, /Crear cuenta y verificar correo/);
  assert.match(html, /Contacto opcional/);
  assert.match(html, /sin validar el teléfono ni enviar mensajes/);
  assert.doesNotMatch(html, /phoneConsent|Validar teléfono|código SMS|phoneNumberVerified/);
  assert.doesNotMatch(html, /checked=""/);
  assert.equal(find(harness.render(), node => node?.props?.id === 'password'), undefined);
  assert.equal(find(harness.render(), node => node?.props?.id === 'confirmPassword'), undefined);
  assert.equal(Object.hasOwn(harness.state[1], 'password'), false);
  assert.equal(Object.hasOwn(harness.state[1], 'confirmPassword'), false);
});

test('registration guidance explains the manual email-first steps and optional password without promising delivery or importing recovery quotas', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('guidance must not create accounts or send messages'));
  const harness = view(), tree = harness.render(), html = renderToStaticMarkup(tree);
  const email = find(tree, node => node?.props?.id === 'email');
  assert.match(email.props.helper, /Completa tus datos y solicita el código por correo/);
  assert.match(email.props.helper, /Verifica tu correo con ese código; no necesitas contraseña para este paso/);
  assert.match(email.props.helper, /Si ya tienes cuenta, usa tu correo de siempre/);
  assert.match(html, /No cambies tu correo ni vuelvas a registrarte para crear o cambiar tu contraseña/);
  assert.doesNotMatch(html, /recibirás|código enviado|5 solicitudes|10 (?:intentos|validaciones)|24 horas|intentos restantes/i);
  harness.unmount();
});

test('registration top navigation preserves the current local sponsor, branch and edited recipient in both directions without an API or global-storage read', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('navigation must not register or send an OTP'));
  const harness = view(), context = { initialSearch: 'ref=Sponsor%26A%23%3F%2B&side=R' };
  let tree = harness.render(context);
  find(tree, node => node?.props?.id === 'email').props.onChange({ target: { value: ' MEMBER@EXAMPLE.TEST ' } });
  tree = harness.render(context);
  for (const [prop, path] of [['loginHref', '/login'], ['registrationHref', '/register']]) {
    const url = new URL(tree.props[prop], 'https://portal.example.test');
    assert.equal(url.pathname, path); assert.equal(url.origin, 'https://portal.example.test');
    assert.equal(url.searchParams.get('ref'), 'Sponsor&A#?+'); assert.equal(url.searchParams.get('side'), 'R');
    assert.equal(url.searchParams.get('email'), valid.email);
    assert.equal(url.searchParams.has('resume'), false);
  }
  assert.equal(find(tree, node => node?.props?.id === 'acceptsPrivacy').props.checked, false);
  assert.equal(find(tree, node => node?.props?.id === 'code'), undefined);
  harness.unmount();
});

test('optional contacts remain available inside a native disclosure closed by default without changing consent or values', () => {
  const harness = view(), tree = enterValid(harness, { ...valid,
    contactPhone: { country: 'CO', national: '3001234567' }, contactWhatsapp: { country: 'ES', national: '612345678' } });
  const details = find(tree, node => node?.type === 'details');
  assert.ok(details);
  assert.equal(details.props.open, undefined);
  const summary = find(details, node => node?.type === 'summary');
  assert.match(summary.props.children, /Agregar teléfono o WhatsApp \(opcional\)/);
  assert.match(summary.props.className, /min-h-11/);
  assert.ok(find(details, node => node?.type === 'fieldset'));
  assert.equal(find(details, node => node?.props?.id === 'contactPhone').props.value.national, '3001234567');
  assert.equal(find(details, node => node?.props?.id === 'contactWhatsapp').props.value.national, '612345678');
  assert.equal(find(tree, node => node?.props?.id === 'acceptsPrivacy').props.checked, true);
  harness.unmount();
});

test('an invalid hidden optional contact opens the disclosure before focusing its field and never sends a registration', async t => {
  const previousDocument = globalThis.document;
  const harness = view(), tree = enterValid(harness, { ...valid, contactPhone: { country: 'CO', national: '+34612345678' } });
  const details = find(tree, node => node?.type === 'details'), node = { open: false }, focused = [];
  details.ref.current = node;
  globalThis.document = { getElementById: id => ({ focus() { assert.equal(node.open, true); focused.push(id); } }) };
  t.after(() => { if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });
  t.mock.method(globalThis, 'fetch', () => assert.fail('invalid hidden contact reached registration'));
  await submit(tree);
  assert.equal(node.open, true);
  assert.deepEqual(focused, ['contactPhone']);
  assert.ok(find(harness.render(props), value => value?.props?.id === 'contactPhone').props.error);
  harness.unmount();
});

test('the login continuation consumes its one-time email but starts at details without credentials and with unchecked consent, without a message request', t => {
  const previous = globalThis.window, data = new Map();
  globalThis.window = { sessionStorage: { getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) } };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  const destination = model.registrationRedirect('new@example.test', 'MP-REFERRED', 'R', window);
  t.mock.method(globalThis, 'fetch', () => assert.fail('arriving at registration must not create an account or send a code'));
  const harness = view(), props = { initialSearch: new URL(destination, 'https://example.test').search };
  harness.render(props);
  const tree = harness.render(props), html = renderToStaticMarkup(tree);
  assert.equal(find(tree, node => node?.props?.id === 'email').props.value, 'new@example.test');
  assert.equal(find(tree, node => node?.props?.id === 'password'), undefined);
  assert.equal(find(tree, node => node?.props?.id === 'confirmPassword'), undefined);
  assert.equal(find(tree, node => node?.props?.id === 'acceptsPrivacy').props.checked, false);
  assert.match(html, /Paso 1 de 2/);
  assert.match(html, /Completa tu registro y verifica tu correo/);
  assert.match(html, /No se enviará ningún código hasta/);
  assert.match(html, /MP-REFERRED/);
  assert.equal(data.size, 0);
  assert.equal(model.consumeRegistrationPrefill(window), '');
  harness.unmount();
});

test('an untrusted registration reason is a hint only and cannot skip details or validate email and identity', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('a query hint must not send an email or claim an account'));
  const harness = view(), props = { initialSearch: 'reason=registration-required&verified=1&registered=1&role=admin' };
  harness.render(props);
  const tree = harness.render(props), html = renderToStaticMarkup(tree);
  assert.equal(find(tree, node => node?.props?.id === 'email').props.value, '');
  assert.match(html, /Paso 1 de 2/);
  assert.doesNotMatch(html, /Correo verificado correctamente|Ir al acceso/);
  assert.equal(find(tree, node => node?.props?.id === 'acceptsPrivacy').props.checked, false);
  harness.unmount();
});

test('blank contacts do not block signup and do not add contact or verification claims to its request', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => { calls.push({ path, body: JSON.parse(options.body) }); return signupAck(); });
  const harness = view(); await submit(enterValid(harness));
  assert.deepEqual(calls, [{ path: '/api/auth/register', body: { fullName: valid.fullName, email: valid.email, acceptsPrivacy: true,
    referralCode: 'MP-REFERRAL', preferredSide: 'R' } }]);
  const html = renderToStaticMarkup(harness.render(props));
  assert.match(html, /Paso 2 de 2/); assert.match(html, /Verifica tu correo/);
  assert.match(html, /Solicitud recibida/);
  assert.match(html, /solicitarlo no completa la verificación/);
  assert.doesNotMatch(html, /recibirás|código enviado|5 solicitudes|10 (?:intentos|validaciones)|24 horas|intentos restantes/i);
  assert.equal(Object.hasOwn(harness.state[1], 'password'), false); assert.equal(Object.hasOwn(harness.state[1], 'confirmPassword'), false);
});

test('a direct shared registration URL preserves its exact sponsor and right branch for later checkout before login captures the URL', async t => {
  const previous = globalThis.window, values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  globalThis.window = { localStorage: storage };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  t.mock.method(globalThis, 'fetch', async () => signupAck());
  const harness = view(undefined, referral);
  await submit(enterValid(harness));
  assert.deepEqual(referral.referralForCheckout(valid.email, storage), { code: 'MP-REFERRAL', email: valid.email, side: 'R' });
  assert.deepEqual(referral.referralForCheckout('another@example.test', storage), { code: '', email: '' });
  assert.equal(find(harness.render(props), node => node?.props?.id === 'code').props.value, '');
  harness.unmount();
});

test('optional phone and WhatsApp are separate canonical contacts, with no SMS request or implicit consent', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => { calls.push({ path, body: JSON.parse(options.body) }); return signupAck(); });
  const harness = view();
  await submit(enterValid(harness, { ...valid, contactPhone: { country: 'CO', national: '300 123 4567' }, contactWhatsapp: { country: 'ES', national: '612 345 678' } }));
  assert.equal(calls.length, 1); assert.equal(calls[0].path, '/api/auth/register');
  assert.equal(calls[0].body.contactPhone, '+573001234567');
  assert.equal(calls[0].body.contactWhatsapp, '+34612345678');
  for (const key of ['password', 'confirmPassword', 'phoneNumber', 'phoneConsent', 'phoneNumberVerified', 'whatsappSameAsPhone', 'proof', 'code']) assert.equal(Object.hasOwn(calls[0].body, key), false);
});

test('using the same WhatsApp number requires the explicit checkbox and tracks the current phone', async t => {
  let body;
  t.mock.method(globalThis, 'fetch', async (_path, options) => { body = JSON.parse(options.body); return signupAck(); });
  const harness = view();
  const tree = enterValid(harness, { ...valid, contactPhone: { country: 'CO', national: '3001234567' }, contactWhatsapp: { country: 'ES', national: '612345678' }, whatsappSameAsPhone: true });
  assert.equal(find(tree, node => node?.props?.id === 'contactWhatsapp'), undefined);
  await submit(tree);
  assert.equal(body.contactWhatsapp, body.contactPhone);
  assert.equal(body.contactWhatsapp, '+573001234567');
});

test('invalid optional contacts stop signup instead of dropping or silently altering the number', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('invalid optional contact must not reach the API'));
  const previousDocument = globalThis.document;
  globalThis.document = { getElementById: () => ({ focus() {} }) };
  t.after(() => { if (previousDocument === undefined) delete globalThis.document; else globalThis.document = previousDocument; });
  for (const changes of [{ contactPhone: { country: 'CO', national: '+34612345678' } }, { contactWhatsapp: { country: 'CO', national: '3001234567 ext 9' } }, { whatsappSameAsPhone: true }]) {
    const harness = view(); await submit(enterValid(harness, { ...valid, ...changes }));
    const tree = harness.render(props);
    assert.ok(find(tree, node => node?.props?.error));
    assert.match(renderToStaticMarkup(tree), /Paso 1 de 2/);
  }
});

test('passwordless signup immediately enters once after OTP proof and matching canonical access without sending a second code', async t => {
  const destinations = browser(t), paths = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    paths.push(path);
    if (path === '/api/auth/register') return signupAck();
    if (path === '/api/auth/session?view=access') {
      assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'same-origin');
      assert.equal(options.body, undefined);
      return canonicalAccess();
    }
    assert.deepEqual(JSON.parse(options.body), { email: valid.email, code: '001234' });
    return confirmationAck();
  });
  const harness = view(); harness.render(props); harness.replayEffects();
  await submit(enterValid(harness));
  let tree = harness.render(props);
  assert.match(renderToStaticMarkup(tree), /Verifica tu correo/);
  find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
  await submit(harness.render(props));
  tree = harness.render(props);
  assert.deepEqual(paths, ['/api/auth/register', '/api/auth/register/confirm', '/api/auth/session?view=access']);
  assert.match(renderToStaticMarkup(tree), /El correo está verificado/);
  assert.match(renderToStaticMarkup(tree), /Correo verificado correctamente/);
  assert.match(renderToStaticMarkup(tree), /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(renderToStaticMarkup(tree), /No necesitas solicitar otro código/);
  assert.match(renderToStaticMarkup(tree), /Tu sesión tiene acceso al portal/);
  assert.match(renderToStaticMarkup(tree), /Crear o cambiar contraseña \(opcional\)/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /contraseña (?:guardada|creada correctamente)|tu nueva contraseña está/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /Entra con la contraseña que creaste|Ir al acceso con código|Entrar con contraseña/);
  assert.match(renderToStaticMarkup(tree), /Si tu vinculación requiere revisión, debe aprobarse/);
  const continuation = find(tree, node => node?.props?.children === 'Continuar al panel');
  assert.equal(continuation.props.href, '/dashboard');
  assert.deepEqual(destinations, ['/dashboard']);
  let prevented = false;
  continuation.props.onClick({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true, 'a repeated fallback click cannot dispatch a second navigation');
  for (let render = 0; render < 3; render++) harness.render(props);
  assert.deepEqual(destinations, ['/dashboard']);
  assert.equal(find(tree, node => node?.props?.children === 'Crear o cambiar contraseña (opcional)').props.href, '/forgot-password');
  assert.match(renderToStaticMarkup(tree), /Puedes seguir entrando con códigos por correo, sin contraseña/);
  assert.match(renderToStaticMarkup(tree), /crear tu primera contraseña o cambiarla/);
  assert.match(renderToStaticMarkup(tree), /verifica un nuevo código de recuperación/);
  assert.match(renderToStaticMarkup(tree), /el código de registro no sirve para ese proceso/);
});

test('a verified session without approved network access, a mismatched session or an outage never grants the dashboard and can be rechecked without another OTP', async t => {
  const destinations = browser(t);
  for (const firstSession of [() => canonicalAccess(false), () => canonicalAccess(true, 'different@example.test'),
    () => Response.json({ error: 'authorization_unavailable' }, { status: 503 })]) {
    const previousNavigations = destinations.length;
    const paths = []; let reads = 0;
    t.mock.method(globalThis, 'fetch', async (path, options) => {
      paths.push(path);
      if (path === '/api/auth/register/confirm') return confirmationAck();
      assert.equal(path, '/api/auth/session?view=access');
      assert.equal(options.body, undefined);
      return reads++ === 0 ? firstSession() : canonicalAccess();
    });
    const harness = view(), resume = { initialSearch: `email=${encodeURIComponent(valid.email)}&resume=1` };
    let tree = harness.render(resume);
    find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
    await submit(harness.render(resume));
    tree = harness.render(resume);
    assert.match(renderToStaticMarkup(tree), /Correo verificado correctamente/);
    assert.match(renderToStaticMarkup(tree), /Si tu vinculación requiere revisión, debe aprobarse/);
    const recheck = find(tree, node => node?.props?.children === 'Continuar al panel');
    assert.equal(recheck.props.href, undefined, 'the continuation is a guarded recheck, not a dashboard link');
    assert.equal(typeof recheck.props.onClick, 'function');
    assert.equal(find(tree, node => node?.props?.id === 'code'), undefined);
    assert.equal(destinations.length, previousNavigations, 'an unbound, mismatched or unavailable session never enters');
    await find(tree, node => node?.props?.children === 'Continuar al panel').props.onClick();
    tree = harness.render(resume);
    assert.equal(find(tree, node => node?.props?.children === 'Continuar al panel').props.href, '/dashboard');
    assert.equal(destinations.length, previousNavigations + 1);
    assert.equal(destinations.at(-1), '/dashboard');
    assert.deepEqual(paths, ['/api/auth/register/confirm', '/api/auth/session?view=access', '/api/auth/session?view=access']);
    harness.unmount();
  }
});

test('confirmation503 is unconfirmed and offers explicit login without a canonical access claim or another automatic message', async t => {
  const paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path); return Response.json({ code: 'REGISTRATION_UNAVAILABLE' }, { status: 503 });
  });
  const harness = view(), resume = { initialSearch: `email=${encodeURIComponent(valid.email)}&resume=1` };
  let tree = harness.render(resume);
  find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
  await submit(harness.render(resume));
  tree = harness.render(resume);
  assert.match(renderToStaticMarkup(tree), /No pudimos confirmar el resultado/);
  assert.match(renderToStaticMarkup(tree), /No reintentaremos automáticamente/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /Correo verificado correctamente|Continuar al panel/);
  const login = new URL(find(tree, node => node?.props?.children === 'Entrar de forma segura').props.href, 'https://example.test');
  assert.equal(login.pathname, '/login'); assert.equal(login.searchParams.get('mode'), 'code');
  assert.deepEqual(paths, ['/api/auth/register/confirm']);
  harness.unmount();
});

test('leaving after confirmation while canonical access is pending aborts the read and suppresses stale authorization without retrying OTP', async t => {
  const destinations = browser(t);
  let complete, signal, started;
  const begun = new Promise(resolve => { started = resolve; }), paths = [];
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    paths.push(path);
    if (path === '/api/auth/register/confirm') return confirmationAck();
    signal = options.signal; started();
    return new Promise(resolve => { complete = resolve; });
  });
  const harness = view(), resume = { initialSearch: `email=${encodeURIComponent(valid.email)}&resume=1` };
  let tree = harness.render(resume);
  find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
  const pending = submit(harness.render(resume));
  await begun;
  assert.deepEqual(destinations, [], 'proof alone must wait for canonical authorization');
  assert.match(renderToStaticMarkup(harness.render(resume)), /Comprobando tu sesión y tu acceso/);
  harness.unmount();
  const previous = JSON.stringify(harness.state);
  assert.equal(signal.aborted, true);
  complete(canonicalAccess());
  await pending;
  assert.equal(JSON.stringify(harness.state), previous);
  assert.deepEqual(paths, ['/api/auth/register/confirm', '/api/auth/session?view=access']);
  assert.deepEqual(destinations, []);
});

test('manual registration access review is duplicate-locked and a ready result after unmount cannot enter', async t => {
  const destinations = browser(t), paths = [];
  let release, signal, reads = 0;
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    paths.push(path);
    if (path === '/api/auth/register/confirm') return confirmationAck();
    if (++reads === 1) return canonicalAccess(false);
    signal = options.signal;
    return new Promise(resolve => { release = resolve; });
  });
  const harness = view(), resume = { initialSearch: `email=${encodeURIComponent(valid.email)}&resume=1` };
  let tree = harness.render(resume);
  find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
  await submit(harness.render(resume));
  const review = find(harness.render(resume), node => node?.props?.children === 'Continuar al panel').props.onClick;
  const pending = review(); await review();
  assert.equal(reads, 2);
  harness.unmount(); const state = JSON.stringify(harness.state);
  assert.equal(signal.aborted, true);
  release(canonicalAccess()); await pending; await review();
  assert.equal(JSON.stringify(harness.state), state);
  assert.deepEqual(destinations, []);
  assert.deepEqual(paths, ['/api/auth/register/confirm', '/api/auth/session?view=access', '/api/auth/session?view=access']);
});

test('resumed registration preserves its local sponsor and branch before automatic entry without claiming another email hint', async t => {
  const destinations = browser(t), values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
  window.localStorage = storage;
  referral.captureReferralFromUrl('?ref=GlobalSponsor&side=R', storage);
  referral.bindReferralCodeToEmail('other@example.test', 'OtherSponsor', storage, undefined, 'registration', 'R');
  t.mock.method(globalThis, 'fetch', async path => path === '/api/auth/session?view=access' ? canonicalAccess() : confirmationAck());
  const saves = [];
  const harness = view(undefined, referral, undefined, (...values) => { saves.push(values); return new Promise(() => {}); });
  const resume = { initialSearch: `email=${encodeURIComponent(valid.email)}&resume=1&ref=LocalSponsor&side=L` };
  const tree = harness.render(resume);
  find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
  await submit(harness.render(resume));
  assert.deepEqual(destinations, ['/dashboard']);
  assert.deepEqual(saves, [[valid.email, 'LocalSponsor', 'L']], 'entry does not wait for background persistence');
  assert.deepEqual(referral.referralForCheckout(valid.email, storage), { code: 'LocalSponsor', email: valid.email, side: 'L' });
  assert.deepEqual(referral.referralForCheckout('other@example.test', storage), { code: 'OtherSponsor', email: 'other@example.test', side: 'R' });
  harness.unmount();
});

test('the confirmation helper explains the latest registration code purpose, lifetime, three-attempt limit and manual cooldown', () => {
  const harness = view(), tree = harness.render({ initialSearch: 'email=member%40example.test&resume=1' });
  const code = find(tree, node => node?.props?.id === 'code'), html = renderToStaticMarkup(tree);
  assert.match(code.props.helper, /6 dígitos del código más reciente de este registro/);
  assert.match(code.props.helper, /vence en 5 minutos y permite hasta 3 intentos por código/);
  assert.match(code.props.helper, /No uses un código de inicio de sesión o de recuperación/);
  assert.match(html, /No compartas este código con nadie/);
  assert.match(html, /Si no lo ves, revisa spam o correo no deseado/);
  assert.match(html, /El reenvío es manual: espera a que termine el contador/);
  assert.match(html, /al menos 5 minutos y la espera puede ser mayor/);
  assert.match(html, /Cambiar de pantalla no envía correos ni evita los límites/);
  assert.doesNotMatch(html, /recibirás|código enviado|5 solicitudes|10 (?:intentos|validaciones)|24 horas|intentos restantes/i);
  harness.unmount();
});

test('manual registration resend acknowledgement guides the latest code without claiming delivery or auto-resending', async t => {
  const paths = [];
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path); return Response.json({ ok: true, mode: 'better-auth', resendAfter: 300 });
  });
  const harness = view(), resume = { initialSearch: 'email=member%40example.test&resume=1' };
  const tree = harness.render(resume);
  await find(tree, node => node?.props?.children === 'Solicitar otro código').props.onClick();
  const html = renderToStaticMarkup(harness.render(resume));
  assert.match(html, /Si recibes un nuevo código de registro, usa sólo el más reciente/);
  assert.match(html, /Revisa también spam; no se enviará otro automáticamente/);
  assert.doesNotMatch(html, /recibirás|código enviado|5 solicitudes|10 (?:intentos|validaciones)|24 horas|intentos restantes/i);
  assert.deepEqual(paths, ['/api/auth/register/confirm']);
  harness.unmount();
});

test('registration cannot show verified success from URL hints, send success, an invalid code or an ambiguous response', async t => {
  for (const [status, payload] of [[400, { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: false, sessionEstablished: true }],
    [503, { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: false, sessionEstablished: true }],
    [200, { ok: true }], [200, { ok: true, mode: 'better-auth', userConfirmed: false, needsLogin: false, sessionEstablished: true }],
    [200, { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: true }]]) {
    const paths = [];
    t.mock.method(globalThis, 'fetch', async path => { paths.push(path); return Response.json(payload, { status }); });
    const harness = view(), resume = { initialSearch: 'email=member%40example.test&resume=1&verified=true&registered=1' };
    let tree = harness.render(resume);
    assert.doesNotMatch(renderToStaticMarkup(tree), /Correo verificado correctamente/);
    find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
    await submit(harness.render(resume));
    tree = harness.render(resume);
    assert.doesNotMatch(renderToStaticMarkup(tree), /Correo verificado correctamente|El correo está verificado/);
    assert.deepEqual(paths, ['/api/auth/register/confirm']);
  }
});

test('an existing registration resumes email confirmation without collecting or verifying a phone', () => {
  const html = renderToStaticMarkup(view().render({ initialSearch: 'email=member%40example.test&resume=1' }));
  assert.match(html, /Verifica tu correo/);
  assert.doesNotMatch(html, /Contacto opcional|contactPhone|contactWhatsapp|SMS/);
});

test('confirmed signup delivery failure resumes pending verification without another signup, automatic email or any registration password', async t => {
  const paths = [], waits = [];
  const cooldown = { active: false, label: 'Reenviar en 5:00', start(seconds) { waits.push(seconds); this.active = true; } };
  t.mock.method(globalThis, 'fetch', async path => {
    paths.push(path);
    return Response.json({ code: 'EMAIL_DELIVERY_UNAVAILABLE', registrationPending: true, email: valid.email, requiresConfirmation: true, retryAfter: 300 },
      { status: 503, headers: { 'retry-after': '300' } });
  });
  const harness = view(cooldown);
  await submit(enterValid(harness));
  const tree = harness.render(props), html = renderToStaticMarkup(tree);
  assert.deepEqual(paths, ['/api/auth/register']);
  assert.deepEqual(waits, [300]);
  assert.equal(Object.hasOwn(harness.state[1], 'password'), false);
  assert.equal(Object.hasOwn(harness.state[1], 'confirmPassword'), false);
  assert.match(html, /Paso 2 de 2/);
  assert.match(html, /no pudimos enviar el código/);
  assert.match(html, /No crees otra cuenta/);
  assert.match(html, /El reenvío es manual/);
  assert.doesNotMatch(html, /El correo está verificado|recibirás un código|código enviado/);
  const resend = find(tree, node => node?.props?.children === 'Reenviar en 5:00');
  assert.equal(resend.props.disabled, true);
  await resend.props.onClick();
  assert.deepEqual(paths, ['/api/auth/register']);
});

test('unconfirmed and mismatched delivery failures do not claim a pending registration or collect credentials', async t => {
  for (const [status, body] of [[503, { code: 'REGISTRATION_UNAVAILABLE' }], [503, { code: 'EMAIL_DELIVERY_UNAVAILABLE',
    registrationPending: true, email: 'other@example.test', requiresConfirmation: true }], [200, { code: 'EMAIL_DELIVERY_UNAVAILABLE',
    registrationPending: true, email: valid.email, requiresConfirmation: true }]]) {
    const paths = [];
    t.mock.method(globalThis, 'fetch', async path => { paths.push(path); return Response.json(body, { status }); });
    const harness = view(); await submit(enterValid(harness));
    assert.deepEqual(paths, ['/api/auth/register']);
    assert.equal(Object.hasOwn(harness.state[1], 'password'), false);
    assert.equal(harness.state[1].email, valid.email);
    assert.match(renderToStaticMarkup(harness.render(props)), /Paso 1 de 2/);
  }
});

test('registration sends wait30 seconds and confirmation waits20 for its two private proofs before the separate12-second access read', async t => {
  const destinations = browser(t);
  const deadlines = [], paths = [];
  const timeout = AbortSignal.timeout.bind(AbortSignal);
  t.mock.method(AbortSignal, 'timeout', milliseconds => { deadlines.push(milliseconds); return timeout(milliseconds); });
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    paths.push(path);
    if (path === '/api/auth/register') return signupAck();
    if (path === '/api/auth/session?view=access') return canonicalAccess();
    return Response.json(JSON.parse(options.body).resend === true
      ? { ok: true, mode: 'better-auth', resendAfter: 300 }
      : { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: false, sessionEstablished: true });
  });
  const harness = view();
  await submit(enterValid(harness));
  let tree = harness.render(props);
  await find(tree, node => node?.props?.children === 'Solicitar otro código').props.onClick();
  tree = harness.render(props);
  find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
  await submit(harness.render(props));
  assert.deepEqual(deadlines, [30000, 30000, 20000, 12000]);
  assert.deepEqual(paths, ['/api/auth/register', '/api/auth/register/confirm', '/api/auth/register/confirm', '/api/auth/session?view=access']);
  assert.equal(emailOtp.otpTimeoutMs('confirm'), 12000, 'login OTP exchange keeps its original deadline');
  assert.deepEqual(destinations, ['/dashboard']);
});

test('registration scopes its shared resend deadline to the normalized current recipient, including after correcting the email', () => {
  const scopes = [], harness = view(undefined, undefined, (seconds, scope) => scopes.push({ seconds, scope }));
  let tree = harness.render();
  find(tree, node => node?.props?.id === 'email').props.onChange({ target: { value: ' FIRST@EXAMPLE.TEST ' } });
  tree = harness.render();
  find(tree, node => node?.props?.id === 'email').props.onChange({ target: { value: 'second@example.test' } });
  tree = harness.render();
  find(tree, node => node?.props?.id === 'email').props.onChange({ target: { value: 'first@example.test' } });
  harness.render();
  assert.deepEqual(scopes, ['', 'first@example.test', 'second@example.test', 'first@example.test'].map(scope => ({ seconds: 300, scope })));
  harness.unmount();
});

test('an explicit existing-account error keeps the existing manual choices without sending another purpose or disclosing generic successes', async t => {
  for (const status of [409, 200]) {
    const calls = [];
    t.mock.method(globalThis, 'fetch', async (path, options) => {
      calls.push({ path, body: JSON.parse(options.body) });
      return Response.json({ code: 'ACCOUNT_EXISTS', accountExists: true, needsLogin: true }, { status });
    });
    const harness = view();
    await submit(enterValid(harness));
    const tree = harness.render(props), html = renderToStaticMarkup(tree);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].path, '/api/auth/register');
    assert.match(html, /Ya solicité mi registro: verificar correo/);
    assert.match(html, /Entrar de forma segura/);
    assert.doesNotMatch(html, /Correo verificado correctamente/);
    if (status === 409) assert.match(html, /Ya existe un acceso con este correo/);
    else assert.doesNotMatch(html, /Ya existe un acceso con este correo/);
    harness.unmount();
  }
});

test('leaving during signup, verification or resend aborts the request and ignores late success without retrying', async t => {
  for (const action of ['register', 'confirm', 'resend']) {
    let complete, signal;
    const paths = [], waits = [], referrals = [];
    const harness = view({ active: false, label: '', start: value => waits.push(value) },
      { bindReferralCodeToEmail: (...values) => referrals.push(values) });
    t.mock.method(globalThis, 'fetch', (path, options) => {
      paths.push(path); signal = options.signal;
      return new Promise(resolve => { complete = resolve; });
    });
    let tree;
    if (action === 'register') tree = enterValid(harness);
    else {
      tree = harness.render({ initialSearch: `email=${encodeURIComponent(valid.email)}&resume=1` });
      if (action === 'confirm') {
        find(tree, node => node?.props?.id === 'code').props.onChange({ target: { value: '001234' } });
        tree = harness.render({ initialSearch: `email=${encodeURIComponent(valid.email)}&resume=1` });
      }
    }
    const pending = action === 'resend'
      ? find(tree, node => node?.props?.children === 'Solicitar otro código').props.onClick() : submit(tree);
    assert.equal(paths.length, 1);
    assert.equal(signal.aborted, false);
    harness.unmount();
    const stateAtUnmount = JSON.stringify(harness.state), waitsAtUnmount = [...waits];
    assert.equal(signal.aborted, true);
    complete(action === 'register' ? signupAck() : Response.json(action === 'resend'
      ? { ok: true, mode: 'better-auth', resendAfter: 300 }
      : { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: false, sessionEstablished: true }));
    await pending;
    assert.equal(paths.length, 1);
    assert.equal(JSON.stringify(harness.state), stateAtUnmount);
    assert.deepEqual(waits, waitsAtUnmount);
    assert.deepEqual(referrals, []);
  }
});

test('cancellation also ignores a late decoded body or rejected transport without altering the next screen', async t => {
  for (const outcome of ['late-body', 'abort-rejection']) {
    let finish;
    const waits = [], referrals = [], paths = [];
    const harness = view({ active: false, label: '', start: value => waits.push(value) },
      { bindReferralCodeToEmail: (...values) => referrals.push(values) });
    t.mock.method(globalThis, 'fetch', (path, options) => {
      paths.push(path);
      if (outcome === 'abort-rejection') return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new DOMException('Synthetic cancellation', 'AbortError')), { once: true });
      });
      return Promise.resolve({ ok: true, status: 201, headers: new Headers(), json: () => new Promise(resolve => { finish = resolve; }) });
    });
    const pending = submit(enterValid(harness));
    await Promise.resolve();
    harness.unmount();
    const previous = JSON.stringify(harness.state);
    if (outcome === 'late-body') finish(await signupAck().json());
    await pending;
    assert.equal(JSON.stringify(harness.state), previous);
    assert.deepEqual(waits, []);
    assert.deepEqual(referrals, []);
    assert.equal(paths.length, 1);
  }
});
