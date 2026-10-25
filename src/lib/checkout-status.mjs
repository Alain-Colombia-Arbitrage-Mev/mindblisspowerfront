// A redirect is only a reason to read the authenticated backend. It is never
// evidence that a particular checkout was paid (or that a canceled one was not).
export function initialCheckoutStatus(checking = false) {
  return { summary: null, active: false, positioned: false, checking, done: false, denied: false };
}

export function checkoutResultStatus({ summary, active, positioned }, { exhausted }) {
  const done = Boolean(active && positioned) || exhausted;
  return { summary, active, positioned, checking: !done, done, denied: false };
}

export function checkoutErrorStatus(current, error, { exhausted }) {
  const denied = [401, 403].includes(error?.status);
  // Do not keep showing private data after the session or authorization expires.
  if (denied) return { ...initialCheckoutStatus(), done: true, denied: true };
  return { ...current, checking: !exhausted, done: exhausted };
}

export function checkoutStatusCopy({ active, positioned, checking, denied }) {
  if (denied) return {
    title: "No pudimos consultar tu compra",
    description: "Vuelve a iniciar sesión para consultar el estado de tus pagos y de tu membresía.",
  };
  if (active && positioned) return {
    title: "Membresía activa y posición lista",
    description: "Tu membresía está activa y tu posición en la red está disponible. Consulta Mis pagos para revisar el detalle de tu compra.",
  };
  if (active) return {
    title: "Membresía activa",
    description: "Tu membresía está activa. La posición del árbol sigue en verificación; puedes consultarla de nuevo en unos segundos.",
  };
  return checking ? {
    title: "Verificando tu compra",
    description: "Estamos consultando la activación con el backend. El regreso desde el checkout no confirma por sí solo un pago.",
  } : {
    title: "Confirmación pendiente",
    description: "Todavía no pudimos confirmar la activación. Revisa Mis pagos antes de intentar otro cargo; la confirmación puede tardar unos minutos.",
  };
}
