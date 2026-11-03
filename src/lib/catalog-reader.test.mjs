import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import test from 'node:test';
import { createCatalogReader } from './catalog-reader.mjs';

function fixture() {
  const scopes = new AsyncLocalStorage();
  const calls = [];
  const caches = [];
  let failure = false;
  const database = () => async (parts, ...parameters) => {
    assert.equal(parameters.length, 0);
    const statement = parts.join('');
    const kind = statement.includes('FROM mlm.package') ? 'packages' : 'ranks';
    calls.push({ kind, owner: scopes.getStore()?.owner });
    if (failure) throw new Error('synthetic catalog failure');
    return kind === 'packages'
      ? [{ id: 1, name: 'Member', amount_usd: '100.00', pv: '100', type: 'membership', email: 'not-for-the-catalog@example.test' }]
      : [{ code: 'R1', name_es: 'Rango 1', required_points: '500', bonus_amount_usd: '10.00', private_balance: '999.00' }];
  };
  const reader = createCatalogReader({ database, requestScope: () => scopes.getStore(), cache(load, keys, options) {
    caches.push({ keys, options }); return load;
  } });
  const run = (owner, work) => scopes.run({ owner, resources: new Map() }, work);
  return { reader, calls, caches, run, fail: value => { failure = value; } };
}

test('overview packages require one query and never load ranks or unrelated columns', async () => {
  const { reader, calls, run } = fixture();
  const result = await run('overview', () => reader.packages());
  assert.deepEqual(calls, [{ kind: 'packages', owner: 'overview' }]);
  assert.deepEqual(result, { packages: [{ id: 1, name: 'Member', amount_usd: '100.00', pv: '100', type: 'membership' }] });
});

test('rank catalog requires one query and never reads package prices or personal values', async () => {
  const { reader, calls, run } = fixture();
  const result = await run('ranks', () => reader.ranks());
  assert.deepEqual(calls, [{ kind: 'ranks', owner: 'ranks' }]);
  assert.deepEqual(result, { ranks: [{ code: 'R1', name_es: 'Rango 1', required_points: '500', bonus_amount_usd: '10.00' }] });
});

test('combined membership catalog still returns both definitions without duplicate queries in the same request', async () => {
  const { reader, calls, run } = fixture();
  await run('membership', async () => {
    const [packages, ranks, combined] = await Promise.all([reader.packages(), reader.ranks(), reader.all(), reader.all()]);
    assert.deepEqual(combined, { ...packages, ...ranks });
  });
  assert.equal(calls.filter(call => call.kind === 'packages').length, 1);
  assert.equal(calls.filter(call => call.kind === 'ranks').length, 1);
});

test('independent concurrent Worker requests own their SQL and never share pending promises or completed data', async () => {
  const { reader, calls, run } = fixture();
  const [first, second] = await Promise.all([run('first', () => reader.all()), run('second', () => reader.all())]);
  assert.deepEqual(first, second);
  assert.notEqual(first.packages, second.packages);
  assert.notEqual(first.ranks, second.ranks);
  assert.equal(calls.length, 4);
  for (const owner of ['first', 'second']) assert.equal(calls.filter(call => call.owner === owner).length, 2);
});

test('request invalidation clears both definitions while preserving the existing tag and five-minute Node policy', async () => {
  const { reader, calls, caches, run } = fixture();
  assert.deepEqual(caches, [
    { keys: ['catalog-packages-v3'], options: { revalidate: 300, tags: ['catalog'] } },
    { keys: ['catalog-ranks-v3'], options: { revalidate: 300, tags: ['catalog'] } },
  ]);
  await run('admin', async () => { await reader.all(); reader.invalidate(); await reader.all(); });
  assert.equal(calls.length, 4);
});

test('a failed Worker load cannot poison a later request or return invented empty definitions', async () => {
  const { reader, calls, run, fail } = fixture();
  fail(true);
  await assert.rejects(run('failed', () => reader.packages()), /synthetic catalog failure/);
  fail(false);
  assert.equal((await run('retry', () => reader.packages())).packages.length, 1);
  assert.deepEqual(calls.map(call => call.owner), ['failed', 'retry']);
});

test('non-Worker reads still deduplicate in-flight definitions and can retry rejected loads', async () => {
  const { reader, calls, fail } = fixture();
  const [packages, ranks, combined] = await Promise.all([reader.packages(), reader.ranks(), reader.all()]);
  assert.deepEqual(combined, { ...packages, ...ranks });
  assert.equal(calls.length, 2);
  fail(true);
  await assert.rejects(reader.packages(), /synthetic catalog failure/);
  fail(false);
  assert.equal((await reader.packages()).packages.length, 1);
});
