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

390 pruebas, typecheck y ESLint revisado aprobados. Publicación de esta corrección
pendiente de recuperar el motor Docker local y verificar imágenes/Worker Linux;
no confundir estas fuentes con los artefactos anteriores ya publicados.
