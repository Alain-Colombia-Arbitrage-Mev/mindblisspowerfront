# Registro por email y contactos opcionales

El alta exige crear la cuenta y verificar el correo. El acceso mantiene el código
por email y la contraseña con correo previamente verificado. No hay registro ni
inicio de sesión por SMS, aunque queden variables antiguas en Cloudflare.

Teléfono y WhatsApp son contactos opcionales e independientes. El formulario
muestra país, ISO y prefijo; acepta número nacional o internacional y normaliza a
E.164 con `libphonenumber-js/min`. No admite extensiones. Una casilla permite
copiar explícitamente el teléfono a WhatsApp, sin implicar autorización de envío.

`POST /api/auth/register` sólo reenvía nombre, email, contraseña y los contactos
`contactPhone` / `contactWhatsapp` que no estén vacíos. El BFF firma ese cuerpo y
no reenvía cookies antiguas de prueba SMS ni campos de autoridad del navegador.
El backend valida de nuevo y guarda los contactos en columnas privadas y no
únicas de `auth.user`. No modifica números verificados ni enlaza cuentas legadas
por coincidencias de teléfono. Una persona nueva recibe su teléfono de contacto
sólo después de verificar el email.

Guardar un teléfono no verifica su titularidad, no autoriza publicidad y no
concede saldo, posición, rango o acceso a una cuenta anterior. La aprobación de
vinculación heredada, los controles de pagos y las políticas de caché privadas
permanecen independientes.

## Orden del despliegue

1. Aplicar la migración backend revisada
   `_meta/migration/76_registration_contact_details.sql` sobre la base productiva
   exacta y verificar los permisos mínimos. Sin backfill ni cambios de clientes.
2. Publicar el runtime de autenticación compatible con esas columnas.
3. Publicar el portal y comprobar que los endpoints telefónicos responden 404.

No publicar primero el portal: un backend anterior podría ignorar los contactos.
No publicar primero el runtime sin las columnas: rompería consultas del usuario.
La comprobación de Worker aislada usa sólo identidades y códigos sintéticos,
sin red externa, consultas reales o mensajes enviados.

## Publicación verificada — 2026-10-26

- Código del portal: `5e010c2`; Worker productivo:
  `e6bea468-302c-4d2b-8452-b67b30cb4c75`.
- Backend compatible: `e6df13d`; migración 76 aplicada antes del runtime y API
  publicada antes del portal. No cambios en clientes existentes ni Chatwoot.
- 381 pruebas, typecheck, build y 50 comprobaciones del Worker aislado aprobadas.
  Los recursos exportados se comprobaron también montados de sólo lectura.
- 19 comprobaciones públicas aprobadas: contactos con país, verificación de email,
  rutas SMS 404, acceso anónimo restringido, protección de origen, no-store de
  datos privados y caché/ETag de estáticos conservados. No registros ni mensajes
  reales durante estas comprobaciones.
