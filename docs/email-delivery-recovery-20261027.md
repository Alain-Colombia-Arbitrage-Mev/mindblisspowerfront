# Recuperación del correo de registro

Los errores confirmados de envío tras crear una cuenta requieren recuperar su
verificación, no crear otra cuenta. Sólo el código backend exacto
`503/AUTH_EMAIL_DELIVERY_UNAVAILABLE` produce en el BFF
`503/EMAIL_DELIVERY_UNAVAILABLE` con email normalizado, `registrationPending`,
`requiresConfirmation` y espera manual de 300 segundos. Ningún error genérico,
email distinto o HTTP 200 puede activar este estado. No se reenvía nada solo.

El formulario pasa a verificación, limpia las contraseñas y explica que no se
pudo enviar el código. No concede sesión, propiedad de teléfono, acceso heredado
ni autorización financiera. El inicio de sesión sigue siendo genérico para no
revelar la existencia de una cuenta. Teléfono y WhatsApp siguen siendo contactos
opcionales no verificados.

Para envíos se permite una espera acotada: navegador 30 s, BFF 20 s, proveedor
8 s, contemplando el arranque del Container y la base. Canjes conservan 12 s en
navegador y 8 s en BFF. Todos respetan cancelación; no hay reintentos ni caché de
códigos. Las políticas de assets y no-store privados no cambian.

390 pruebas, typecheck y ESLint revisado aprobados. Build Linux, dry-runs y 50
sondas offline del Worker aprobados, también sobre el artefacto exportado exacto;
sin red externa, consultas reales ni mensajes. Los artefactos anteriores se
conservan en `.wrangler/artifacts-before-email-delivery-20261027`.

Publicado en `mindblisspower.com`: Worker
`49d6c274-825d-4421-b6c5-2b2661214f68`, fuentes `5195b4c`, después de confirmar
la API nueva versión 4 saludable. Pasaron 13 sondas públicas sin autenticarse:
registro/contactos, sesión, permisos, JWKS, CSRF, rutas telefónicas deshabilitadas,
assets inmutables, ETag 304 y 404 sin caché larga. Los tres chunks nuevos responden
200 e incluyen la recuperación de envío. No se crearon cuentas ni enviaron más
correos reales durante el despliegue; la comprobación pública no afirma haber
completado un registro real nuevo. Pagos, árbol, rangos y Chatwoot no cambian.
