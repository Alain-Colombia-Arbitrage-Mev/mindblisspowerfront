import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

// Contact format only. A possible number is NOT proof of possession, permission
// to send a message, a login identifier or a legacy network identity claim.
export function registrationContact(value) {
  if (value === undefined || value === '') return '';
  if (typeof value !== 'string' || !/^\+[1-9][0-9]{1,14}$/.test(value)) throw new Error('invalid_contact_number');
  const number = parsePhoneNumberFromString(value, { extract: false });
  if (!number || number.ext || number.number !== value || !number.isPossible()) throw new Error('invalid_contact_number');
  return value;
}
