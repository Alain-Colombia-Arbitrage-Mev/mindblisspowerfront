const COUNTRY = /^[A-Z]{2}$/;

/** A browser hint is not verified residence. Unknown regions stay unset. */
export function browserOnrampRegion(languages = [], timeZone = '') {
  for (const language of languages) {
    try {
      const region = new Intl.Locale(String(language).replace('_', '-')).region || '';
      if (COUNTRY.test(region)) return region;
    } catch { /* try the next browser locale */ }
  }
  return TIMEZONE_COUNTRIES[timeZone] || '';
}

const TIMEZONE_COUNTRIES = Object.freeze({
  'America/Bogota': 'CO', 'America/Mexico_City': 'MX', 'America/Lima': 'PE',
  'America/Santiago': 'CL', 'America/Argentina/Buenos_Aires': 'AR', 'America/Sao_Paulo': 'BR',
  'America/Caracas': 'VE', 'America/Guayaquil': 'EC', 'America/Panama': 'PA',
  'America/Santo_Domingo': 'DO', 'America/Guatemala': 'GT', 'America/Tegucigalpa': 'HN',
  'America/El_Salvador': 'SV', 'America/Managua': 'NI', 'America/Costa_Rica': 'CR',
  'America/Montevideo': 'UY', 'America/Asuncion': 'PY', 'America/La_Paz': 'BO',
});
