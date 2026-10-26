import assert from 'node:assert/strict';
import test from 'node:test';
import { getCountries } from 'libphonenumber-js/min';
import { CONTACT_COUNTRIES, initialContactPhone, normalizeContactPhone, registrationContactValues } from './contact-phone-model.mjs';

test('country selector covers every supported country with its ISO code, readable name and international prefix', () => {
  assert.deepEqual(CONTACT_COUNTRIES.map(option => option.country).sort(), getCountries().sort());
  assert.ok(CONTACT_COUNTRIES.length > 200);
  for (const option of CONTACT_COUNTRIES) {
    assert.match(option.country, /^[A-Z]{2}$/);
    assert.ok(option.name);
    assert.match(option.dialCode, /^\+[1-9]\d{0,2}$/);
  }
  assert.deepEqual(initialContactPhone(), { country: 'CO', national: '' });
  assert.notEqual(initialContactPhone(), initialContactPhone());
});

test('national contacts and pasted international contacts become the same E164 without duplicate country prefix', () => {
  for (const national of ['3001234567', '300 123 4567', '(300) 123-4567', '+573001234567', '+57 (300) 123-4567']) {
    assert.equal(normalizeContactPhone({ country: 'CO', national }), '+573001234567');
  }
  assert.equal(normalizeContactPhone({ country: 'ES', national: '612 345 678' }), '+34612345678');
  assert.equal(normalizeContactPhone({ country: 'DO', national: '8092345678' }), '+18092345678');
});

test('country-aware parsing preserves Italian zeros, handles national trunk prefixes and permits short valid calling plans', () => {
  assert.equal(normalizeContactPhone({ country: 'IT', national: '02 12345678' }), '+390212345678');
  assert.equal(normalizeContactPhone({ country: 'IT', national: '+39 02 12345678' }), '+390212345678');
  assert.equal(normalizeContactPhone({ country: 'GB', national: '020 7946 0018' }), '+442079460018');
  assert.equal(normalizeContactPhone({ country: 'NU', national: '+6838888' }), '+6838888');
});

test('pasted numbers cannot silently contradict the visible country, including countries sharing +1', () => {
  assert.equal(normalizeContactPhone({ country: 'CO', national: '+34612345678' }), null);
  assert.equal(normalizeContactPhone({ country: 'US', national: '+14165551234' }), null);
  assert.equal(normalizeContactPhone({ country: 'CA', national: '+14165551234' }), '+14165551234');
});

test('unknown country, extensions, words, Unicode separators, URLs, malformed and oversized numbers are rejected', () => {
  for (const national of ['Call +573001234567', 'https://example.test/+573001234567', '+573001234567 ext 2', '+573001234567x2', '+573001234567;ext=2',
    '+573001234567#2', '+57\n3001234567', '+57\t3001234567', '+57\u200b3001234567', '\n+573001234567', '+573001234567\t', '+57300123456789abc', '++573001234567', '300', '+573001234567890123456', 'a'.repeat(41)]) {
    assert.equal(normalizeContactPhone({ country: 'CO', national }), null, national);
  }
  for (const value of [null, [], {}, { country: 'XX', national: '3001234567' }, { country: 'CO', national: 3001234567 }]) assert.equal(normalizeContactPhone(value), null);
});

test('blank optional contacts are omitted and independent WhatsApp never implies verification or marketing opt-in', () => {
  assert.deepEqual(registrationContactValues({}), { values: {}, errors: {} });
  assert.equal(normalizeContactPhone({ country: 'CO', national: '   ' }), '');
  assert.deepEqual(registrationContactValues({ contactWhatsapp: { country: 'ES', national: '612345678' } }), {
    values: { contactWhatsapp: '+34612345678' }, errors: {},
  });
  assert.deepEqual(registrationContactValues({ contactPhone: { country: 'CO', national: '3001234567' }, contactWhatsapp: { country: 'ES', national: '612345678' } }), {
    values: { contactPhone: '+573001234567', contactWhatsapp: '+34612345678' }, errors: {},
  });
});

test('reuse requires explicit boolean selection and copies the latest valid phone without persisting selection as consent', () => {
  const form = { contactPhone: { country: 'CO', national: '3001234567' }, contactWhatsapp: { country: 'ES', national: '612345678' } };
  assert.deepEqual(registrationContactValues({ ...form, whatsappSameAsPhone: true }).values, { contactPhone: '+573001234567', contactWhatsapp: '+573001234567' });
  assert.equal(registrationContactValues({ ...form, whatsappSameAsPhone: 'true' }).values.contactWhatsapp, '+34612345678');
  assert.ok(registrationContactValues({ whatsappSameAsPhone: true }).errors.contactPhone);
  const invalid = registrationContactValues({ ...form, contactPhone: { country: 'CO', national: '123' }, whatsappSameAsPhone: true });
  assert.ok(invalid.errors.contactPhone);
  assert.deepEqual(invalid.values, {});
});
