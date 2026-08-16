// Helpers de teléfono (puros y testeables) compartidos por el registro/login.
// El valor que se guarda/manda a Cognito es E.164; el formateo es solo visual.

// Combina código de país (E.164, p.ej. "+57") + número local en E.164.
// Quita todo lo no-dígito del local y los ceros iniciales (troncal nacional).
export function composePhone(dialCode, local) {
  const digits = String(local || "").replace(/\D/g, "").replace(/^0+/, "");
  return `${dialCode}${digits}`;
}

// Valida un número en formato E.164 (+ seguido de 8 a 15 dígitos, sin empezar en 0).
export function isValidE164(phone) {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

// Agrupa los dígitos del número local en bloques de 3 para mostrarlo legible
// (300 123 4567). Solo formato visual; máx 15 dígitos (tope E.164).
export function formatLocalPhone(local) {
  const digits = String(local || "").replace(/\D/g, "").slice(0, 15);
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}
