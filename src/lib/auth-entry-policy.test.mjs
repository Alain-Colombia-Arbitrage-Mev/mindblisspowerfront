import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTH_ENTRY_PAUSED, authEntryAllowed, suppressAuthEntry } from './auth-entry-policy.mjs';
import { authEntryMessages } from '../i18n/auth-entry-messages.js';
import { translateMessage } from '../i18n/translate.mjs';

test('the real entry policy allows login and registration without querying or changing authenticated sessions', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('a UI entry policy cannot read or mutate a session'));
  assert.equal(AUTH_ENTRY_PAUSED, false);
  assert.equal(authEntryAllowed(), true);
  assert.equal(authEntryAllowed(), true);
});

test('form and keyboard submissions proceed without suppressing defaults or bubbling', () => {
  const events = [];
  const event = { preventDefault() { events.push('default'); }, stopPropagation() { events.push('propagation'); } };
  assert.equal(suppressAuthEntry(event), false);
  assert.deepEqual(events, []);
  assert.equal(suppressAuthEntry(undefined), false);
  assert.equal(suppressAuthEntry(null), false);
  assert.equal(suppressAuthEntry({}), false);
});

test('the short entry-pause notice resolves in every supported locale without a fallback or a financial or identity payload', () => {
  assert.deepEqual(Object.keys(authEntryMessages), ['es', 'en', 'ar', 'zh']);
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    assert.deepEqual(Object.keys(authEntryMessages[locale].authEntry), ['unavailable']);
    const message = authEntryMessages[locale].authEntry.unavailable;
    assert.ok(message.trim());
    assert.equal(translateMessage(locale, 'authEntry.unavailable'), message);
    assert.doesNotMatch(message, /\{|@|https?:\/\//);
  }
});
