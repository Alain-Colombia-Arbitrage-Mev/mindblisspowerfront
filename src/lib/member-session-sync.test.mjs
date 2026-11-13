import assert from 'node:assert/strict';
import test from 'node:test';
import { publishMemberSessionReplacement, subscribeMemberSessionReplacement } from './member-session-sync.mjs';

const channelName = 'mindbliss.member-session.v1';
const firstMessage = 'confirmed-session-v1:11111111-1111-4111-8111-111111111111';
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

test('confirmed session replacement shares no identity and coalesces the same event across browser transports', () => {
  const network = hub(), first = network.browser(), second = network.browser(), local = [], remote = [];
  const stopLocal = subscribeMemberSessionReplacement(event => local.push(event), first.tab);
  const stopRemote = subscribeMemberSessionReplacement(event => remote.push(event), second.tab);
  publishMemberSessionReplacement(first.tab);
  assert.deepEqual(local, [{ local: true }]); assert.deepEqual(remote, [{ local: false }]);
  assert.equal(network.outgoing.length, 3);
  const [broadcast, storage, remove] = network.outgoing;
  assert.equal(broadcast.name, channelName); assert.equal(storage.key, channelName);
  assert.equal(broadcast.value, storage.value); assert.match(storage.value, /^confirmed-session-v1:[0-9a-f-]{36}$/);
  assert.deepEqual(remove, { transport: 'storage-remove', key: channelName });
  assert.doesNotMatch(JSON.stringify(network.outgoing), /email|subject|token|wallet|amount|@/i);
  publishMemberSessionReplacement(first.tab);
  assert.equal(local.length, 2); assert.equal(remote.length, 2, 'a later replacement must still retire a restored view');
  stopLocal(); stopRemote(); assert.ok(network.channels.every(channel => channel.closed));
});

test('replacement signals survive denied storage or channels without requiring a browser', () => {
  for (const options of [{ broadcast: false }, { brokenChannel: true }, { storage: false }]) {
    const network = hub(), first = network.browser(options), second = network.browser(options), received = [];
    const stop = subscribeMemberSessionReplacement(event => received.push(event), second.tab);
    publishMemberSessionReplacement(first.tab); assert.deepEqual(received, [{ local: false }]); stop();
  }
  const network = hub(), isolated = network.browser({ broadcast: false, storage: false }); let count = 0;
  const stop = subscribeMemberSessionReplacement(() => count++, isolated.tab);
  publishMemberSessionReplacement(isolated.tab); assert.equal(count, 1); stop();
  assert.doesNotThrow(() => { subscribeMemberSessionReplacement(() => assert.fail('no browser'), null)(); publishMemberSessionReplacement(null); });
});

test('invalid or repeated messages cannot cause repeated owner checks and subscribers are independently cleaned', () => {
  const network = hub(), current = network.browser(), events = [];
  const stopFirst = subscribeMemberSessionReplacement(() => events.push('first'), current.tab);
  const stopSecond = subscribeMemberSessionReplacement(() => events.push('second'), current.tab);
  const receiver = network.channels[0];
  for (const data of [null, {}, { message: firstMessage }, [firstMessage], 'confirmed-session-v1', `${firstMessage}:extra`]) receiver.onmessage({ data });
  current.storageEvent('another-key', firstMessage); assert.deepEqual(events, []);
  receiver.onmessage({ data: firstMessage }); current.storageEvent(channelName, firstMessage);
  assert.deepEqual(events, ['first', 'second']); stopFirst(); assert.equal(receiver.closed, false);
  current.storageEvent(channelName, 'confirmed-session-v1:22222222-2222-4222-8222-222222222222');
  assert.deepEqual(events, ['first', 'second', 'second']); stopSecond(); assert.equal(receiver.closed, true);
});
