import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const controlClass = 'min-h-12 w-full rounded-lg border bg-[var(--vp-surface-raised)] px-3 text-base text-[var(--vp-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)] disabled:opacity-60';

export function RegistrationField({ id, label, error = '', helper = '', inputRef = null, ...props }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-[var(--vp-text)]">{label}</label>
      <input ref={inputRef} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : helper ? `${id}-helper` : undefined}
        className={cn(controlClass, error ? 'border-[var(--vp-danger)]' : 'border-[var(--vp-border)]')} {...props} />
      {error ? <p id={`${id}-error`} className="mt-2 text-sm text-[var(--vp-danger)]">{error}</p>
        : helper ? <p id={`${id}-helper`} className="mt-2 text-sm leading-6 text-[var(--vp-muted)]">{helper}</p> : null}
    </div>
  );
}

export function RegistrationPassword({ id, label, error = '', helper = '', visible, onToggle, ...props }) {
  return (
    <div className="relative">
      <RegistrationField id={id} label={label} error={error} helper={helper} type={visible ? 'text' : 'password'} {...props} />
      <button type="button" onClick={onToggle} disabled={props.disabled} aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
        aria-pressed={visible} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-[var(--vp-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--vp-accent)] disabled:cursor-not-allowed disabled:opacity-60">
        {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        {visible ? 'Ocultar' : 'Mostrar'} contraseña
      </button>
    </div>
  );
}

export function RegistrationButton({ loading = false, children, className = '', ...props }) {
  return (
    <button className={cn('inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--vp-accent)] px-4 py-3 text-base font-bold text-[var(--vp-shell)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vp-accent)] disabled:cursor-not-allowed disabled:opacity-60', className)} {...props}>
      {loading ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{children}
    </button>
  );
}
