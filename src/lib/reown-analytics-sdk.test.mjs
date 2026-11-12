import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiController, ChainController, ConnectionController, EventsController, OptionsController } from '@reown/appkit-controllers';

const syntheticProjectId = '00000000000000000000000000000000';
const syntheticAddress = `0x${'1'.repeat(40)}`;
const optionalEvent = { type: 'track', event: 'MODAL_OPEN', properties: { connected: false } };

// Exercise the installed SDK rather than copying its analytics implementation.
// The SDK adapter, fetch, beacon, browser surfaces and periodic trigger are all
// synthetic: these tests cannot send real telemetry or connect a real wallet.
function fixture(t, analytics = true) {
  const savedOptions = { ...OptionsController.state, features: { ...OptionsController.state.features } };
  const savedEvents = { ...EventsController.state };
  const savedClient = ConnectionController.state._client;
  const descriptors = new Map();
  const beacons = [], requests = [], intervals = [], browser = new EventTarget(), document = new EventTarget();
  browser.location = { href: 'https://analytics.example.test/dashboard', hostname: 'analytics.example.test' };
  document.visibilityState = 'visible';
  let beaconResult = true, beaconFailure = false;
  for (const [key, value] of Object.entries({ window: browser, document, navigator: {
    sendBeacon(url, body) {
      if (beaconFailure) throw new Error('synthetic beacon transport unavailable');
      beacons.push({ url, body: JSON.parse(body) }); return beaconResult;
    },
  } })) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url: String(url), options });
    assert.fail('Unexpected real SDK fetch; each capability test must provide its own synthetic response');
  });
  t.mock.method(globalThis, 'setInterval', (callback, delay) => {
    intervals.push({ callback, delay }); return intervals.length;
  });
  t.mock.method(ChainController, 'getAccountData', () => ({ address: syntheticAddress }));
  t.mock.method(ChainController, 'getActiveCaipNetwork', () => ({ caipNetworkId: 'eip155:137' }));
  OptionsController.setOptions({ projectId: syntheticProjectId, sdkType: 'appkit', sdkVersion: 'react-ethers-1.8.24' });
  OptionsController.setFeatures({ analytics });
  Object.assign(EventsController.state, { pendingEvents: [], walletImpressions: [], reportedErrors: {},
    subscribedToVisibilityChange: false, lastFlush: Date.now() });
  t.after(() => {
    Object.assign(OptionsController.state, savedOptions);
    Object.assign(EventsController.state, savedEvents);
    if (savedClient === undefined) delete ConnectionController.state._client;
    else ConnectionController.setClient(savedClient);
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return { browser, document, beacons, requests, intervals,
    setBeaconResult(value) { beaconResult = value; },
    setBeaconFailure(value) { beaconFailure = value; },
    connect: async () => {
      let calls = 0;
      ConnectionController.setClient({ async connectExternal(options) {
        calls++; assert.equal(options.id, 'synthetic-email-wallet'); return { address: syntheticAddress };
      } });
      const result = await ConnectionController.connectExternal({ id: 'synthetic-email-wallet', type: 'AUTH' }, 'eip155', false);
      assert.equal(calls, 1); assert.equal(result.address, syntheticAddress);
    },
  };
}

function assertSyntheticBatch(beacon, eventNames) {
  const url = new URL(beacon.url);
  assert.equal(url.origin, 'https://pulse.walletconnect.org');
  assert.equal(url.pathname, '/batch');
  assert.equal(url.searchParams.get('projectId'), syntheticProjectId);
  assert.equal(url.searchParams.get('st'), 'appkit');
  assert.equal(url.searchParams.get('sv'), 'react-ethers-1.8.24');
  assert.deepEqual(beacon.body.map(event => event.props.event), eventNames);
  for (const event of beacon.body) {
    assert.equal(event.domain, 'analytics.example.test');
    assert.equal(event.url, 'https://analytics.example.test/dashboard');
    assert.equal(event.props.address, syntheticAddress);
    assert.equal(event.props.properties.caipNetworkId, 'eip155:137');
    assert.match(event.eventId, /^[a-f0-9-]{36}$/i);
  }
}

test('installed SDK optional analytics is disabled at false and batches to its real transport at true', t => {
  const h = fixture(t, false);
  EventsController.sendEvent(optionalEvent); EventsController._submitPendingEvents();
  assert.equal(h.beacons.length, 0); assert.equal(EventsController.state.pendingEvents.length, 0);
  OptionsController.setFeatures({ analytics: true });
  EventsController.sendEvent(optionalEvent);
  assert.equal(h.beacons.length, 0, 'enqueueing is not a transport acknowledgement');
  assert.equal(EventsController.state.pendingEvents.length, 1);
  EventsController._submitPendingEvents();
  assert.equal(h.beacons.length, 1); assertSyntheticBatch(h.beacons[0], ['MODAL_OPEN']);
  assert.equal(EventsController.state.pendingEvents.length, 0); assert.equal(h.requests.length, 0);
});

for (const analytics of [false, true]) {
  test(`a real installed SDK connection controller emits mandatory CONNECT_SUCCESS when analytics=${analytics}`, async t => {
    const h = fixture(t, analytics); await h.connect();
    assert.equal(h.beacons.length, 0); assert.equal(EventsController.state.pendingEvents.length, 1);
    EventsController._submitPendingEvents();
    assert.equal(h.beacons.length, 1); assertSyntheticBatch(h.beacons[0], ['CONNECT_SUCCESS']);
    assert.equal(h.beacons[0].body[0].props.properties.method, 'email');
    assert.equal(h.requests.length, 0);
  });
}

test('SDK capability prefetch is gated by the local analytics flag and a remote denial disables only optional events', async t => {
  const h = fixture(t, false);
  ApiController.prefetchAnalyticsConfig(); assert.equal(h.requests.length, 0);
  let reads = 0;
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    reads++; const url = new URL(input);
    assert.equal(url.origin, 'https://api.web3modal.org');
    assert.equal(url.pathname, '/getAnalyticsConfig'); assert.equal(options.method, 'GET');
    assert.equal(url.searchParams.get('projectId'), syntheticProjectId);
    return Response.json({ isAnalyticsEnabled: false });
  });
  OptionsController.setFeatures({ analytics: true }); await ApiController.fetchAnalyticsConfig();
  assert.equal(reads, 1); assert.equal(OptionsController.state.features.analytics, false);
  EventsController.sendEvent(optionalEvent); assert.equal(EventsController.state.pendingEvents.length, 0);
  await h.connect(); EventsController._submitPendingEvents();
  assertSyntheticBatch(h.beacons[0], ['CONNECT_SUCCESS']);
});

test('a pending SDK capability response may disable future optional events but does not erase an already queued event', async t => {
  const h = fixture(t, true); let finish, reads = 0;
  t.mock.method(globalThis, 'fetch', () => { reads++; return new Promise(resolve => { finish = resolve; }); });
  const configuration = ApiController.fetchAnalyticsConfig();
  EventsController.sendEvent(optionalEvent); assert.equal(EventsController.state.pendingEvents.length, 1);
  finish(Response.json({ isAnalyticsEnabled: false })); await configuration;
  assert.equal(reads, 1); assert.equal(OptionsController.state.features.analytics, false);
  EventsController.sendEvent(optionalEvent); assert.equal(EventsController.state.pendingEvents.length, 1);
  EventsController._submitPendingEvents(); assertSyntheticBatch(h.beacons[0], ['MODAL_OPEN']);
});

test('SDK capability network failure disables optional analytics without retrying or disabling mandatory connection events', async t => {
  const h = fixture(t, true); let reads = 0;
  t.mock.method(globalThis, 'fetch', async () => { reads++; throw new TypeError('synthetic offline'); });
  await ApiController.fetchAnalyticsConfig(); assert.equal(reads, 1);
  assert.equal(OptionsController.state.features.analytics, false);
  EventsController.sendEvent(optionalEvent); assert.equal(EventsController.state.pendingEvents.length, 0);
  await h.connect(); EventsController._submitPendingEvents(); assertSyntheticBatch(h.beacons[0], ['CONNECT_SUCCESS']);
  assert.equal(reads, 1);
});

test('installed SDK flushes on one periodic subscription and browser lifecycle triggers', t => {
  const h = fixture(t, true);
  EventsController.sendEvent(optionalEvent); EventsController.sendEvent(optionalEvent);
  assert.equal(h.intervals.length, 1); assert.equal(h.intervals[0].delay, 10_000);
  h.intervals[0].callback(); assert.equal(h.beacons.length, 1);
  assertSyntheticBatch(h.beacons[0], ['MODAL_OPEN', 'MODAL_OPEN']);
  for (const [target, type] of [[h.browser, 'pagehide'], [h.document, 'freeze'], [h.document, 'visibilitychange']]) {
    EventsController.sendEvent(optionalEvent);
    if (type === 'visibilitychange') h.document.visibilityState = 'hidden';
    target.dispatchEvent(new Event(type));
  }
  assert.equal(h.beacons.length, 4); assert.equal(h.intervals.length, 1);
});

test('a false sendBeacon return still clears the SDK queue and cannot prove telemetry ingestion or trigger a replay', t => {
  const h = fixture(t, true); h.setBeaconResult(false);
  EventsController.sendEvent(optionalEvent); EventsController._submitPendingEvents();
  assert.equal(h.beacons.length, 1); assert.equal(EventsController.state.pendingEvents.length, 0);
  EventsController._submitPendingEvents(); assert.equal(h.beacons.length, 1);
  assert.equal(EventsController.state.reportedErrors.FORBIDDEN, false);
});

test('a thrown beacon exception retains the SDK batch for a later SDK trigger without adding synthetic events', t => {
  const h = fixture(t, true); h.setBeaconFailure(true);
  EventsController.sendEvent(optionalEvent); const queuedId = EventsController.state.pendingEvents[0].eventId;
  EventsController._submitPendingEvents();
  assert.equal(h.beacons.length, 0); assert.equal(EventsController.state.pendingEvents.length, 1);
  assert.equal(EventsController.state.reportedErrors.FORBIDDEN, true);
  h.setBeaconFailure(false); EventsController._submitPendingEvents();
  assert.equal(h.beacons.length, 1); assert.equal(h.beacons[0].body[0].eventId, queuedId);
  assert.equal(EventsController.state.pendingEvents.length, 0);
});

test('enabling analytics never replays existing wallets and real repeat connection events retain distinct event identifiers', async t => {
  const h = fixture(t, false); OptionsController.setFeatures({ analytics: true });
  EventsController._submitPendingEvents(); assert.equal(h.beacons.length, 0);
  await h.connect(); await h.connect(); EventsController._submitPendingEvents();
  assertSyntheticBatch(h.beacons[0], ['CONNECT_SUCCESS', 'CONNECT_SUCCESS']);
  assert.equal(new Set(h.beacons[0].body.map(event => event.eventId)).size, 2);
});
