// Política de contraseña — DEBE reflejar la del pool Cognito us-east-1_8tLjOfPH1:
// mínimo 8, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo. Puro y testeable;
// se usa para el checklist en vivo del registro/reset (evita el rechazo tardío
// "La contraseña no cumple la política configurada en Cognito").
export const PASSWORD_RULES = [
  { key: "length", label: "Al menos 8 caracteres", test: (p) => p.length >= 8 },
  { key: "upper", label: "Una letra mayúscula (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "Una letra minúscula (a-z)", test: (p) => /[a-z]/.test(p) },
  { key: "number", label: "Un número (0-9)", test: (p) => /[0-9]/.test(p) },
  { key: "symbol", label: "Un símbolo (! @ # $ % …)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// Evalúa la contraseña contra la política. Devuelve el detalle por regla + si es
// válida en conjunto.
export function checkPassword(password) {
  const p = String(password || "");
  const results = PASSWORD_RULES.map((r) => ({ key: r.key, label: r.label, met: r.test(p) }));
  return { results, valid: results.every((r) => r.met) };
}

// true si la contraseña cumple TODA la política.
export function isValidPassword(password) {
  return checkPassword(password).valid;
}
