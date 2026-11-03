/** Only the newest mounted view request may publish data or finish its spinner. */
export function createLatestViewRequest(load, { onStart, onValue, onError, onSettled }) {
  let controller, generation = 0, disposed = false;
  return {
    async run() {
      if (disposed) return;
      controller?.abort();
      const active = controller = new AbortController(), current = ++generation;
      const latest = () => !disposed && current === generation && !active.signal.aborted;
      onStart();
      try {
        const data = await load(active.signal);
        if (latest()) onValue(data);
      } catch (error) { if (latest()) onError(error); }
      finally { if (latest()) onSettled(); }
    },
    dispose() { disposed = true; generation++; controller?.abort(); },
  };
}

/** Clipboard denial is a visible error, never a successful "copied" state. */
export function createClipboardFeedback(onChange, { schedule = setTimeout, cancel = clearTimeout } = {}) {
  let timer, generation = 0, disposed = false;
  return {
    async copy(value, key, clipboard = globalThis.navigator?.clipboard) {
      if (disposed) return;
      const current = ++generation;
      cancel(timer);
      onChange({ pending: key, copied: '', error: '' });
      try {
        if (typeof value !== 'string' || !value.trim() || typeof clipboard?.writeText !== 'function') throw new Error('clipboard_unavailable');
        await clipboard.writeText(value);
        if (disposed || current !== generation) return;
        onChange({ pending: '', copied: key, error: '' });
        timer = schedule(() => {
          if (!disposed && current === generation) onChange({ pending: '', copied: '', error: '' });
        }, 2500);
      } catch {
        if (!disposed && current === generation) onChange({ pending: '', copied: '', error: 'No se pudo copiar. Selecciona el código o enlace y cópialo manualmente.' });
      }
    },
    dispose() { disposed = true; generation++; cancel(timer); },
  };
}
