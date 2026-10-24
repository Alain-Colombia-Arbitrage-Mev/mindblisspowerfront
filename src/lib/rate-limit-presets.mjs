/**
 * Presets de rate limit por endpoint y construcción de sus reglas.
 * Per-endpoint rate-limit presets and their rule construction.
 *
 * Módulo puro (sin `next/server`) para que se pueda ejercitar con
 * `node --test` junto al limitador real. El guardia que responde 429 vive en
 * `auth-rate-limit.js`, que consume esto.
 *
 * Pure module (no `next/server`) so it can be exercised with `node --test`
 * against the real limiter. The guard that returns a 429 lives in
 * `auth-rate-limit.js`, which consumes this.
 */

import { otpSendRules } from "./otp-send-policy.js";

const MIN = 60_000;

// Cada preset define reglas por IP y/o por email (por minuto salvo indicación).
// Each preset defines per-IP and/or per-email rules (per minute unless noted).
export const PRESETS = {
  // Endpoints que ENVÍAN correo/OTP (los más caros: SES + Cognito).
  send: { ip: { limit: 20, windowMs: MIN }, email: { limit: 5, windowMs: MIN } },
  // Intentos de inicio de sesión (password / código).
  login: { ip: { limit: 10, windowMs: MIN }, email: { limit: 10, windowMs: MIN } },
  // Verificación de un código ya recibido (anti fuerza-bruta del OTP).
  verify: { ip: { limit: 10, windowMs: MIN }, email: { limit: 10, windowMs: MIN } },
  // Alta de cuenta.
  register: { ip: { limit: 15, windowMs: MIN } },
  catalog: { email: { limit: 5, windowMs: MIN } },
  // Baja de comunicados: NO envía correo, y un comunicado a toda la base
  // concentra miles de bajas en pocos minutos. Detrás de un CGNAT o del proxy
  // de imágenes/enlaces de Gmail muchas personas comparten IP, así que el
  // límite por IP tiene que ser holgado: con el preset "send" (20/min) el 21.º
  // clic recibía 429 y la persona quedaba suscrita contra su voluntad. El
  // límite estricto va por token, que es lo que hay que proteger de fuerza
  // bruta. Tampoco aplica el cooldown de OTP: la baja es idempotente.
  unsubscribe: { ip: { limit: 600, windowMs: MIN }, email: { limit: 5, windowMs: MIN } },
};

/**
 * Construye las reglas del preset. Devuelve null si el preset no existe (el
 * caller deja pasar la petición, igual que antes).
 *
 * Builds the preset's rules. Returns null when the preset does not exist (the
 * caller lets the request through, same as before).
 *
 * @param {{name:string, preset:keyof PRESETS, ip:string, email?:string}} opts
 * @returns {{key:string,limit:number,windowMs:number}[]|null}
 */
export function presetRules({ name, preset, ip, email }) {
  const conf = PRESETS[preset];
  if (!conf) return null;

  const rules = [];
  if (conf.ip) rules.push({ key: `${name}:ip:${ip}`, limit: conf.ip.limit, windowMs: conf.ip.windowMs });
  if (conf.email && email) {
    rules.push({ key: `${name}:email:${email}`, limit: conf.email.limit, windowMs: conf.email.windowMs });
  }
  // El cooldown/hora de OTP solo aplica a los endpoints que ENVÍAN el código.
  if (preset === "send") rules.push(...otpSendRules(email));
  return rules;
}
