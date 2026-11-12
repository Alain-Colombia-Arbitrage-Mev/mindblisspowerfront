import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConstantsUtil as ReownConstantsUtil } from '@reown/appkit-common';
import { ConnectionController } from '@reown/appkit-controllers';
import { useDisconnect } from '@reown/appkit-controllers/react';
import { createReownWalletSwitchRequest } from './reown-wallet-connection.mjs';

const AUTH = ReownConstantsUtil.CONNECTOR_ID.AUTH;
const tick = () => new Promise(resolve => setImmediate(resolve));
function sourceCallback(path, name, sdk = false) {
  const source = ts.createSourceFile(path, readFileSync(new URL(path, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  let found;
  const visit = node => {
    if (sdk && name === 'disconnectConnector' && ts.isMethodDeclaration(node) && node.name.getText(source) === name) found = node;
    else if (sdk && name === 'disconnect' && ts.isMethodDeclaration(node) && node.name.getText(source) === 'createClients') {
      const property = node.body.statements.find(statement => ts.isExpressionStatement(statement)
        && ts.isBinaryExpression(statement.expression) && statement.expression.left.getText(source) === 'this.connectionControllerClient');
      found = property.expression.right.properties.find(property => property.name?.getText(source) === name).initializer;
    } else if (!sdk && ts.isVariableDeclaration(node) && node.name.getText(source) === name && ts.isCallExpression(node.initializer)) found = node.initializer.arguments[0];
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
function sdk(t, { reject = false, delay, orphaned = false } = {}) {
  const previous = new Map(ConnectionController.state.connections), previousClient = ConnectionController.state._client;
  const calls = [];
  ConnectionController.setConnections([], 'eip155');
  ConnectionController.setConnections([{ connectorId: AUTH, accounts: [] }, { connectorId: 'unrelated-injected', accounts: [] }], 'solana');
  t.after(() => { ConnectionController.state.connections = previous; ConnectionController.state._client = previousClient; });
  const scope = {
    ConstantsUtil: ReownConstantsUtil,
    ChainController: { state: { activeChain: 'eip155', chains: new Map([['eip155', { accountState: {} }],
      ['solana', { accountState: orphaned ? {} : { caipAddress: 'solana:synthetic:account' } }]]) } },
    OptionsController: { state: { enableReconnect: true } },
    ConnectorController: { getConnectorId: namespace => ConnectionController.getConnections(namespace)[0]?.connectorId, setFilterByNamespace() {} },
    ConnectionController: { resetWcConnection() {}, syncStorageConnections() {} },
    SendController: { resetSend() {} }, SIWXUtil: { getSIWX: () => undefined },
    StorageUtil: { deleteConnectedSocialProvider() {}, addDisconnectedConnectorId() {} },
    EventsController: { sendEvent() {} },
  };
  const factory = vm.runInNewContext(`(function () { return (${sourceCallback('../../node_modules/@reown/appkit/dist/esm/src/client/appkit-base-client.js', 'disconnect', true)}); })`, scope);
  const adapterReset = vm.runInNewContext(`({${sourceCallback('../../node_modules/@reown/appkit/dist/esm/src/client/appkit-base-client.js', 'disconnectConnector', true)}}).disconnectConnector`, scope);
  const client = { setLoading() {}, onDisconnectNamespace() {}, getAdapter(namespace) { return { async disconnect({ id }) {
    calls.push({ namespace, id }); if (delay) await delay;
    if (reject) throw new Error('synthetic cleanup failure');
    const existing = ConnectionController.getConnections(namespace), removed = existing.filter(connection => !id || connection.connectorId === id);
    ConnectionController.setConnections(existing.filter(connection => id && connection.connectorId !== id), namespace);
    return { connections: removed };
  } }; } };
  client.disconnectConnector = adapterReset.bind(client);
  const nativeDisconnect = factory.call(client);
  ConnectionController.setClient({ disconnect: nativeDisconnect });
  let disconnect;
  function DisconnectProbe() { disconnect = useDisconnect().disconnect; return null; }
  renderToStaticMarkup(createElement(DisconnectProbe));
  return { calls, disconnect };
}
function recovery(t, options = {}) {
  const native = sdk(t, options), calls = [], ref = current => ({ current });
  const scope = { ConnectionController, ReownConstantsUtil, createReownWalletSwitchRequest, DOMException,
    ownerKey: 'synthetic-owner', latestOwner: ref('synthetic-owner'), mounted: ref(true), logoutStarted: ref(false),
    connectionSnapshot: ref({ status: 'disconnected', disconnected: true, modalOpen: false, address: '' }),
    switchRequest: ref(null), connectionRequest: ref(null), selectedCandidate: ref(null), onrampIntent: ref(false),
    onrampSelection: ref(null), onrampOperation: ref(null), linkingOperation: ref(null),
    walletIdentityMismatch: false, walletNeedsAccountSelection: false,
    setWalletSwitching() {}, setConnectionBusy() {}, setVerificationError() {}, setSelectionRevision() {},
    isAddress: value => typeof value === 'string' && /^0x[0-9a-f]{40}$/.test(value),
    disconnect: native.disconnect, open: async () => { calls.push('open'); assert.equal(ConnectionController.hasAnyConnection(AUTH), false); },
    createReownWalletConnectionRequest: () => assert.fail('A stale shared AUTH connection must reset before opening Connect'),
  };
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
  assert.deepEqual(native.calls.map(call => ({ ...call })), [{ namespace: 'solana', id: AUTH }]);
  assert.equal(ConnectionController.getConnections('solana')[0]?.connectorId, 'unrelated-injected');
});

test('real provider recovery resets hidden shared AUTH before Connect, without disconnecting an unrelated wallet', async t => {
  const h = recovery(t), pending = h.connect();
  await tick(); await tick();
  assert.equal(ConnectionController.hasAnyConnection(AUTH), false);
  assert.deepEqual(h.calls, ['open']); assert.equal(h.native.calls.length, 1);
  assert.equal(ConnectionController.getConnections('solana')[0]?.connectorId, 'unrelated-injected');
  h.finish(); assert.deepEqual(await pending, { connected: true });
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
    assert.equal(h.native.calls.length, 1); h.finish(); await pending;
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
  assert.equal(first, second); await tick(); assert.equal(h.native.calls.length, 1); assert.deepEqual(h.calls, []);
  release(); await tick(); await tick(); h.finish(); await first;
  assert.deepEqual(h.calls, ['open']);
  const failed = recovery(t, { reject: true });
  await assert.rejects(failed.choose(), { message: 'Failed to disconnect' });
  assert.deepEqual(failed.calls, []); assert.equal(ConnectionController.hasAnyConnection(AUTH), true);
});

test('an orphaned SDK AUTH entry cannot reopen another disabled Connect view when the SDK reports reset without clearing it', async t => {
  const h = recovery(t, { orphaned: true });
  await assert.rejects(h.choose(), { message: 'wallet_not_connected' });
  assert.deepEqual(h.native.calls, []); assert.deepEqual(h.calls, []);
  assert.equal(ConnectionController.hasAnyConnection(AUTH), true);
});

test('normal connected EVM and closed owner/logout boundaries never reset another SDK session', async t => {
  const h = recovery(t);
  h.scope.connectionSnapshot.current = { status: 'connected', disconnected: false, address: `0x${'1'.repeat(40)}` };
  assert.equal((await h.connect()).connected, true); assert.deepEqual(h.native.calls, []); assert.deepEqual(h.calls, []);
  for (const boundary of ['owner', 'unmounted', 'logout']) {
    h.scope.latestOwner.current = boundary === 'owner' ? 'other-owner' : h.scope.ownerKey;
    h.scope.mounted.current = boundary !== 'unmounted'; h.scope.logoutStarted.current = boundary === 'logout';
    await assert.rejects(h.choose(), { name: 'AbortError' });
  }
  assert.deepEqual(h.native.calls, []); assert.deepEqual(h.calls, []);
});
