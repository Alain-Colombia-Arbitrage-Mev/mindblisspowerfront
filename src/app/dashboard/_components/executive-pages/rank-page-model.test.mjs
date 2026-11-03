import assert from 'node:assert/strict';
import test from 'node:test';
import { rankPagePresentation, validRankPosition } from './rank-page-model.mjs';

const rank = (code, name) => ({ code, name_es: name, required_points: '500', bonus_amount_usd: '100.00' });
const ranks = [rank('BRONZE', 'Bronce'), rank('GOLD', 'Oro')];
const catalog = { loading: false, data: { ranks }, error: false };
const personal = (currentRank = { code: 'BRONZE', name: 'Bronce' }) => ({ loading: false, error: null,
  data: { positioned: true, me: { affiliateId: '123', rank: currentRank }, tree: [] } });

test('rank proof requires an explicit valid current rank or explicit null, never a missing or malformed member field', () => {
  assert.equal(validRankPosition(personal().data), true);
  assert.equal(validRankPosition(personal(null).data), true);
  assert.equal(validRankPosition({ positioned: false }), true);
  for (const data of [null, [], {}, { positioned: true, me: { rank: null }, tree: [] },
    { positioned: true, me: { affiliateId: '123' }, tree: [] }, personal({ code: 'BRONZE' }).data,
    personal({ code: '', name: 'Bronce' }).data, personal({ code: 'X', name: 'a'.repeat(201) }).data]) {
    assert.equal(validRankPosition(data), false);
  }
});

test('a catalog failure preserves the authoritative private rank without implying maximum rank or available bonus', () => {
  const result = rankPagePresentation({ loading: false, data: null, error: true }, personal());
  assert.equal(result.current.value, 'Bronce');
  assert.equal(result.next.value, 'No disponible');
  assert.equal(result.bonus.value, '—');
  assert.equal(result.catalog.value, 'No disponible');
  assert.deepEqual(result.rows, []);
  assert.doesNotMatch(JSON.stringify(result), /Máximo|Sin rango|\$0/);
});

for (const status of [401, 403, 503]) test(`private position HTTP ${status} cannot claim no rank, maximum or a pending next rank`, () => {
  const result = rankPagePresentation(catalog, { loading: false, data: null, error: { status, message: 'Private provider detail' } });
  assert.equal(result.current.value, 'No disponible');
  assert.equal(result.next.value, 'No disponible');
  assert.equal(result.bonus.value, '—');
  assert.equal(result.catalog.value, '2');
  assert.equal(result.rows.every(row => row[1] === 'Sin confirmar'), true);
  assert.doesNotMatch(JSON.stringify(result), /Máximo|Sin rango|Private provider detail|Pendiente/);
});

test('an empty catalog or an unknown member rank never means maximum or regresses the next rank to the first row', () => {
  const empty = rankPagePresentation({ loading: false, data: { ranks: [] }, error: false }, personal());
  assert.equal(empty.current.value, 'Bronce');
  assert.equal(empty.next.value, 'No disponible');
  assert.equal(empty.catalog.value, '0');
  assert.match(empty.catalog.detail, /Catálogo vacío/);
  const unknown = rankPagePresentation(catalog, personal({ code: 'UNKNOWN', name: 'Rango legado' }));
  assert.equal(unknown.current.value, 'Rango legado');
  assert.equal(unknown.next.value, 'Por revisar');
  assert.equal(unknown.bonus.value, '—');
  assert.equal(unknown.rows.every(row => row[1] === 'Por revisar'), true);
  assert.doesNotMatch(JSON.stringify([empty, unknown]), /"value":"Máximo"/);
});

test('only a recognized last rank in a nonempty catalog is maximum; real lower and absent ranks remain distinct', () => {
  const lower = rankPagePresentation(catalog, personal());
  assert.equal(lower.next.value, 'Oro');
  assert.equal(lower.bonus.value, '$100');
  assert.deepEqual(lower.rows.map(row => row[1]), ['Actual', 'Pendiente']);
  const maximum = rankPagePresentation(catalog, personal({ code: 'GOLD', name: 'Oro' }));
  assert.equal(maximum.next.value, 'Máximo');
  assert.equal(maximum.bonus.value, '—');
  assert.deepEqual(maximum.rows.map(row => row[1]), ['Alcanzado', 'Actual']);
  const noRank = rankPagePresentation(catalog, personal(null));
  assert.equal(noRank.current.value, 'Sin rango');
  assert.equal(noRank.next.value, 'Bronce');
  const unpositioned = rankPagePresentation(catalog, { loading: false, error: null, data: { positioned: false } });
  assert.equal(unpositioned.current.value, 'Sin posición');
  assert.equal(unpositioned.next.value, 'Sin posición');
  assert.equal(unpositioned.bonus.value, '—');
});

test('loading and invalid private payloads never become rank proof', () => {
  const loading = rankPagePresentation(catalog, { loading: true, data: null, error: null });
  assert.equal(loading.current.value, '—');
  assert.equal(loading.next.value, '—');
  assert.equal(loading.bonus.value, '—');
  const invalid = rankPagePresentation(catalog, { loading: false, error: null, data: { positioned: true } });
  assert.equal(invalid.current.value, 'No disponible');
  assert.equal(invalid.next.value, 'No disponible');
});
