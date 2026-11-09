import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';

import { registrationViewHarness, findRegistrationNode as find } from '../register/registration-view-test-harness.mjs';

const icons = new Proxy({}, { get: () => () => null });

test('the public support widget opens and submits one bounded access-help request', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, options, body: JSON.parse(options.body) });
    return Response.json({ ok: true, id: 'support-1' });
  });
  const harness = registrationViewHarness('../_components/AuthSupportWidget.jsx', {
    react: React,
    'lucide-react': icons,
  });
  t.after(() => harness.unmount());

  let tree = harness.render({ initialEmail: 'member@example.test' });
  const trigger = find(tree, node => node?.type === 'button' && node.props['aria-haspopup'] === 'dialog');
  assert.ok(trigger);
  assert.equal(trigger.props['aria-expanded'], false);
  assert.equal(requests.length, 0);

  trigger.props.onClick();
  tree = harness.render({ initialEmail: 'member@example.test' });
  assert.ok(find(tree, node => node?.type === 'dialog' && node.props.open));
  const phone = find(tree, node => node?.type === 'input' && node.props.type === 'tel');
  const note = find(tree, node => node?.type === 'textarea');
  phone.props.onChange({ target: { value: '+57 300 123 4567' } });
  note.props.onChange({ target: { value: 'No puedo entrar a mi cuenta.' } });

  tree = harness.render({ initialEmail: 'member@example.test' });
  await find(tree, node => node?.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/api/auth/access-help');
  assert.deepEqual(requests[0].body, {
    email: 'member@example.test',
    phone: '+57 300 123 4567',
    reason: 'support_widget',
    note: 'No puedo entrar a mi cuenta.',
  });
  tree = harness.render({ initialEmail: 'member@example.test' });
  assert.match(find(tree, node => node?.props?.role === 'status').props.children[1].props.children, /Solicitud registrada/);
});

test('the floating support control remains visible in the mobile auth contract', () => {
  const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');
  assert.match(css, /@media \(max-width: 860px\)[\s\S]*?\.auth-shell \.vp-support-launcher\s*\{[\s\S]*?display:\s*inline-flex;/);
  assert.match(css, /\.auth-support-dialog\s*\{[\s\S]*?max-height:[^;]+;/);
});
