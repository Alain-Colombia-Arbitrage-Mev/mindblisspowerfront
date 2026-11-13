import assert from 'node:assert/strict';
import test from 'node:test';
import { copyWalletAddress, createWalletAddressClipboard, isCopyableWalletAddress } from './wallet-address-clipboard.mjs';

const address = `0x${'1'.repeat(40)}`;
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
function documentFixture(success = true) {
  const calls = [], range = { cloneRange() { return this; } }, selection = { rangeCount: 1, getRangeAt: () => range,
    removeAllRanges: () => calls.push('clear ranges'), addRange: value => { assert.equal(value, range); calls.push('restore range'); } };
  const active = { selectionStart: 2, selectionEnd: 5, selectionDirection: 'backward',
    focus: () => calls.push('restore focus'), setSelectionRange: (...args) => calls.push(['restore selection', ...args]) };
  const field = { style: {}, setAttribute: (...args) => calls.push(args), select: () => calls.push('select'),
    setSelectionRange: (...args) => calls.push(['select range', ...args]), remove: () => calls.push('remove') };
  const document = { activeElement: active, getSelection: () => selection, createElement: type => { assert.equal(type, 'textarea'); return field; },
    body: { appendChild: value => { assert.equal(value, field); calls.push('append'); } }, execCommand: action => { assert.equal(action, 'copy'); calls.push(['copy', field.value]); return success; } };
  return { document, calls, field };
}

test('only exact visible EVM addresses are accepted, not links, truncated labels or arbitrary text', async () => {
  assert.equal(isCopyableWalletAddress(address), true);
  for (const value of ['', '0x0000000000000000000000000000000000000000', `${address} `, `ethereum:${address}`, '0x111…111', 'secret', null]) {
    assert.equal(isCopyableWalletAddress(value), false);
    assert.equal(await copyWalletAddress(value, { navigator: { clipboard: { writeText: () => assert.fail('invalid input written') } } }), 'cancelled');
  }
});

test('native clipboard success copies exactly one full address without fallback or permissions requests', async () => {
  const copied = [], native = { clipboard: { writeText: async value => copied.push(value) } };
  assert.equal(await copyWalletAddress(address, { navigator: native, document: { createElement: () => assert.fail('unnecessary fallback') } }), 'copied');
  assert.deepEqual(copied, [address]);
});

test('missing and browser-denied clipboard use one selection fallback and restore selection/focus', async () => {
  for (const navigator of [undefined, {}, { clipboard: {} }, { clipboard: { writeText: async () => { throw new Error('private-browser-reason'); } } }, { get clipboard() { throw new Error('denied getter'); } }]) {
    const fixture = documentFixture();
    assert.equal(await copyWalletAddress(address, { navigator, document: fixture.document }), 'copied');
    assert.equal(fixture.field.value, address); assert.equal(fixture.field.readOnly, true);
    assert.deepEqual(fixture.calls.filter(value => Array.isArray(value) && value[0] === 'copy'), [['copy', address]]);
    assert.ok(fixture.calls.includes('remove')); assert.ok(fixture.calls.includes('restore focus'));
    assert.ok(fixture.calls.includes('restore range'));
    assert.deepEqual(fixture.calls.find(value => Array.isArray(value) && value[0] === 'restore selection'), ['restore selection', 2, 5, 'backward']);
  }
});

test('fallback denial, missing DOM, or exception returns failure and always removes temporary fields', async () => {
  const fixture = documentFixture(false);
  assert.equal(await copyWalletAddress(address, { navigator: {}, document: fixture.document }), 'error');
  assert.ok(fixture.calls.includes('remove'));
  fixture.document.execCommand = () => { throw new Error('private exception'); };
  assert.equal(await copyWalletAddress(address, { navigator: {}, document: fixture.document }), 'error');
  assert.equal(await copyWalletAddress(address, { navigator: {}, document: null }), 'error');
});

test('controller locks duplicate clicks, reports truthful pending/success, and never copies arbitrary overrides', async () => {
  const wait = deferred(), states = [], copied = [];
  const controller = createWalletAddressClipboard({ address, ownerKey: 'owner-A', isCurrent: () => true, onChange: value => states.push(value),
    environment: { navigator: { clipboard: { writeText: value => { copied.push(value); return wait.promise; } } } } });
  const first = controller.copy('arbitrary other input'); await controller.copy();
  assert.deepEqual(states, ['pending']); assert.deepEqual(copied, [address]);
  wait.resolve(); await first; assert.deepEqual(states, ['pending', 'copied']);
});

test('late native rejection after owner/address replacement never runs fallback or publishes feedback', async () => {
  const wait = deferred(), states = [], fixture = documentFixture(); let current = true;
  const controller = createWalletAddressClipboard({ address, ownerKey: 'owner-A', isCurrent: () => current, onChange: value => states.push(value),
    environment: { navigator: { clipboard: { writeText: () => wait.promise } }, document: fixture.document } });
  const action = controller.copy(); current = false; wait.reject(new Error('denied')); await action;
  await controller.copy(); assert.deepEqual(states, ['pending']); assert.deepEqual(fixture.calls, []);
});

test('disposed/unmounted controller cannot publish a late success or copy via a captured handler', async () => {
  const wait = deferred(), states = [], copied = [];
  const controller = createWalletAddressClipboard({ address, ownerKey: 'owner-A', isCurrent: () => true, onChange: value => states.push(value),
    environment: { navigator: { clipboard: { writeText: value => { copied.push(value); return wait.promise; } } } } });
  const captured = controller.copy, action = captured(); controller.dispose(); wait.resolve(); await action; await captured();
  assert.deepEqual(copied, [address]); assert.deepEqual(states, ['pending']);
  const absent = createWalletAddressClipboard({ address, ownerKey: '', isCurrent: () => true, onChange: () => assert.fail('ownerless feedback'),
    environment: { navigator: { clipboard: { writeText: () => assert.fail('ownerless copy') } } } }); await absent.copy();
});

test('an 8s native timeout shows manual-copy failure, prevents duplicate dispatch and ignores late success', async () => {
  const wait = deferred(), states = [], copied = [], timers = [], cancelled = [];
  const controller = createWalletAddressClipboard({ address, ownerKey: 'owner-A', isCurrent: () => true, onChange: value => states.push(value),
    schedule: (callback, milliseconds) => { timers.push({ callback, milliseconds }); return timers.length; }, cancel: id => cancelled.push(id),
    environment: { navigator: { clipboard: { writeText: value => { copied.push(value); return wait.promise; } } }, document: { createElement: () => assert.fail('no fallback after timeout') } } });
  const action = controller.copy(); assert.equal(timers[0].milliseconds, 8_000); timers[0].callback();
  assert.deepEqual(states, ['pending', 'error']); await controller.copy(); assert.deepEqual(copied, [address]);
  wait.resolve(); await action; assert.deepEqual(states, ['pending', 'error']); assert.ok(cancelled.includes(1));
});

test('a timed-out rejection cannot run fallback and dispose clears its deadline', async () => {
  const wait = deferred(), states = [], timers = [], cancelled = [];
  const controller = createWalletAddressClipboard({ address, ownerKey: 'owner-A', isCurrent: () => true, onChange: value => states.push(value),
    schedule: callback => { timers.push(callback); return 1; }, cancel: id => cancelled.push(id),
    environment: { navigator: { clipboard: { writeText: () => wait.promise } }, document: { createElement: () => assert.fail('late fallback') } } });
  const action = controller.copy(); timers[0](); controller.dispose(); assert.ok(cancelled.includes(1)); wait.reject(new Error('denied')); await action;
  assert.deepEqual(states, ['pending', 'error']);
});
