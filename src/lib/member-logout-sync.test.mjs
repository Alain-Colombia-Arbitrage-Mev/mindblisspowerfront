import assert from 'node:assert/strict';
import test from 'node:test';
import { publishMemberLogout, subscribeMemberLogout } from './member-logout-sync.mjs';

const channelName = 'mindbliss.member-logout.v1';
const literal = 'confirmed-logout-v1';
function hub() {
  const browsers = [], channels = [], outgoing = [];
  function browser({ broadcast = true, storage = true, brokenChannel = false } = {}) {
    const target = new EventTarget(), tab = { addEventListener: target.addEventListener.bind(target),
      removeEventListener: target.removeEventListener.bind(target), dispatchEvent: target.dispatchEvent.bind(target) };
    const storageEvent = (key, newValue) => {
      const event = new Event('storage'); Object.assign(event, { key, newValue }); target.dispatchEvent(event);
    };
    tab.localStorage = { setItem(key, value) {
      if (!storage) throw new Error('synthetic blocked storage'); outgoing.push({ transport: 'storage', key, value });
      for (const other of browsers) if (other.tab !== tab) other.storageEvent(key, value);
    }, removeItem(key) {
      if (!storage) throw new Error('synthetic blocked storage'); outgoing.push({ transport: 'storage-remove', key });
      for (const other of browsers) if (other.tab !== tab) other.storageEvent(key, null);
    } };
    if (broadcast) tab.BroadcastChannel = class {
      constructor(name) { if (brokenChannel) throw new Error('synthetic unavailable channel'); this.name = name; this.closed = false; channels.push(this); }
      postMessage(data) { outgoing.push({ transport: 'broadcast', name: this.name, value: data });
        for (const receiver of channels) if (receiver !== this && !receiver.closed && receiver.name === this.name) receiver.onmessage?.({ data }); }
      close() { this.closed = true; }
    };
    browsers.push({ tab, storageEvent });
    return { tab, storageEvent };
  }
  return { browser, channels, outgoing };
}

test('confirmed logout uses only closed literals across tabs and coalesces BroadcastChannel plus storage', () => {
  const network = hub(), first = network.browser(), second = network.browser(), local = [], remote = [];
  const unlistenLocal = subscribeMemberLogout(event => local.push(event), first.tab);
  const unlistenRemote = subscribeMemberLogout(event => remote.push(event), second.tab);
  publishMemberLogout(first.tab); publishMemberLogout(first.tab);
  assert.deepEqual(local, [{ local: true }]); assert.deepEqual(remote, [{ local: false }]);
  assert.equal(network.outgoing.length, 6);
  for (const event of network.outgoing) {
    if (event.transport === 'broadcast') assert.deepEqual(event, { transport: 'broadcast', name: channelName, value: literal });
    else if (event.transport === 'storage') assert.deepEqual(event, { transport: 'storage', key: channelName, value: literal });
    else assert.deepEqual(event, { transport: 'storage-remove', key: channelName });
  }
  assert.doesNotMatch(JSON.stringify(network.outgoing), /email|subject|token|wallet|amount|@/i);
  unlistenLocal(); unlistenRemote(); assert.ok(network.channels.every(channel => channel.closed));
});

test('storage fallback reaches another tab when BroadcastChannel is missing or fails', () => {
  for (const options of [{ broadcast: false }, { brokenChannel: true }]) {
    const network = hub(), first = network.browser(options), second = network.browser(options), notified = [];
    const stop = subscribeMemberLogout(event => notified.push(event), second.tab);
    publishMemberLogout(first.tab); assert.deepEqual(notified, [{ local: false }]); stop();
    assert.deepEqual(network.outgoing.map(event => event.transport), ['storage', 'storage-remove']);
  }
});

test('BroadcastChannel works with blocked storage and the local signal works with both transports missing', () => {
  const network = hub(), first = network.browser({ storage: false }), second = network.browser({ storage: false });
  let remote = 0, local = 0;
  const stopRemote = subscribeMemberLogout(() => remote++, second.tab);
  const stopLocal = subscribeMemberLogout(event => { assert.equal(event.local, true); local++; }, first.tab);
  publishMemberLogout(first.tab); assert.equal(remote, 1); assert.equal(local, 1);
  stopRemote(); stopLocal();
  const isolated = network.browser({ storage: false, broadcast: false }); let calls = 0;
  const stop = subscribeMemberLogout(event => { assert.equal(event.local, true); calls++; }, isolated.tab);
  publishMemberLogout(isolated.tab); assert.equal(calls, 1); stop();
});

test('untrusted message shapes and unrelated storage keys cannot retire a private document', () => {
  const network = hub(), current = network.browser(); let calls = 0;
  const stop = subscribeMemberLogout(() => calls++, current.tab), receiver = network.channels[0];
  for (const data of [null, {}, { message: literal }, ['confirmed-logout-v1'], 'logout', 'CONFIRMED-LOGOUT-V1']) receiver.onmessage({ data });
  for (const [key, value] of [['unrelated', literal], [channelName, null], [channelName, 'logout'], [channelName, { message: literal }]]) current.storageEvent(key, value);
  assert.equal(calls, 0); receiver.onmessage({ data: literal }); assert.equal(calls, 1); stop();
});

test('listener snapshots survive synchronous unsubscribe and exceptions, and the final unsubscribe releases resources', () => {
  const network = hub(), current = network.browser(), calls = [];
  let stopFirst, stopSecond;
  stopFirst = subscribeMemberLogout(() => { calls.push('first'); stopFirst(); stopSecond(); throw new Error('synthetic cleanup failure'); }, current.tab);
  stopSecond = subscribeMemberLogout(() => calls.push('second'), current.tab);
  assert.equal(network.channels.length, 1, 'all listeners in one document share one channel');
  publishMemberLogout(current.tab); assert.deepEqual(calls, ['first', 'second']);
  assert.equal(network.channels[0].closed, true);
  publishMemberLogout(current.tab); assert.deepEqual(calls, ['first', 'second']);
  assert.equal(network.channels.at(-1).closed, true, 'publishing without subscribers closes its temporary channel');
  const stopNew = subscribeMemberLogout(() => calls.push('new-document'), current.tab);
  publishMemberLogout(current.tab); assert.deepEqual(calls, ['first', 'second', 'new-document']); stopNew();
});

test('one unsubscribe leaves other listeners active; a missing browser is a harmless no-op', () => {
  const network = hub(), current = network.browser(), calls = [];
  const first = subscribeMemberLogout(() => calls.push('first'), current.tab);
  const second = subscribeMemberLogout(() => calls.push('second'), current.tab);
  first(); assert.equal(network.channels[0].closed, false);
  publishMemberLogout(current.tab); assert.deepEqual(calls, ['second']); second();
  assert.equal(network.channels[0].closed, true);
  const stop = subscribeMemberLogout(() => assert.fail('missing browser notification'), null); stop(); publishMemberLogout(null);
});
