import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContactRound, Info } from 'lucide-react';
import ts from 'typescript';
import { translateMessage } from '../../../../i18n/translate.mjs';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('./ResidenceImportantCard.jsx', import.meta.url), 'utf8');
function card(locale) {
  const module = { exports: {} };
  const code = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react/jsx-runtime') return require(id);
    if (id === 'lucide-react') return { ContactRound, Info };
    if (id === '@/i18n/LanguageProvider') return { useI18n: () => ({ locale, dir: locale === 'ar' ? 'rtl' : 'ltr',
      t: (key, values) => translateMessage(locale, key, values) }) };
    if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, key) => key }) };
    assert.fail(`The informational card must not import wallet, payment or backend services: ${id}`);
  }, module, module.exports);
  return module.exports.default();
}
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => all(child, predicate))];
const text = node => typeof node === 'string' ? node : React.Children.toArray(node?.props?.children).map(text).join('');

test('the tSzaZ residence card renders its exact guidance, live heading and SSN requirement in every locale without payment controls', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('Rendering residence guidance cannot contact a backend'));
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const tree = card(locale), html = renderToStaticMarkup(tree);
    assert.equal(tree.type, 'section'); assert.equal(tree.props['data-design-node'], 'tSzaZ');
    assert.equal(tree.props.dir, locale === 'ar' ? 'rtl' : 'ltr');
    assert.equal(tree.props['aria-label'], translateMessage(locale, 'funding.residenceImportantTitle'));
    assert.deepEqual(all(tree, node => node?.type === 'h2').map(text), [translateMessage(locale, 'funding.residenceImportantTitle')]);
    assert.deepEqual(all(tree, node => node?.type === 'p').map(text), [
      translateMessage(locale, 'funding.residenceSidebarCopy'), translateMessage(locale, 'funding.residenceCountrySsn'),
    ]);
    assert.ok(html.includes(translateMessage(locale, 'funding.residenceCountryLabel')));
    assert.match(html, /SSN/);
    assert.equal(all(tree, node => node?.type === ContactRound && node.props['aria-hidden'] === 'true').length, 1);
    assert.equal(all(tree, node => node?.type === Info && node.props['aria-hidden'] === 'true').length, 1);
    assert.equal(all(tree, node => ['form', 'input', 'select', 'button', 'a'].includes(node?.type)).length, 0);
    assert.doesNotMatch(html, /0x[a-f0-9]{40}|CREDIT_DEBIT_CARD|paymentMethod|walletAddress|funding\./i);
  }
  const spanish = card('es');
  assert.equal(text(all(spanish, node => node?.type === 'h2')[0]), '¡INFORMACIÓN\nIMPORTANTE!');
  assert.equal(text(all(spanish, node => node?.type === 'p')[0]), 'Elija el país donde reside. El procesador de pagos puede pedirle datos o documentos de su país de origen para verificar su identidad y residencia.');
});

test('the exported banner is a local decorative asset while meaningful card text remains accessible HTML', () => {
  const tree = card('es'), images = all(tree, node => node?.type === 'img');
  assert.equal(images.length, 1); assert.equal(images[0].props.src, '/mindbliss/residence/important-banner.svg');
  assert.equal(images[0].props.alt, ''); assert.equal(images[0].props['aria-hidden'], 'true');
  const asset = readFileSync(new URL('../../../../../public/mindbliss/residence/important-banner.svg', import.meta.url), 'utf8');
  assert.match(asset, /<svg\b/); assert.doesNotMatch(asset, /<script\b|<foreignObject\b/i);
  assert.equal(all(tree, node => node?.type === 'h2').length, 1); assert.equal(all(tree, node => node?.type === 'p').length, 2);
});
