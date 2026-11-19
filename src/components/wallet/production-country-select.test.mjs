import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { registrationViewHarness } from '../../app/register/registration-view-test-harness.mjs';
import { walletCountrySearch } from '../../lib/wallet-country-search.mjs';

const countries = [{ code: 'MX', name: 'Mexico' }, { code: 'US', name: 'United States' }, { code: 'CO', name: 'Colombia' }];
const all = node => [node, ...React.Children.toArray(node?.props?.children).flatMap(all)];
function fixture(t) {
  const calls = [], h = registrationViewHarness('../../components/wallet/ProductionCountrySelect.jsx', {
    'lucide-react': { Check: () => null, ChevronsUpDown: () => null }, '@/lib/wallet-country-search.mjs': { walletCountrySearch },
    '@/components/ui/popover': { Popover: 'country-popover', PopoverTrigger: 'country-trigger', PopoverContent: 'country-content' },
    cmdk: { Command: 'country-command', CommandInput: 'country-search', CommandList: 'country-list', CommandEmpty: 'country-empty', CommandItem: 'country-item' },
    './production-country-select.module.css': { default: {} },
  });
  let props = { id: 'residence', value: '', countries, disabled: false, onChange: value => calls.push(value), locale: 'es', label: 'País de residencia',
    placeholder: 'Seleccionar país', searchLabel: 'Buscar país', emptyLabel: 'Sin coincidencias' };
  t.after(() => h.unmount());
  const render = changes => h.render(props = { ...props, ...changes });
  const find = (tree, type) => all(tree).find(node => node?.type === type);
  return { calls, render, find, unmount: () => h.unmount(), open() { const tree = render(); find(tree, 'country-popover').props.onOpenChange(true); return render(); } };
}

test('search matches localized names, original names and ISO codes without adding unavailable countries or making network requests', () => {
  for (const query of ['México', 'mexico', 'MX']) assert.deepEqual(walletCountrySearch(countries, 'es', query).map(item => item.code), ['MX']);
  assert.deepEqual(walletCountrySearch(countries, 'es', 'estados').map(item => item.code), ['US']);
  for (const query of ['united', 'USA', 'U.S.', 'EE. UU.', 'United States of America']) {
    assert.deepEqual(walletCountrySearch(countries, 'es', query).map(item => item.code), ['US']);
  }
  assert.deepEqual(walletCountrySearch(countries.filter(item => item.code !== 'US'), 'es', 'USA'), []);
  assert.deepEqual(walletCountrySearch(countries, 'zh', '美国').map(item => item.code), ['US']);
  assert.deepEqual(walletCountrySearch(countries, 'es', 'Costa Rica'), []);
  assert.equal(walletCountrySearch(countries, 'es').length, countries.length);
});

test('country search stays closed and unfocused on load, and selection remains an explicit accessible list action', t => {
  const h = fixture(t), initial = h.render(), trigger = all(initial).find(node => node?.props?.role === 'combobox');
  assert.equal(trigger.props.type, 'button'); assert.equal(trigger.props['aria-expanded'], false); assert.equal(trigger.props['aria-required'], 'true');
  assert.equal(h.find(initial, 'country-search'), undefined); assert.deepEqual(h.calls, []);
  let tree = h.open(); const search = h.find(tree, 'country-search');
  assert.equal(search.props.autoFocus, undefined); assert.equal(search.props['aria-label'], 'Buscar país');
  assert.equal(h.find(tree, 'country-command').props.shouldFilter, false);
  assert.equal(h.find(tree, 'country-command').props.label, 'País de residencia');
  assert.equal(h.find(tree, 'country-list').props.label, 'País de residencia');
  search.props.onValueChange('mexico'); tree = h.render();
  const items = all(tree).filter(node => node?.type === 'country-item'); assert.equal(items.length, 1); assert.equal(items[0].props.value, 'MX');
  assert.deepEqual(h.calls, []); items[0].props.onSelect(); tree = h.render(); assert.deepEqual(h.calls, ['MX']);
  assert.equal(all(tree).find(node => node?.props?.role === 'combobox').props['aria-expanded'], false);
});

test('retired selections, disabled controls and unmounted owners cannot commit a previously captured country choice', t => {
  const h = fixture(t); let tree = h.open(); const old = h.find(tree, 'country-item').props.onSelect;
  h.render({ countries: [] }); old(); assert.deepEqual(h.calls, []);
  h.render({ countries, disabled: true }); old(); assert.deepEqual(h.calls, []);
  h.render({ disabled: false }); tree = h.open(); const current = h.find(tree, 'country-item').props.onSelect;
  h.unmount(); current(); assert.deepEqual(h.calls, []);
});

test('a search with no available match leaves the selection empty and never substitutes another country', t => {
  const h = fixture(t); let tree = h.open(); h.find(tree, 'country-search').props.onValueChange('no-such-country'); tree = h.render();
  assert.equal(all(tree).filter(node => node?.type === 'country-item').length, 0); assert.deepEqual(h.calls, []);
  assert.equal(h.find(tree, 'country-empty').props.children, 'Sin coincidencias');
});

test('closing or reselecting the current country preserves the selection and clears the search for the next opening', t => {
  const h = fixture(t); h.render({ value: 'MX' }); let tree = h.open();
  h.find(tree, 'country-search').props.onValueChange('MX'); tree = h.render();
  h.find(tree, 'country-item').props.onSelect(); tree = h.render(); assert.deepEqual(h.calls, []);
  tree = h.open(); assert.equal(h.find(tree, 'country-search').props.value, '');
  h.find(tree, 'country-search').props.onValueChange('United'); tree = h.render();
  h.find(tree, 'country-popover').props.onOpenChange(false); tree = h.render();
  assert.equal(all(tree).find(node => node?.props?.role === 'combobox').props.value, 'MX'); assert.deepEqual(h.calls, []);
  tree = h.open(); assert.equal(h.find(tree, 'country-search').props.value, '');
});
