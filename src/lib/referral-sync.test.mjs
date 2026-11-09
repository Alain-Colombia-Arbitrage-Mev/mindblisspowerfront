import assert from 'node:assert/strict';
import test from 'node:test';
import { beginVerifiedReferralSync, browserReferralChoice, chooseBrowserReferral, pendingVerifiedReferral, readVerifiedReferral, retryVerifiedReferral, verifiedReferralForCheckout } from './referral-sync.mjs';
import { bindReferralCodeToEmail, referralForCheckout } from './referral-attribution.js';
import { handleReferralAttribution } from './referral-attribution-bff.mjs';

const email = 'member@example.test';
const serverHint = (ref = 'ServerSponsor', side = 'R', positioned = false) => ({ ok: true, ref, preferred_side: side, positioned });
function memory() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
const browser = () => ({ localStorage: memory(), sessionStorage: memory() });
const pending = () => { let resolve; return { promise: new Promise(done => { resolve = done; }), resolve: value => resolve(value) }; };

test('mobile referral persistence and reads keep exact owner/ACK contracts without modern AbortSignal methods', async () => {
  const descriptors = new Map(['any', 'timeout'].map(key => [key, Object.getOwnPropertyDescriptor(AbortSignal, key)]));
  const owner = browser(), calls = [];
  try {
    for (const key of descriptors.keys()) Object.defineProperty(AbortSignal, key, { configurable: true, value: undefined });
    const options = { browser: owner, fetchImpl: async (_path, init) => {
      calls.push(init);
      assert.equal(init.signal.aborted, false);
      return Response.json(serverHint('MobileSponsor', 'R'));
    } };
    assert.equal((await beginVerifiedReferralSync(email, 'MobileSponsor', 'R', options)).ok, true);
    assert.equal(pendingVerifiedReferral(email, { browser: owner }), null);
    assert.deepEqual(JSON.parse(calls[0].body), { ref: 'MobileSponsor', preferred_side: 'R', expected_email: email });
    assert.equal(calls[0].keepalive, true);
    assert.deepEqual(await readVerifiedReferral(email, options), serverHint('MobileSponsor', 'R'));
    assert.equal(calls[1].method, undefined);
    assert.equal(calls[1].headers['X-VP-Expected-Email'], email);
    assert.equal(calls.length, 2);
  } finally {
    for (const [key, descriptor] of descriptors) Object.defineProperty(AbortSignal, key, descriptor);
  }
});

test('verified entry starts one small keepalive save without waiting, stores only its scoped short-lived hint and confirms only the exact ACK', async () => {
  const owner = browser(), transport = pending(), calls = [];
  bindReferralCodeToEmail(email, 'LocalSponsor', owner.localStorage, undefined, 'login', 'L');
  const completion = beginVerifiedReferralSync(' MEMBER@EXAMPLE.TEST ', 'LocalSponsor', 'l', { browser: owner, fetchImpl: async (path, options) => {
    calls.push({ path, options }); return transport.promise;
  } });
  assert.equal(calls.length, 1, 'the caller can immediately navigate while the save remains pending');
  assert.equal(calls[0].path, '/api/member/referral-attribution');
  assert.equal(calls[0].options.keepalive, true); assert.equal(calls[0].options.credentials, 'same-origin');
  assert.deepEqual(JSON.parse(calls[0].options.body), { ref: 'LocalSponsor', preferred_side: 'L', expected_email: email });
  assert.equal(pendingVerifiedReferral(email, { browser: owner }).ref, 'LocalSponsor');
  assert.equal(pendingVerifiedReferral('other@example.test', { browser: owner }), null);
  assert.doesNotMatch(JSON.stringify([...owner.sessionStorage.values.values()]), /token|password|person_id|role|affiliate_id/);
  transport.resolve(Response.json(serverHint('LocalSponsor', 'L')));
  assert.equal((await completion).ok, true);
  assert.equal(pendingVerifiedReferral(email, { browser: owner }), null);
  assert.equal(referralForCheckout(email, owner.localStorage).code, 'LocalSponsor');
});

test('old browser attribution is never posted on a read and never overwrites a durable hint from a newer device', async () => {
  const owner = browser(), calls = [];
  bindReferralCodeToEmail(email, 'OldBrowserSponsor', owner.localStorage, undefined, 'registration', 'L');
  const result = await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async (path, options) => {
    calls.push({ path, options }); return Response.json(serverHint('NewDeviceSponsor', 'R'));
  } });
  assert.deepEqual(result, { ok: true, code: 'NewDeviceSponsor', email, side: 'R' });
  assert.equal(calls.length, 1); assert.equal(calls[0].options.method, undefined);
  assert.equal(calls[0].options.headers['X-VP-Expected-Email'], email);
  assert.equal(calls[0].options.body, undefined);
  assert.equal(referralForCheckout(email, owner.localStorage).code, 'OldBrowserSponsor', 'a GET does not rewrite another stored hint');
});

test('failed saves retain both browser hints and a marker; reads do not retry, explicit retry is singleflight and checkout blocks until confirmed', async () => {
  const owner = browser(), calls = [];
  bindReferralCodeToEmail(email, 'CurrentLink', owner.localStorage, undefined, 'login', 'L');
  await beginVerifiedReferralSync(email, 'CurrentLink', 'L', { browser: owner, fetchImpl: async (_path, options) => {
    calls.push(options.method); throw new Error('private-provider-diagnostic');
  } });
  assert.equal(pendingVerifiedReferral(email, { browser: owner }).ref, 'CurrentLink');
  const options = { browser: owner, fetchImpl: async (_path, input) => { calls.push(input.method || 'GET'); return Response.json(serverHint('OlderDurable', 'R')); } };
  assert.deepEqual(await verifiedReferralForCheckout(email, options), { ok: false, error: 'pending' });
  assert.deepEqual(calls, ['POST', 'GET']);
  const transport = pending();
  const retryOptions = { browser: owner, fetchImpl: async (_path, input) => { calls.push(input.method); return transport.promise; } };
  const first = retryVerifiedReferral(email, retryOptions), duplicate = retryVerifiedReferral(email, retryOptions);
  assert.deepEqual(calls, ['POST', 'GET', 'POST']);
  transport.resolve(Response.json(serverHint('CurrentLink', 'L')));
  assert.equal((await first).ok, true); assert.equal((await duplicate).ok, true);
  assert.equal(pendingVerifiedReferral(email, { browser: owner }), null);
  assert.equal(referralForCheckout(email, owner.localStorage).code, 'CurrentLink');
  assert.deepEqual(await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async () => Response.json(serverHint('CurrentLink', 'L')) }),
    { ok: true, code: 'CurrentLink', email, side: 'L' });
});

test('immutable placement ignores pending hints while a missing durable attribution does not silently erase a known browser referral', async () => {
  const owner = browser();
  bindReferralCodeToEmail(email, 'OldSponsor', owner.localStorage, undefined, 'login', 'L');
  assert.deepEqual(await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async () => Response.json(serverHint('', '')) }),
    { ok: false, error: 'unconfirmed' });
  await beginVerifiedReferralSync(email, 'NewSponsor', 'R', { browser: owner, fetchImpl: async () => Response.json({ error: 'unavailable' }, { status: 503 }) });
  assert.deepEqual(await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async () => Response.json(serverHint('', '', true)) }),
    { ok: true, code: '', email: '', side: '' });
  assert.equal(pendingVerifiedReferral(email, { browser: owner }), null);
  assert.equal(referralForCheckout(email, owner.localStorage).code, 'OldSponsor', 'no node placement or browser binding is rewritten');
});

test('late responses cannot clear a newer visit or another owner, and expired markers never get replayed', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1800000000000 });
  const owner = browser(), old = pending();
  const first = beginVerifiedReferralSync(email, 'First', 'L', { browser: owner, fetchImpl: () => old.promise });
  const second = beginVerifiedReferralSync(email, 'Second', 'R', { browser: owner, fetchImpl: async () => Response.json({}, { status: 503 }) });
  old.resolve(Response.json(serverHint('First', 'L'))); await first; await second;
  assert.equal(pendingVerifiedReferral(email, { browser: owner }).ref, 'Second');
  await beginVerifiedReferralSync('other@example.test', 'Other', 'R', { browser: owner, fetchImpl: async () => Response.json({}, { status: 503 }) });
  assert.equal(pendingVerifiedReferral(email, { browser: owner }).ref, 'Second', 'another owner cannot erase this context\'s pending choice');
  assert.equal(pendingVerifiedReferral('other@example.test', { browser: owner }).ref, 'Other');
  t.mock.timers.tick(31 * 60 * 1000);
  const methods = [];
  await retryVerifiedReferral('other@example.test', { browser: owner, fetchImpl: async (_path, options) => {
    methods.push(options.method || 'GET'); return Response.json(serverHint('DurableOther', 'L'));
  } });
  assert.deepEqual(methods, ['GET'], 'expired visit is not an automatic or explicit replay of old cache');
});

test('parallel dashboard reads are singleflight and malformed, failed or mismatched acknowledgements cannot authorize checkout', async () => {
  const owner = browser(), transport = pending(); let reads = 0;
  const options = { browser: owner, fetchImpl: async () => { reads++; return transport.promise; } };
  const first = readVerifiedReferral(email, options), replay = readVerifiedReferral(email, options);
  assert.equal(reads, 1);
  transport.resolve(Response.json(serverHint())); await first; await replay;
  for (const response of [Response.json({ ok: true }), Response.json(serverHint(), { status: 503 }),
    Response.json({ ...serverHint(), positioned: 'false' }), Response.json({ ...serverHint(), preferred_side: 'ROOT' }),
    Response.json({ ...serverHint(), error: 'private-error' }), Response.json({ ...serverHint(), code: 'INVALID_REFERRAL' })]) {
    assert.deepEqual(await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async () => response }), { ok: false, error: 'unavailable' });
  }
  await beginVerifiedReferralSync(email, 'Wanted', 'L', { browser: owner, fetchImpl: async () => Response.json(serverHint('Wrong', 'R')) });
  assert.equal(pendingVerifiedReferral(email, { browser: owner }).ref, 'Wanted');
});

test('a checkout read started before a confirmed write cannot authorize an older durable referral', async () => {
  const owner = browser(), stale = pending(); let reads = 0;
  bindReferralCodeToEmail(email, 'CurrentVisit', owner.localStorage, undefined, 'login', 'L');
  await beginVerifiedReferralSync(email, 'CurrentVisit', 'L', { browser: owner, fetchImpl: async () => Response.json({}, { status: 503 }) });
  const checkout = verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async () => {
    reads++;
    return reads === 1 ? stale.promise : Response.json(serverHint('CurrentVisit', 'L'));
  } });
  assert.equal(reads, 1);
  assert.equal((await retryVerifiedReferral(email, { browser: owner, fetchImpl: async () => Response.json(serverHint('CurrentVisit', 'L')) })).ok, true);
  stale.resolve(Response.json(serverHint('OlderDurable', 'R')));
  assert.deepEqual(await checkout, { ok: true, code: 'CurrentVisit', email, side: 'L' });
  assert.equal(reads, 2, 'one fresh GET replaces the reply that predates the completed write');
});

test('reads observe an already-started verified save without resending it, even when tab storage is denied', async () => {
  for (const denied of [false, true]) {
    const owner = browser(), transport = pending(), methods = [];
    if (denied) owner.sessionStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    bindReferralCodeToEmail(email, 'CurrentVisit', owner.localStorage, undefined, 'login', 'L');
    const saving = beginVerifiedReferralSync(email, 'CurrentVisit', 'L', { browser: owner, fetchImpl: async (_path, input) => {
      methods.push(input.method); return transport.promise;
    } });
    const checkout = verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async (_path, input) => {
      methods.push(input.method || 'GET'); return Response.json(serverHint('CurrentVisit', 'L'));
    } });
    assert.deepEqual(methods, ['POST'], 'a read waits for the existing request rather than racing or replaying it');
    transport.resolve(Response.json(serverHint('CurrentVisit', 'L'))); await saving;
    assert.deepEqual(await checkout, { ok: true, code: 'CurrentVisit', email, side: 'L' });
    assert.deepEqual(methods, ['POST', 'GET']);
  }
});

test('singleflight never shares an owner lookup between different browser contexts', async () => {
  const firstBrowser = browser(), secondBrowser = browser(), firstReply = pending(), secondReply = pending();
  let firstReads = 0, secondReads = 0;
  const first = readVerifiedReferral(email, { browser: firstBrowser, fetchImpl: async () => { firstReads++; return firstReply.promise; } });
  const second = readVerifiedReferral(email, { browser: secondBrowser, fetchImpl: async () => { secondReads++; return secondReply.promise; } });
  assert.equal(firstReads, 1); assert.equal(secondReads, 1);
  firstReply.resolve(Response.json(serverHint('FirstBrowser', 'L')));
  secondReply.resolve(Response.json(serverHint('SecondBrowser', 'R')));
  assert.deepEqual(await first, serverHint('FirstBrowser', 'L'));
  assert.deepEqual(await second, serverHint('SecondBrowser', 'R'));
});

test('repeated concurrent verified changes fail closed after one fresh GET instead of looping or accepting a stale snapshot', async () => {
  const owner = browser(); let reads = 0;
  const result = await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async () => {
    reads++;
    await beginVerifiedReferralSync(email, `Visit${reads}`, 'L', { browser: owner, fetchImpl: async () => Response.json(serverHint(`Visit${reads}`, 'L')) });
    return Response.json(serverHint('OlderDurable', 'R'));
  } });
  assert.deepEqual(result, { ok: false, error: 'unavailable' });
  assert.equal(reads, 2);
});

test('expired or unavailable tab markers retain the browser backup as a visible fresh choice, never an automatic replay or silent default', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1800000000000 });
  for (const unavailable of [false, true]) {
    const owner = browser(), calls = [];
    bindReferralCodeToEmail(email, 'BrowserBackup', owner.localStorage, undefined, 'login', 'L');
    if (unavailable) owner.sessionStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    await beginVerifiedReferralSync(email, 'BrowserBackup', 'L', { browser: owner, fetchImpl: async () => Response.json({}, { status: 503 }) });
    if (!unavailable) t.mock.timers.tick(31 * 60 * 1000);
    assert.equal(pendingVerifiedReferral(email, { browser: owner })?.ref || null, unavailable ? 'BrowserBackup' : null);
    const options = { browser: owner, fetchImpl: async (_path, input) => { calls.push(input); return Response.json(serverHint('', '')); } };
    assert.deepEqual(await verifiedReferralForCheckout(email, options), { ok: false, error: unavailable ? 'pending' : 'unconfirmed' });
    assert.equal(calls.length, 1); assert.equal(calls[0].method, undefined, 'preflight never reposts the old cache');
    const choice = browserReferralChoice(email, { browser: owner });
    assert.deepEqual(choice, { code: 'BrowserBackup', email, side: 'L' });
    // Another tab changes the cache after the exact choice was displayed.
    bindReferralCodeToEmail(email, 'OtherTab', owner.localStorage, undefined, 'login', 'R');
    const confirmed = await chooseBrowserReferral(email, choice, { browser: owner, fetchImpl: async (_path, input) => {
      calls.push(input); assert.deepEqual(JSON.parse(input.body), { ref: 'BrowserBackup', preferred_side: 'L', expected_email: email });
      return Response.json(serverHint('BrowserBackup', 'L'));
    } });
    assert.equal(confirmed.ok, true); assert.equal(calls.length, 2); assert.equal(calls[1].method, 'POST');
    assert.equal((await chooseBrowserReferral('other@example.test', choice, { browser: owner, fetchImpl: () => assert.fail('cross-owner choice') })).ok, false);
  }
});

test('same-owner choices are saved in selection order and checkout observes the last explicit choice, not the first reply', async () => {
  const owner = browser(), firstReply = pending(), methods = [];
  let stored = serverHint('', '');
  const options = { browser: owner, fetchImpl: async (_path, input) => {
    if (input.method === 'POST') {
      const choice = JSON.parse(input.body); methods.push(choice.ref);
      if (choice.ref === 'FirstChoice') await firstReply.promise;
      stored = serverHint(choice.ref, choice.preferred_side);
      return Response.json(stored);
    }
    methods.push('GET'); return Response.json(stored);
  } };
  const first = beginVerifiedReferralSync(email, 'FirstChoice', 'L', options);
  const second = beginVerifiedReferralSync(email, 'LastChoice', 'R', options);
  const checkout = verifiedReferralForCheckout(email, options);
  assert.deepEqual(methods, ['FirstChoice'], 'the second POST and checkout GET wait for the existing owner save');
  assert.equal(pendingVerifiedReferral(email, { browser: owner }).ref, 'LastChoice');
  firstReply.resolve(); await first; await second;
  assert.deepEqual(await checkout, { ok: true, code: 'LastChoice', email, side: 'R' });
  assert.deepEqual(methods, ['FirstChoice', 'LastChoice', 'GET']);
  assert.equal(pendingVerifiedReferral(email, { browser: owner }), null);
});

test('a late server commit cannot silently undo an acknowledged last choice across reloads; only an explicit save reconciles it', async () => {
  const owner = browser(), methods = [];
  await beginVerifiedReferralSync(email, 'LastChoice', 'R', { browser: owner, fetchImpl: async () => Response.json(serverHint('LastChoice', 'R')) });
  assert.equal(pendingVerifiedReferral(email, { browser: owner }), null);
  // A new module context still has only a short-lived hint, never authority.
  const reloaded = { sessionStorage: owner.sessionStorage, localStorage: owner.localStorage };
  const options = { browser: reloaded, fetchImpl: async (_path, input) => { methods.push(input.method || 'GET'); return Response.json(serverHint('OlderDelayedChoice', 'L')); } };
  assert.deepEqual(await verifiedReferralForCheckout(email, options), { ok: false, error: 'pending' });
  assert.deepEqual(methods, ['GET'], 'a discrepancy never automatically resends a choice');
  assert.equal(pendingVerifiedReferral(email, { browser: reloaded }).ref, 'LastChoice');
  const confirmed = await retryVerifiedReferral(email, { browser: reloaded, fetchImpl: async (_path, input) => {
    methods.push(input.method); assert.equal(JSON.parse(input.body).ref, 'LastChoice');
    return Response.json(serverHint('LastChoice', 'R'));
  } });
  assert.equal(confirmed.ok, true); assert.deepEqual(methods, ['GET', 'POST']);
});

test('denied browser stores retain failed choices per owner and checkout fails closed until exact ACK or authoritative placement', async () => {
  const owner = { sessionStorage: { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } },
    localStorage: { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } } };
  await beginVerifiedReferralSync(email, 'ChosenSponsor', 'R', { browser: owner, fetchImpl: async () => Response.json({}, { status: 503 }) });
  assert.equal(pendingVerifiedReferral(email, { browser: owner }).ref, 'ChosenSponsor');
  assert.equal(pendingVerifiedReferral('another@example.test', { browser: owner }), null);
  const calls = [], options = { browser: owner, fetchImpl: async (_path, input) => { calls.push(input.method || 'GET'); return Response.json(serverHint('', '')); } };
  assert.deepEqual(await verifiedReferralForCheckout(email, options), { ok: false, error: 'pending' });
  assert.deepEqual(calls, ['GET']);
  assert.deepEqual(await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async () => Response.json(serverHint('', '', true)) }),
    { ok: true, code: '', email: '', side: '' });
  assert.equal(pendingVerifiedReferral(email, { browser: owner }), null);
});

test('a failed storage write cannot hide the latest same-millisecond choice behind an older readable confirmed record', async t => {
  t.mock.method(Date, 'now', () => 1800000000000);
  const owner = browser(), setItem = owner.sessionStorage.setItem;
  await beginVerifiedReferralSync(email, 'FirstChoice', 'L', { browser: owner, fetchImpl: async () => Response.json(serverHint('FirstChoice', 'L')) });
  const previous = owner.sessionStorage.getItem('mp_ref_verified_visit.v1');
  owner.sessionStorage.setItem = () => { throw new Error('quota_exceeded'); };
  await beginVerifiedReferralSync(email, 'LastChoice', 'R', { browser: owner, fetchImpl: async () => Response.json({}, { status: 503 }) });
  assert.equal(pendingVerifiedReferral(email, { browser: owner }).ref, 'LastChoice');
  const methods = [];
  assert.deepEqual(await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async (_path, input) => {
    methods.push(input.method || 'GET'); return Response.json(serverHint('FirstChoice', 'L'));
  } }), { ok: false, error: 'pending' });
  assert.deepEqual(methods, ['GET']);
  assert.equal(owner.sessionStorage.getItem('mp_ref_verified_visit.v1'), previous, 'a GET never rewrites storage');
  owner.sessionStorage.setItem = setItem;
  assert.equal((await retryVerifiedReferral(email, { browser: owner, fetchImpl: async (_path, input) => {
    methods.push(input.method); assert.equal(JSON.parse(input.body).ref, 'LastChoice');
    return Response.json(serverHint('LastChoice', 'R'));
  } })).ok, true);
  assert.equal(pendingVerifiedReferral(email, { browser: owner }), null);
  assert.deepEqual(methods, ['GET', 'POST']);
});

test('a read never overwrites a newer stored choice; ambiguous same-time choices remain pending rather than authorizing another referral', async t => {
  let now = 1800000000000;
  t.mock.method(Date, 'now', () => now);
  for (const newer of [false, true]) {
    const owner = browser(), setItem = owner.sessionStorage.setItem;
    await beginVerifiedReferralSync(email, 'FirstChoice', 'L', { browser: owner, fetchImpl: async () => Response.json(serverHint('FirstChoice', 'L')) });
    owner.sessionStorage.setItem = () => { throw new Error('quota_exceeded'); };
    await beginVerifiedReferralSync(email, 'LocalLastChoice', 'R', { browser: owner, fetchImpl: async () => Response.json({}, { status: 503 }) });
    if (newer) now++;
    const replacement = JSON.stringify({ id: 'another-explicit-choice', email, ref: 'OtherDocumentChoice', preferred_side: 'L', createdAt: now, confirmed: true });
    setItem('mp_ref_verified_visit.v1', replacement);
    let reads = 0;
    const result = await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async (_path, input) => {
      assert.equal(input.method, undefined); reads++;
      return Response.json(serverHint('OtherDocumentChoice', 'L'));
    } });
    assert.deepEqual(result, newer ? { ok: true, code: 'OtherDocumentChoice', email, side: 'L' } : { ok: false, error: 'pending' });
    assert.equal(pendingVerifiedReferral(email, { browser: owner })?.ref || null, newer ? null : 'LocalLastChoice');
    assert.equal(owner.sessionStorage.getItem('mp_ref_verified_visit.v1'), replacement);
    assert.equal(reads, 1);
  }
});

test('corrupt same-owner storage or failed reads cannot erase this context\'s valid pending choice, and real expiry retires both hints', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1800000000000 });
  for (const corruption of ['invalid-json', 'invalid-fields', 'read-unavailable']) {
    const owner = browser();
    await beginVerifiedReferralSync(email, 'PendingChoice', 'R', { browser: owner, fetchImpl: async () => Response.json({}, { status: 503 }) });
    if (corruption === 'read-unavailable') owner.sessionStorage.getItem = () => { throw new Error('read_denied'); };
    else owner.sessionStorage.setItem('mp_ref_verified_visit.v1', corruption === 'invalid-json' ? '{' : JSON.stringify({ email, id: 'bad', ref: '', preferred_side: 'ROOT', createdAt: Date.now() }));
    assert.equal(pendingVerifiedReferral(email, { browser: owner }).ref, 'PendingChoice');
    const methods = [];
    assert.deepEqual(await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async (_path, input) => {
      methods.push(input.method || 'GET'); return Response.json(serverHint('', ''));
    } }), { ok: false, error: 'pending' });
    assert.deepEqual(methods, ['GET']);
    t.mock.timers.tick(31 * 60 * 1000);
    assert.equal(pendingVerifiedReferral(email, { browser: owner }), null);
    assert.deepEqual(await verifiedReferralForCheckout(email, { browser: owner, fetchImpl: async () => Response.json(serverHint('', '')) }),
      { ok: true, code: '', email: '', side: '' });
  }
});

test('real client and BFF keep one verified owner end to end without browser authority or messages', async () => {
  const owner = browser(), calls = []; let stored = serverHint('', '');
  const transport = async (path, options) => handleReferralAttribution(new Request(`https://portal.example.test${path}`, {
    ...options, headers: { ...options.headers, ...(options.method === 'POST' ? { Origin: 'https://portal.example.test' } : {}) },
  }), { env: { AUTH_PUBLIC_ORIGIN: 'https://portal.example.test', PAYMENTS_SERVICE_TOKEN: 'synthetic-service' },
    identity: async () => ({ token: 'synthetic-verified-jwt', claims: { sub: 'synthetic-owner', email, email_verified: true } }),
    fetchImpl: async (url, input) => {
      calls.push({ url, input });
      if (input.method === 'POST') {
        const value = JSON.parse(input.body); assert.equal(value.email, email);
        stored = serverHint(value.ref, value.preferred_side);
      }
      return Response.json(stored);
    },
  });
  assert.equal((await beginVerifiedReferralSync(email, 'LatestLink', 'R', { browser: owner, fetchImpl: transport })).ok, true);
  assert.deepEqual(await verifiedReferralForCheckout(email, { browser: browser(), fetchImpl: transport }),
    { ok: true, code: 'LatestLink', email, side: 'R' });
  assert.equal(calls.length, 2); assert.equal(calls[0].input.method, 'POST'); assert.equal(calls[1].input.method, 'GET');
  assert.equal(calls[0].input.headers['X-VP-Id-Token'], 'synthetic-verified-jwt');
  assert.doesNotMatch(calls[0].input.body, /expected_email|position|sponsor_id|person_id|password|otp/);
});
