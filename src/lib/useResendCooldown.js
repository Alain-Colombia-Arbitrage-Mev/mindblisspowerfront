"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Cooldown reutilizable para botones de "reenviar código". Evita el spam de
// reenvíos (que dispara el límite de Cognito y, peor, invalida el código
// anterior en cada envío). Uso: const { active, label, start } = useResendCooldown();
// llamar start() cuando se envía/reenvía un código; deshabilitar el botón con
// `active` y mostrar `label`.
export function useResendCooldown(seconds = 45) {
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);

  const start = useCallback(() => setRemaining(seconds), [seconds]);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    timerRef.current = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [remaining]);

  const label = remaining > 0
    ? `Reenviar en ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
    : "";

  return { remaining, active: remaining > 0, label, start };
}

// Detecta dominios de Microsoft, que suelen retrasar o filtrar a spam los
// correos de Cognito/SES — causa frecuente de "el código no llega".
export function isMicrosoftEmail(email) {
  return /@(hotmail|outlook|live|msn)\./i.test(String(email || ""));
}
