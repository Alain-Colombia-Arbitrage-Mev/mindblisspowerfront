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

397 pruebas, typecheck y ESLint efectivo aprobados (sin errores). Build Linux,
smoke offline y publicación de esta corrección pendientes de registrar.
No se han realizado envíos masivos ni marcado correos verificados.
