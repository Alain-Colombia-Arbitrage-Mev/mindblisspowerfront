import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js/min';

const countries = getCountries();
const countrySet = new Set(countries);
const displayNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['es'], { type: 'region' }) : null;

export const CONTACT_COUNTRIES = countries.map(country => ({
  country,
  name: displayNames?.of(country) || country,
  dialCode: `+${getCountryCallingCode(country)}`,
})).sort((left, right) => left.name.localeCompare(right.name, 'es') || left.country.localeCompare(right.country));

// This visible default is a convenience, never a location or identity claim.
export const initialContactPhone = () => ({ country: 'CO', national: '' });

// Contact formatting is not ownership verification or permission to send SMS.
// Keep national prefixes (notably Italy's leading zero) for the phone parser.
export function normalizeContactPhone(value) {
  if (!value || typeof value !== 'object' || !countrySet.has(value.country)
    || typeof value.national !== 'string' || value.national.length > 40) return null;
  if (!/^[+\d ()-]*$/.test(value.national)) return null;
  const raw = value.national.trim();
  if (!raw) return '';
  const phone = parsePhoneNumberFromString(raw, { defaultCountry: value.country, extract: false });
  if (!phone || phone.ext || !phone.isPossible() || !/^\+[1-9]\d{1,14}$/.test(phone.number)) return null;
  if (phone.countryCallingCode !== getCountryCallingCode(value.country)
    || (phone.country && phone.country !== value.country)) return null;
  return phone.number;
}

export function registrationContactValues(form) {
  const phone = normalizeContactPhone(form.contactPhone || initialContactPhone());
  const whatsapp = form.whatsappSameAsPhone === true ? phone
    : normalizeContactPhone(form.contactWhatsapp || initialContactPhone());
  /** @type {Record<string, string>} */
  const errors = {};
  /** @type {Record<string, string>} */
  const values = {};
  if (phone === null) errors.contactPhone = 'Revisa el teléfono y el país seleccionado. Puedes usar el número nacional o pegarlo con su código de país.';
  if (whatsapp === null && form.whatsappSameAsPhone !== true) errors.contactWhatsapp = 'Revisa el número de WhatsApp y el país seleccionado.';
  if (form.whatsappSameAsPhone === true && !phone && !errors.contactPhone) errors.contactPhone = 'Indica tu teléfono para usarlo también como contacto de WhatsApp, o desmarca la casilla.';
  if (phone) values.contactPhone = phone;
  if (whatsapp) values.contactWhatsapp = whatsapp;
  return { values, errors };
}
