import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTH_ENTRY_PAUSED, authEntryAllowed, suppressAuthEntry } from './auth-entry-policy.mjs';
import { authEntryMessages } from '../i18n/auth-entry-messages.js';
import { translateMessage } from '../i18n/translate.mjs';

test('the temporary real entry policy remains paused without querying or changing authenticated sessions', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('a UI entry policy cannot read or mutate a session'));
  assert.equal(AUTH_ENTRY_PAUSED, true);
  assert.equal(authEntryAllowed(), false);
  assert.equal(authEntryAllowed(), false);
});

test('blocked form and keyboard submissions suppress defaults and bubbling even when handlers are invoked directly', () => {
  const events = [];
  const event = { preventDefault() { events.push('default'); }, stopPropagation() { events.push('propagation'); } };
  assert.equal(suppressAuthEntry(event), true);
  assert.deepEqual(events, ['default', 'propagation']);
  assert.equal(suppressAuthEntry(undefined), true);
  assert.equal(suppressAuthEntry(null), true);
  assert.equal(suppressAuthEntry({}), true);
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
