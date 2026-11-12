import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConstantsUtil as ReownConstantsUtil } from '@reown/appkit-common';
import { ConnectionController, OptionsController } from '@reown/appkit-controllers';
import { useDisconnect } from '@reown/appkit-controllers/react';
import { createReownWalletSwitchRequest } from './reown-wallet-connection.mjs';

const AUTH = ReownConstantsUtil.CONNECTOR_ID.AUTH;
const tick = () => new Promise(resolve => setImmediate(resolve));
function sourceCallback(path, name, sdk = false) {
  const source = ts.createSourceFile(path, readFileSync(new URL(path, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  let found;
  const visit = node => {
    if (sdk && name !== 'disconnect' && ts.isMethodDeclaration(node) && node.name.getText(source) === name) found = node;
    else if (sdk && name === 'disconnect' && ts.isMethodDeclaration(node) && node.name.getText(source) === 'createClients') {
      const property = node.body.statements.find(statement => ts.isExpressionStatement(statement)
        && ts.isBinaryExpression(statement.expression) && statement.expression.left.getText(source) === 'this.connectionControllerClient');
      found = property.expression.right.properties.find(property => property.name?.getText(source) === name).initializer;
    } else if (!sdk && ts.isFunctionDeclaration(node) && node.name?.getText(source) === name) found = node;
    else if (!sdk && ts.isVariableDeclaration(node) && node.name.getText(source) === name && ts.isCallExpression(node.initializer)) found = node.initializer.arguments[0];
    if (!found) ts.forEachChild(node, visit);
  };
  visit(source); assert.ok(found, `Missing production callback ${name}`);
  return found.getText(source);
}
const providerCallback = (name, scope) => vm.runInNewContext(`(${sourceCallback('../components/reown/ReownProvider.jsx', name)})`, scope);
function observation({ timedOut = false, switching = false, onUpdate = () => {} } = {}) {
  const source = ts.createSourceFile('provider.jsx', readFileSync(new URL('../components/reown/ReownProvider.jsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  const scope = { sdkConnectionStatus: 'restoring', restorationTimedOut: timedOut, walletSwitching: switching,
    currentAddress: '', appKitState: { open: false }, account: { isConnected: false, status: 'reconnecting' },
    connectionSnapshot: { current: null }, connectionRequest: { current: { update: onUpdate } }, switchRequest: { current: null } };
  let dependencyNode, effectNode;
  const visit = node => {
    if (ts.isVariableDeclaration(node) && ['restoredStatus', 'connectionStatus'].includes(node.name.getText(source))) scope[node.name.getText(source)] = vm.runInNewContext(node.initializer.getText(source), scope);
    if (ts.isBinaryExpression(node) && node.left.getText(source) === 'connectionSnapshot.current') vm.runInNewContext(node.getText(source), scope);
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useEffect' && node.arguments[0]?.getText(source).includes('connectionRequest.current?.update(connectionSnapshot.current)')) {
      effectNode = node.arguments[0]; dependencyNode = node.arguments[1];
    }
    ts.forEachChild(node, visit);
  };
  visit(source); assert.ok(effectNode); assert.ok(dependencyNode);
  return { snapshot: scope.connectionSnapshot.current, visibleStatus: scope.connectionStatus,
    dependencies: vm.runInNewContext(dependencyNode.getText(source), scope),
    update: vm.runInNewContext(`(${effectNode.getText(source)})`, scope) };
}

/** Actual installed controller and public disconnect hook, with the installed
 * SDK's disconnect policy and synthetic adapters. No wallet, storage or network. */
function sdk(t, { reject = false, delay, orphaned = false, initialReconnect = true, skipCleanup = false, hiddenAuth = true, legacyEvmActive = false } = {}) {
  const previous = new Map(ConnectionController.state.connections), previousClient = ConnectionController.state._client;
  const previousReconnect = OptionsController.state.enableReconnect, calls = [], optionWrites = [];
  OptionsController.setOptions({ enableReconnect: initialReconnect });
  ConnectionController.setConnections([], 'eip155');
  ConnectionController.setConnections([...(hiddenAuth ? [{ connectorId: AUTH, accounts: [] }] : []), { connectorId: 'unrelated-injected', accounts: [] }], 'solana');
  t.after(() => { ConnectionController.state.connections = previous; ConnectionController.state._client = previousClient;
    OptionsController.setOptions({ enableReconnect: previousReconnect }); });
  const scope = {
    ConstantsUtil: ReownConstantsUtil,
    ChainController: { state: { activeChain: 'eip155', chains: new Map([['eip155', { accountState: legacyEvmActive ? { caipAddress: `eip155:137:0x${'2'.repeat(40)}` } : {} }],
      ['solana', { accountState: orphaned ? {} : { caipAddress: 'solana:synthetic:account' } }]]) } },
    OptionsController,
    ConnectorController: { getConnectorId: namespace => ConnectionController.getConnections(namespace)[0]?.connectorId, setFilterByNamespace() {} },
    ConnectionController: { resetWcConnection() {}, syncStorageConnections() {} },
    SendController: { resetSend() {} }, SIWXUtil: { getSIWX: () => undefined },
    StorageUtil: { deleteConnectedSocialProvider() {}, addDisconnectedConnectorId() {} },
    EventsController: { sendEvent() {} },
  };
  const factory = vm.runInNewContext(`(function () { return (${sourceCallback('../../node_modules/@reown/appkit/dist/esm/src/client/appkit-base-client.js', 'disconnect', true)}); })`, scope);
  const adapterReset = vm.runInNewContext(`({${sourceCallback('../../node_modules/@reown/appkit/dist/esm/src/client/appkit-base-client.js', 'disconnectConnector', true)}}).disconnectConnector`, scope);
  const updateOptions = vm.runInNewContext(`({${sourceCallback('../../node_modules/@reown/appkit/dist/esm/src/client/appkit-base-client.js', 'updateOptions', true)}}).updateOptions`, scope);
  const client = { setLoading() {}, onDisconnectNamespace() {}, getAdapter(namespace) { return { async disconnect({ id }) {
    calls.push({ namespace, id, reconnectAtGuard: OptionsController.state.enableReconnect }); if (delay) await delay;
    if (reject) throw new Error('synthetic cleanup failure');
    const existing = ConnectionController.getConnections(namespace), removed = existing.filter(connection => !id || connection.connectorId === id);
    if (!skipCleanup) {
      ConnectionController.setConnections(existing.filter(connection => id && connection.connectorId !== id), namespace);
      scope.ChainController.state.chains.get(namespace).accountState = {};
    }
    return { connections: removed };
  } }; } };
  client.disconnectConnector = adapterReset.bind(client);
  const nativeDisconnect = factory.call(client);
  ConnectionController.setClient({ disconnect: nativeDisconnect });
  let disconnect;
  function DisconnectProbe() { disconnect = useDisconnect().disconnect; return null; }
  renderToStaticMarkup(createElement(DisconnectProbe));
  return { calls, disconnect, optionWrites, hasLegacyEvmAccount: () => Boolean(scope.ChainController.state.chains.get('eip155').accountState.caipAddress),
    appKit: { updateOptions(options) { optionWrites.push(options.enableReconnect); updateOptions(options); } } };
}
function recovery(t, options = {}) {
  const native = sdk(t, options), calls = [], ref = current => ({ current });
  const scope = { ConnectionController, OptionsController, ReownConstantsUtil, appKitInstance: native.appKit, createReownWalletSwitchRequest, DOMException,
    ownerKey: 'synthetic-owner', latestOwner: ref('synthetic-owner'), mounted: ref(true), logoutStarted: ref(false),
    connectionSnapshot: ref({ status: 'disconnected', disconnected: true, modalOpen: false, address: '' }),
    switchRequest: ref(null), connectionRequest: ref(null), selectedCandidate: ref(null), onrampIntent: ref(false),
    onrampSelection: ref(null), onrampOperation: ref(null), linkingOperation: ref(null),
    walletIdentityMismatch: false, walletNeedsAccountSelection: false,
    boundAddress: '',
    setWalletSwitching() {}, setConnectionBusy() {}, setVerificationError() {}, setSelectionRevision() {},
    isAddress: value => typeof value === 'string' && /^0x[0-9a-f]{40}$/.test(value),
    disconnect: native.disconnect, open: async () => { calls.push('open'); assert.equal(ConnectionController.hasAnyConnection(AUTH), false);
      assert.equal(native.hasLegacyEvmAccount(), false, 'a cached foreign SDK account must be disconnected before Connect'); },
    createReownWalletConnectionRequest: () => assert.fail('A stale shared AUTH connection must reset before opening Connect'),
  };
  scope.disconnectSharedAuthWallet = providerCallback('disconnectSharedAuthWallet', scope);
  scope.chooseWallet = providerCallback('chooseWallet', scope);
  const connect = providerCallback('connectWallet', scope);
  t.after(() => scope.switchRequest.current?.cancel());
  return { native, calls, scope, connect, choose: scope.chooseWallet, finish() {
    scope.connectionSnapshot.current = { status: 'connected', disconnected: false, modalOpen: false, address: `0x${'1'.repeat(40)}` };
    scope.switchRequest.current?.update(scope.connectionSnapshot.current);
  } };
}

test('the installed SDK disables auth widgets for a hidden Solana AUTH session even when EVM has no connection', async t => {
  const native = sdk(t);
  assert.equal(ConnectionController.getConnections('eip155').length, 0);
  assert.equal(ConnectionController.hasAnyConnection(AUTH), true);
  await native.disconnect({ id: AUTH });
  assert.equal(ConnectionController.hasAnyConnection(AUTH), false);
  assert.deepEqual(native.calls.map(call => ({ ...call })), [{ namespace: 'solana', id: AUTH, reconnectAtGuard: true }]);
  assert.equal(ConnectionController.getConnections('solana')[0]?.connectorId, 'unrelated-injected');
});

test('real provider recovery resets hidden shared AUTH before Connect, without disconnecting an unrelated wallet', async t => {
  const h = recovery(t), pending = h.connect();
  await tick(); await tick();
  assert.equal(ConnectionController.hasAnyConnection(AUTH), false);
  assert.deepEqual(h.calls, ['open']); assert.equal(h.native.calls.length, 2);
  assert.ok(h.native.calls.every(call => call.id === AUTH && call.reconnectAtGuard === false));
  assert.deepEqual(h.native.optionWrites, [false, true]); assert.equal(OptionsController.state.enableReconnect, true);
  assert.equal(ConnectionController.getConnections('solana')[0]?.connectorId, 'unrelated-injected');
  h.finish(); assert.deepEqual(await pending, { connected: true });
});

test('a bound disconnected wallet resets a cached foreign EVM account even when the AUTH connection map is empty', async t => {
  const h = recovery(t, { hiddenAuth: false, legacyEvmActive: true });
  h.scope.boundAddress = `0x${'1'.repeat(40)}`;
  assert.equal(ConnectionController.hasAnyConnection(AUTH), false); assert.equal(h.native.hasLegacyEvmAccount(), true);
  const pending = h.connect(); await tick(); await tick();
  assert.deepEqual(h.native.calls.map(call => ({ ...call })), [{ namespace: 'eip155', id: undefined, reconnectAtGuard: true }]);
  assert.equal(h.native.hasLegacyEvmAccount(), false); assert.deepEqual(h.calls, ['open']);
  assert.deepEqual(h.native.optionWrites, []); assert.equal(ConnectionController.getConnections('solana')[0]?.connectorId, 'unrelated-injected');
  h.finish(); await pending;
});

test('a new unlinked wallet delegates a safe empty SDK reset and opens Connect without calling an unattached adapter', async t => {
  const h = recovery(t, { hiddenAuth: false });
  h.scope.walletNeedsAccountSelection = true;
  const pending = h.connect(); await tick(); await tick();
  assert.deepEqual(h.native.calls, []); assert.deepEqual(h.calls, ['open']); assert.deepEqual(h.native.optionWrites, []);
  h.finish(); await pending;
});

test('a timed-out SDK restoration uses the disconnected observation for explicit recovery even while the recovery UI is busy', async t => {
  const before = observation();
  assert.equal(before.snapshot.status, 'restoring'); assert.equal(before.snapshot.disconnected, false);
  for (const switching of [false, true]) {
    const h = recovery(t), after = observation({ timedOut: true, switching });
    assert.equal(after.visibleStatus, switching ? 'restoring' : 'disconnected');
    assert.equal(after.snapshot.status, 'disconnected'); assert.equal(after.snapshot.disconnected, true);
    assert.deepEqual(h.native.calls, []); assert.deepEqual(h.calls, [], 'a timeout alone must not connect or authenticate');
    h.scope.connectionSnapshot.current = after.snapshot;
    const pending = h.connect(); await tick(); await tick();
    assert.equal(ConnectionController.hasAnyConnection(AUTH), false); assert.deepEqual(h.calls, ['open']);
    assert.equal(h.native.calls.length, 2); h.finish(); await pending;
  }
});

test('the restoration deadline updates existing connection requests even when the raw SDK status never changes', () => {
  const updates = [], first = observation({ onUpdate: snapshot => updates.push(snapshot.status) });
  first.update();
  const timedOut = observation({ timedOut: true, onUpdate: snapshot => updates.push(snapshot.status) });
  const changed = first.dependencies.some((value, index) => value !== timedOut.dependencies[index]);
  assert.equal(changed, true, 'the effective restoration timeout must be a React effect dependency');
  if (changed) timedOut.update();
  assert.deepEqual(updates, ['restoring', 'disconnected']);
});

test('explicit recovery shares one pending cleanup and cannot open Connect if cleanup fails', async t => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const h = recovery(t, { delay: gate }), first = h.choose(), second = h.choose();
  assert.equal(first, second); await tick(); assert.equal(h.native.calls.length, 2); assert.deepEqual(h.calls, []);
  assert.equal(OptionsController.state.enableReconnect, true, 'the option must already be restored while adapters are pending');
  release(); await tick(); await tick(); h.finish(); await first;
  assert.deepEqual(h.calls, ['open']);
  const failed = recovery(t, { reject: true });
  await assert.rejects(failed.choose(), { message: 'Failed to disconnect' });
  assert.deepEqual(failed.calls, []); assert.equal(ConnectionController.hasAnyConnection(AUTH), true);
  assert.equal(OptionsController.state.enableReconnect, true); assert.deepEqual(failed.native.optionWrites, [false, true]);
});

test('the public options bracket clears orphaned AUTH despite missing caipAddress and preserves unrelated wallets', async t => {
  const h = recovery(t, { orphaned: true });
  const pending = h.choose(); await tick(); await tick();
  assert.equal(ConnectionController.hasAnyConnection(AUTH), false); assert.deepEqual(h.calls, ['open']);
  assert.ok(h.native.calls.every(call => call.reconnectAtGuard === false && call.id === AUTH));
  assert.equal(ConnectionController.getConnections('solana')[0]?.connectorId, 'unrelated-injected');
  assert.deepEqual(h.native.optionWrites, [false, true]); assert.equal(OptionsController.state.enableReconnect, true);
  h.finish(); await pending;
});

test('a provider acknowledgement without actual AUTH cleanup cannot open another disabled Connect view', async t => {
  const h = recovery(t, { orphaned: true, skipCleanup: true });
  await assert.rejects(h.choose(), { message: 'wallet_not_connected' });
  assert.equal(h.native.calls.length, 2); assert.deepEqual(h.calls, []);
  assert.equal(ConnectionController.hasAnyConnection(AUTH), true);
  assert.equal(OptionsController.state.enableReconnect, true);
});

test('synchronous disconnect failure restores the prior option and never opens Connect', async t => {
  const h = recovery(t, { orphaned: true });
  h.scope.disconnect = () => { throw new Error('synthetic synchronous reset failure'); };
  await assert.rejects(h.choose(), { message: 'synthetic synchronous reset failure' });
  assert.equal(OptionsController.state.enableReconnect, true); assert.deepEqual(h.native.optionWrites, [false, true]);
  assert.deepEqual(h.native.calls, []); assert.deepEqual(h.calls, []);
});

test('a previously disabled reconnect option is restored exactly after explicit AUTH cleanup', async t => {
  const h = recovery(t, { orphaned: true, initialReconnect: false });
  const pending = h.choose(); await tick(); await tick();
  assert.equal(OptionsController.state.enableReconnect, false); assert.deepEqual(h.native.optionWrites, [false, false]);
  assert.deepEqual(h.calls, ['open']); h.finish(); await pending;
});

test('a hung or late SDK cleanup restores options immediately and cannot reopen auth after owner ABA or logout', async t => {
  for (const boundary of ['owner-aba', 'logout']) {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const h = recovery(t, { orphaned: true, delay: gate }), pending = h.choose(), cancelled = assert.rejects(pending, { name: 'AbortError' });
    await tick(); assert.equal(OptionsController.state.enableReconnect, true);
    assert.deepEqual(h.native.optionWrites, [false, true]); assert.deepEqual(h.calls, []);
    if (boundary === 'owner-aba') h.scope.latestOwner.current = 'other-owner';
    else h.scope.logoutStarted.current = true;
    h.scope.switchRequest.current.cancel(); await cancelled;
    if (boundary === 'owner-aba') h.scope.latestOwner.current = h.scope.ownerKey;
    release(); await tick(); await tick();
    assert.equal(OptionsController.state.enableReconnect, true); assert.deepEqual(h.calls, []);
  }
});

test('normal connected EVM and closed owner/logout boundaries never reset another SDK session', async t => {
  const h = recovery(t);
  h.scope.boundAddress = `0x${'1'.repeat(40)}`;
  h.scope.connectionSnapshot.current = { status: 'connected', disconnected: false, address: `0x${'1'.repeat(40)}` };
  assert.equal((await h.connect()).connected, true); assert.deepEqual(h.native.calls, []); assert.deepEqual(h.calls, []);
  for (const boundary of ['owner', 'unmounted', 'logout']) {
    h.scope.latestOwner.current = boundary === 'owner' ? 'other-owner' : h.scope.ownerKey;
    h.scope.mounted.current = boundary !== 'unmounted'; h.scope.logoutStarted.current = boundary === 'logout';
    await assert.rejects(h.choose(), { name: 'AbortError' });
  }
  assert.deepEqual(h.native.calls, []); assert.deepEqual(h.calls, []);
});
