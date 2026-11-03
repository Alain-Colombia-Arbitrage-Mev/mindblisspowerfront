import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import * as model from './contact-phone-model.mjs';
import { registrationViewHarness, findRegistrationNode as find } from './registration-view-test-harness.mjs';

const component = () => registrationViewHarness('./ContactPhoneField.jsx', { './contact-phone-model.mjs': model });
const base = { id: 'contactPhone', label: 'Teléfono', value: model.initialContactPhone(), onChange() {} };

test('phone contact has labelled accessible country and number controls, visible default and no messages or mandatory verification', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('contact inputs never send messages'));
  const tree = component().render(base);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Colombia \(CO\) \+57/);
  assert.match(html, /value="CO" selected=""/);
  assert.match(html, /label for="contactPhone-country"/);
  assert.match(html, /label for="contactPhone"/);
  assert.match(html, /aria-describedby="contactPhone-helper"/);
  assert.match(html, /type="tel"/);
  assert.match(html, /inputMode="tel"/);
  assert.doesNotMatch(html, /required|SMS|one-time-code|phoneNumberVerified/);
  assert.equal(find(tree, node => node?.type === 'input').props.maxLength, 40);
});

test('country selection and local input edits preserve each other and do not silently rewrite a pasted number', () => {
  const changes = [];
  const tree = component().render({ ...base, value: { country: 'CO', national: '300 123 4567' }, onChange: value => changes.push(value) });
  find(tree, node => node?.type === 'select').props.onChange({ target: { value: 'IT' } });
  assert.deepEqual(changes[0], { country: 'IT', national: '300 123 4567' });
  find(tree, node => node?.type === 'input').props.onChange({ target: { value: '+573001234567' } });
  assert.deepEqual(changes[1], { country: 'CO', national: '+573001234567' });
});

test('canonical preview describes storage only and field errors are associated with both controls', () => {
  const preview = renderToStaticMarkup(component().render({ ...base, value: { country: 'IT', national: '02 12345678' } }));
  assert.match(preview, /Se guardará como \+390212345678/);
  const tree = component().render({ ...base, error: 'Revisa el teléfono.', disabled: true });
  const html = renderToStaticMarkup(tree);
  assert.match(html, /role="alert"/);
  for (const type of ['select', 'input']) {
    const control = find(tree, node => node?.type === type);
    assert.equal(control.props['aria-invalid'], true);
    assert.equal(control.props['aria-describedby'], 'contactPhone-error');
    assert.equal(control.props.disabled, true);
  }
});
