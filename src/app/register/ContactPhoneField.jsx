'use client';

import { CONTACT_COUNTRIES, normalizeContactPhone } from './contact-phone-model.mjs';

const controlClass = 'min-h-12 w-full min-w-0 rounded-lg border border-[var(--vp-border)] bg-[var(--vp-surface-raised)] px-3 text-base text-[var(--vp-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)] disabled:opacity-60';

export default function ContactPhoneField({ id, label, value, onChange, error = '', disabled = false }) {
  const normalized = normalizeContactPhone(value);
  const description = error ? `${id}-error` : `${id}-helper`;
  return (
    <div className="min-w-0 space-y-2" role="group" aria-labelledby={`${id}-label`}>
      <p id={`${id}-label`} className="text-sm font-semibold text-[var(--vp-text)]">{label} <span className="font-normal text-[var(--vp-muted)]">(opcional)</span></p>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={`${id}-country`} className="mb-1 block text-xs text-[var(--vp-muted)]">País y código</label>
          <select id={`${id}-country`} name={`${id}-country`} value={value.country} disabled={disabled}
            onChange={event => onChange({ ...value, country: event.target.value })} aria-invalid={Boolean(error)} aria-describedby={description} className={controlClass}>
            {CONTACT_COUNTRIES.map(({ country, name, dialCode }) => <option key={country} value={country}>{name} ({country}) {dialCode}</option>)}
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor={id} className="mb-1 block text-xs text-[var(--vp-muted)]">Número</label>
          <input id={id} name={id} type="tel" inputMode="tel" autoComplete={id === 'contactPhone' ? 'section-contact-phone tel-national' : 'section-contact-whatsapp tel-national'}
            value={value.national} maxLength={40} disabled={disabled} placeholder="Número nacional o +código…"
            onChange={event => onChange({ ...value, national: event.target.value })} aria-invalid={Boolean(error)} aria-describedby={description} className={controlClass} />
        </div>
      </div>
      {error ? <p id={`${id}-error`} role="alert" className="text-sm leading-6 text-[var(--vp-danger)]">{error}</p>
        : <p id={`${id}-helper`} className="break-words text-xs leading-5 text-[var(--vp-muted)]">{normalized ? `Se guardará como ${normalized}.` : 'Elige el país del número. Puedes dejar este contacto vacío.'}</p>}
    </div>
  );
}
