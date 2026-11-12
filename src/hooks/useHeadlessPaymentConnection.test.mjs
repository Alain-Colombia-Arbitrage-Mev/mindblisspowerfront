import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { createHeadlessPaymentConnection } from '../lib/reown-headless-payment.mjs';

function harness() {
  const cells = [], effects = [], calls = [];
  let cursor = 0, dirty = true, value, snapshot = { owner: 'A', generation: 0, live: true, available: true,
    email: 'a@example.test', linkStatus: 'unlinked', linkedAddress: '', address: '', isConnected: false, providerReady: false, candidate: false };
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]));
  const hooks = {
    useRef(initial) { return cells[cursor++] ??= { current: initial }; },
    useState(initial) { const cell = cells[cursor++] ??= { value: initial };
      cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update;
        if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } }; return [cell.value, cell.set]; },
    useCallback(callback, deps) { const cell = cells[cursor++] ??= {};
      if (changed(cell.deps, deps)) { cell.deps = deps; cell.value = callback; } return cell.value; },
    useEffect(effect, deps) { const cell = cells[cursor++] ??= {};
      if (changed(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = effect(); }); } },
  };
  const services = {
    async reset() { calls.push('reset'); }, async fetchWallets() { calls.push('wallets'); },
    async requestEmail(email) { calls.push(['email', email]); return { action: 'VERIFY_OTP' }; },
    async verifyEmail() { calls.push('otp'); }, async confirmDevice() { calls.push('device'); },
    async connectSocial() { calls.push('social'); }, async connectExternal() { calls.push('external'); },
    async openNative() { calls.push('native'); }, cleanup() { calls.push('cleanup'); },
    markCandidate() { assert.fail('No provider connection may be fabricated'); },
    async link() { assert.fail('No ownership proof may occur in these tests'); },
  };
  const module = { exports: {} }, code = ts.transpileModule(readFileSync(new URL('useHeadlessPaymentConnection.jsx', import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'react') return hooks;
    if (name === '@/lib/reown-headless-payment.mjs') return { createHeadlessPaymentConnection };
    assert.fail(`Unexpected Headless hook dependency: ${name}`);
  }, module, module.exports);
  function render() { cursor = 0; dirty = false; value = module.exports.useHeadlessPaymentConnection({ read: () => snapshot, services }); return value; }
  return { calls, get value() { return value; },
    render, owner(owner, generation) { snapshot = { ...snapshot, owner, generation, email: `${owner.toLowerCase()}@example.test` }; return render(); },
    async flush() { for (let turn = 0, quiet = 0; turn < 50; turn++) {
      if (dirty) render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve));
      if (dirty || effects.length) quiet = 0; else if (++quiet === 2) return value;
    } assert.fail('Headless hook did not settle'); },
    unmount() { for (const cell of cells) cell?.cleanup?.(); },
  };
}

test('Headless code and email disappear on the first different-owner render before any effects run', async t => {
  const h = harness(); t.after(() => h.unmount()); h.render(); await h.flush();
  assert.deepEqual(h.calls, [], 'Mount cannot send OTPs, discover wallets or connect');
  const activation = h.value.prepare().catch(error => error); await h.flush();
  await h.value.requestEmail('a@example.test'); await h.flush();
  assert.equal(h.value.state.phase, 'code'); assert.equal(h.value.state.email, 'a@example.test');
  const firstB = h.owner('B', 1);
  assert.equal(firstB.state.phase, 'idle'); assert.equal(firstB.state.email, '');
  assert.ok(!JSON.stringify(firstB.state).includes('a@example.test'));
  await h.flush(); assert.equal((await activation).name, 'AbortError');
  assert.deepEqual(h.calls.filter(call => Array.isArray(call)), [['email', 'a@example.test']]);
});

test('callbacks from the former A session cannot start, send, verify or cancel B or a later A activation', async t => {
  const h = harness(); t.after(() => h.unmount()); const oldA = h.render(); await h.flush();
  for (const [owner, generation] of [['B', 1], ['A', 2]]) {
    h.owner(owner, generation); await h.flush();
    const active = h.value.prepare().catch(error => error); await h.flush();
    assert.equal(h.value.state.phase, 'choosing'); const count = h.calls.length;
    await assert.rejects(oldA.connect(), { name: 'AbortError' });
    await assert.rejects(oldA.prepare(), { name: 'AbortError' });
    for (const action of [() => oldA.requestEmail('a@example.test'), () => oldA.verifyEmail('000000'),
      () => oldA.confirmDevice(), () => oldA.connectSocial('google'), () => oldA.connectExternal('wallet'), () => oldA.openNative()]) {
      assert.throws(action, { name: 'AbortError' });
    }
    oldA.cancel(); await h.flush(); assert.equal(h.value.state.phase, 'choosing'); assert.equal(h.calls.length, count);
    h.value.cancel(); await h.flush(); assert.equal((await active).name, 'AbortError'); assert.equal(h.value.state.phase, 'idle');
  }
  assert.equal(h.calls.some(call => Array.isArray(call) || ['otp', 'device', 'social', 'external', 'native'].includes(call)), false);
});
