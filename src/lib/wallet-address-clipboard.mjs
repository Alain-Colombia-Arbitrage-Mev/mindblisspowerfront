/** Clipboard input is a visible wallet address, never arbitrary links or payment data. */
export function isCopyableWalletAddress(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value) && !/^0x0{40}$/i.test(value);
}

function copyWithSelection(address, document, isCurrent) {
  if (!isCurrent() || !document?.body || typeof document.createElement !== 'function'
    || typeof document.execCommand !== 'function') return false;
  let field, active, selection, start, end, direction;
  const ranges = [];
  try {
    active = document.activeElement;
    start = active?.selectionStart; end = active?.selectionEnd; direction = active?.selectionDirection;
    selection = document.getSelection?.();
    for (let index = 0; index < (selection?.rangeCount || 0); index++) ranges.push(selection.getRangeAt(index).cloneRange());
    field = document.createElement('textarea');
    field.value = address;
    field.readOnly = true;
    field.tabIndex = -1;
    field.setAttribute('aria-hidden', 'true');
    Object.assign(field.style, { position: 'fixed', top: '0', left: '-9999px', opacity: '0', fontSize: '16px' });
    document.body.appendChild(field);
    field.select();
    field.setSelectionRange(0, address.length);
    // A permission rejection may have happened after the owner/address changed.
    return isCurrent() && document.execCommand('copy') === true;
  } catch { return false; }
  finally {
    try { field?.remove(); } catch { /* Cleanup must not hide clipboard failure. */ }
    try {
      active?.focus?.({ preventScroll: true });
      if (typeof active?.setSelectionRange === 'function' && Number.isInteger(start) && Number.isInteger(end)) active.setSelectionRange(start, end, direction);
      if (selection && ranges.length) { selection.removeAllRanges(); for (const range of ranges) selection.addRange(range); }
    } catch { /* A removed or non-selectable previous control needs no restoration. */ }
  }
}

/** @returns {boolean} */
const alwaysCurrent = () => true;

/** One explicit click; no network, timers, retry loop or persisted wallet data. */
export async function copyWalletAddress(address, { navigator = globalThis.navigator, document = globalThis.document, isCurrent = alwaysCurrent } = {}) {
  if (!isCopyableWalletAddress(address) || !isCurrent()) return 'cancelled';
  try {
    const clipboard = navigator?.clipboard;
    if (typeof clipboard?.writeText === 'function') {
      await clipboard.writeText(address);
      return isCurrent() ? 'copied' : 'cancelled';
    }
  } catch { /* Older browsers and denied clipboard permissions use the selection fallback. */ }
  if (!isCurrent()) return 'cancelled';
  return copyWithSelection(address, document, isCurrent) ? 'copied' : 'error';
}

/** Bind every captured handler to one mounted owner and one address. */
export function createWalletAddressClipboard({ address, ownerKey, isCurrent, onChange, environment = {}, schedule = setTimeout, cancel = clearTimeout }) {
  let disposed = false, pending = false, generation = 0, timer;
  const current = () => !disposed && Boolean(ownerKey) && isCopyableWalletAddress(address) && isCurrent();
  return {
    async copy() {
      if (!current() || pending) return;
      pending = true; onChange('pending');
      const request = ++generation, latest = () => current() && generation === request;
      timer = schedule(() => {
        if (!latest()) return;
        generation++;
        // Native clipboard writes cannot be aborted. Keep the dispatch lock until
        // it settles, but replace the pending UI with manual-copy guidance.
        onChange('error');
      }, 8_000);
      const result = await copyWalletAddress(address, { ...environment, isCurrent: latest });
      cancel(timer); timer = undefined;
      pending = false;
      if (!latest()) return;
      onChange(result === 'copied' ? 'copied' : 'error');
    },
    dispose() { disposed = true; generation++; pending = false; cancel(timer); timer = undefined; },
  };
}
