# Recuperación del login por correo — 2026-10-30

Un acuse perdido no demuestra que no exista un código. El formulario permite
introducir un código posiblemente recibido después de timeout, 5xx, 429 o un 2xx
sin el contrato esperado. No muestra una confirmación de entrega; no reenvía
automáticamente. El cooldown conserva el plazo del servidor y usa 300 segundos
como espera segura cuando no hay otro plazo válido.

Envío, reenvío y canje quedan ligados al correo original. Durante el envío no se
puede editar el destinatario; Enter duplicado, desmontaje y respuestas tardías
no generan solicitudes adicionales ni aplican resultados a otro correo.
Los errores explícitos 400/401/403 no se reinterpretan como éxito.

Se explica siempre que los usuarios antiguos que aún no crearon su nuevo acceso
deben hacerlo en Registro y verificar su correo. Se conserva la atribución de
referido/lado. Verificar un correo no concede propiedad de una cuenta del árbol:
la vinculación requiere revisión/aprobación. No se revela públicamente si un
correo está registrado ni se crean cuentas desde login.

No cambian diseño, permisos, políticas privadas de caché ni el backend financiero.
La base productiva sólo tenía una cuenta Better Auth en la inspección agregada;
la migración del árbol no implica que se hayan creado sus accesos de identidad.

397 pruebas, typecheck y ESLint efectivo aprobados (sin errores). Build Linux y
dry-run aprobados. Smoke offline sobre imagen y exportación exacta: 50/50 sondas,
sin red externa, DB ni mensajes. Artefactos anteriores conservados en
`.wrangler/artifacts-before-login-recovery-20261030`.

Publicado en `mindblisspower.com`: fuentes `7e2ca2c`, Worker
`469f02c7-7d8b-40c0-ba10-5f78f57acaea`, después de confirmar la API versión 5
saludable. Trece sondas públicas de seguridad/registro/caché aprobadas. La guía
de nuevo acceso aparece en el HTML productivo. No se ha demostrado una nueva
entrega real de OTP en esta publicación: la autorización de prueba sigue pendiente.

No se han realizado envíos masivos, creado accesos heredados ni marcado correos
verificados. Migrar accesos pendientes requiere una decisión independiente;
publicar el frontend no aprovisiona las cuentas de identidad.
