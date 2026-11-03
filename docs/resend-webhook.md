# Webhook de Resend para OTP

Endpoint previsto: `POST https://mindblisspower.com/api/webhooks/resend`.
La existencia de este documento no confirma que el código esté publicado ni
que esté configurado el secreto; revisar la evidencia de despliegue al final.

Remitente aprobado para los OTP: `otp@mindblisspower.com`. Se configura en
`AUTH_EMAIL_FROM` del backend emisor, no en el navegador. El dominio necesita
verificación y la cuenta Resend debe tener cuota/autorización de envío.

El ID de inbox facilitado por el titular,
`f8cfa476-7441-41e6-bd4a-3122c288837b`, es una referencia operativa. No es una
API key, un ID de plantilla, un código OTP o el secreto de firma. Los eventos
de entrega `email.*` no requieren ese ID para enviar un OTP. Esta integración
no descarga ni procesa correos entrantes o archivos adjuntos de dicho inbox.

## Configuración en Resend

1. En [Webhooks](https://resend.com/webhooks), elige **Add webhook**.
2. Introduce exactamente la URL anterior, sin query ni barra final.
3. Selecciona sólo estos eventos: `email.sent`, `email.delivered`,
   `email.delivery_delayed`, `email.bounced`, `email.complained`, `email.failed`
   y `email.suppressed`. No se requiere tracking de aperturas/clics ni eventos
   de recepción de emails o de inbox para enviar OTP.
4. Resend entrega un **Signing secret**, normalmente con prefijo `whsec_`.
   Guárdalo como `RESEND_WEBHOOK_SECRET` en el archivo local ignorado
   `backend/.env.local`, nunca en el chat o Git. Ese archivo es sólo el origen
   operativo: el secreto debe instalarse en el Worker receptor del portal,
   no en los servicios Go ni en variables públicas del navegador.
5. Con el código publicado y secreto instalado, el receptor requiere además
   `RESEND_WEBHOOK_ENABLED=true`. Sin ambos devuelve 503: no acepta eventos
   sin verificar ni simula un webhook habilitado.
6. Para comprobar entrega real, solicita autorización para los destinatarios
   antes de enviar nuevos OTP. También puede reenviarse un evento existente
   desde Resend; no es necesario crear una cuenta o generar un código nuevo.

`RESEND_API_KEY` es diferente: pertenece sólo al backend emisor y necesita
permiso de envío restringido al dominio. Crear el webhook desde el panel no
requiere ampliar esa clave. No usar un secreto inventado o el inbox UUID como
reemplazo del Signing secret emitido para este endpoint.

## Garantías y límites

Se verifica la firma Svix HMAC-SHA256 sobre los bytes originales, ID y timestamp
de la solicitud, con tolerancia de cinco minutos. El cuerpo y los encabezados
tienen límites y la lectura tiene plazo máximo. Las firmas rotadas se admiten
según el contrato Svix. No se redirige ni se transforma el JSON antes de validar.

El receptor procesa sólo avisos de entrega del remitente OTP aprobado. Un
evento firmado que no corresponda al flujo se ignora sin reflejar datos.
Las respuestas y diagnósticos no incluyen destinatarios, asuntos, contenido,
códigos, firmas, claves ni IDs del proveedor. El endpoint no requiere una
sesión humana; la firma válida es la autenticación del proveedor. No hay CORS
público, cookies de sesión o caché compartida.

Este receptor es **sólo notificación**. No escribe en PlanetScale ni inicia
Containers, no marca correos verificados, no crea sesiones, no cambia bloqueos
o supresiones y no toca pagos, árbol, rangos o comisiones. Los eventos aceptados
no se almacenan como un historial durable local. El historial del proveedor
sigue siendo la fuente para investigar cada destinatario. La observabilidad
del Worker conserva su configuración previa; no se promete una alerta o un
registro durable sólo porque exista un ACK.

`email.delivered` significa que el servidor destinatario aceptó el correo,
no que llegó a la bandeja principal, se leyó o el usuario comprobó su OTP.
Únicamente canjear el código en Better Auth prueba el control de la dirección.

Svix/Resend pueden repetir eventos. No hay efectos de negocio que duplicar
en este receptor y no se afirma entrega exactly-once. Antes de añadir futuros
efectos secundarios se necesitarán almacenamiento durable, deduplicación por
`svix-id` y confirmación posterior a persistir, no una caché en memoria.

## Contraste documental y pruebas sin envío

La [base de conocimiento](https://resend.com/docs/knowledge-base/introduction)
es el índice de ayuda. Para el contrato se revisaron las referencias de
[sent](https://resend.com/docs/webhooks/emails/sent),
[delivered](https://resend.com/docs/webhooks/emails/delivered),
[delivery_delayed](https://resend.com/docs/webhooks/emails/delivery-delayed),
[bounced](https://resend.com/docs/webhooks/emails/bounced),
[complained](https://resend.com/docs/webhooks/emails/complained),
[failed](https://resend.com/docs/webhooks/emails/failed) y
[suppressed](https://resend.com/docs/webhooks/emails/suppressed).
Comparten `type`, `created_at` y `data`; esta última incluye `email_id` y
`from`, que puede contener nombre visible. Rebotes, fallos y supresiones
añaden sus respectivos objetos de detalle. El receptor no registra esos
detalles, destinatarios, etiquetas ni asuntos.

Las pruebas de `src/lib/resend-webhook.test.mjs` usan ejemplos **sintéticos**
con esa estructura y claves exclusivamente de prueba. Incluyen los siete
eventos, los metadatos específicos y UTF-8 fragmentado, además del vector
público de firma Svix. No son notificaciones capturadas de Resend y no
demuestran que su cuenta tenga el webhook, la clave o el envío habilitados.

La [documentación de creación](https://resend.com/docs/webhooks/create-webhook)
advierte que puede haber duplicados y orden distinto. Un ACK HTTP 200 sólo
confirma recepción; el receptor continúa siendo `notification_only`.
Según [Svix](https://docs.svix.com/receiving/verifying-payloads/how-manual),
`svix-timestamp` corresponde al intento. Por eso un evento histórico puede
aceptarse si Resend lo firma nuevamente dentro de la ventana, mientras que
reutilizar la firma vieja después de cinco minutos se rechaza. `created_at`
no reemplaza ese control de seguridad ni verifica una cuenta.

Para una comprobación real sin generar otro OTP, con acceso a la cuenta y
el Signing secret instalado, abre **Webhooks → endpoint → mensaje → Replay**.
Resend permite repetir mensajes exitosos o fallidos; revisa allí la respuesta
del nuevo intento. No reutilices manualmente headers caducados ni inventes un
secreto de producción. Si no existe un evento previo, las pruebas locales no
sustituyen esa comprobación real. Un 503 por configuración pendiente no debe
presentarse como éxito: Resend reintenta con espera creciente y puede
deshabilitar un endpoint que falle continuamente; comprobar su estado y
rehabilitarlo desde el panel cuando quede configurado.

[`email.received`](https://resend.com/docs/webhooks/emails/received) describe
correo entrante, no la validación de un destinatario OTP. Las pruebas confirman
que éste, los eventos de inbox/tracking y los tipos desconocidos firmados se
ignoran; siguen requiriendo firma válida y no crean sesiones ni verifican emails.

Referencias oficiales:
[firmas Resend](https://resend.com/docs/webhooks/verify-webhooks-requests),
[contrato Svix](https://docs.svix.com/receiving/verifying-payloads/how-manual),
[tipos de evento](https://resend.com/docs/webhooks/event-types),
[reintentos](https://resend.com/docs/webhooks/retries-and-replays).

## Evidencia de publicación — 2 de noviembre de 2026, 21:25 Bogotá

Publicado el receptor en `mindbliss-portal-production`, versión
`4cb59f82-1c04-4f7d-9eb5-40799aabb16d`, con 100 % de tráfico. Despliegue:
`bb620f2d-f381-4962-9730-f4a4ea8af7b5` (2026-11-03 02:25:45 UTC).

Se reutilizó el mismo artefacto Next.js que estaba en producción: 1.839 archivos
con SHA-256 agregado `6bff71819384ee1f9ddac9090cbffbf08734efa2a346771ac4bf374015103de0`,
idéntico a la imagen verificada `mindbliss/portal-referrals-20261102:verified`.
Sólo cambió el wrapper/receptor y su flag; no se recompiló la UI ni se sustituyó
ningún archivo público. Wrangler confirmó que no había assets actualizados.

Comprobaciones aprobadas: suite del portal, typecheck, ESLint, 12 pruebas
focalizadas de firma/ingreso y 98 probes en workerd con red deshabilitada,
cero consultas reales a la base y cero correos. Revisión independiente sin
bloqueos. Ocho archivos JavaScript servidos por producción coinciden por hash
con el artefacto verificado; login y registro conservan HTTP 200 y la API de
árbol sin sesión devuelve 401.

El receptor público devuelve GET 405, POST 503 `email_callback_unavailable`
sin secreto, query no admitida 400 y subruta no admitida 404; todas las
respuestas llevan `private, no-store`. No se ha instalado
`RESEND_WEBHOOK_SECRET`: falta crearlo en Resend para habilitar la recepción
firmada. No se enviaron mensajes ni se registró el webhook en la cuenta Resend,
ni se activó el transporte de email, ni se cambiaron Core, API, Admin, DNS o datos.

## Habilitación y pruebas — 2 de noviembre de 2026, 21:38 Bogotá

El propietario guardó `RESEND_WEBHOOK_SECRET` y la URL canónica en el entorno
local ignorado. Se instaló exclusivamente el Signing secret en el portal,
conservando las demás credenciales. Versión publicada
`44780292-ced0-4537-b1d9-d46b10d15db9`, despliegue
`d46510b1-a881-4c1d-b861-0d7bc79d13bd`, 100 % de tráfico. El 503 descrito
arriba corresponde a la etapa anterior, sin secreto.

En producción, POST sin firma devuelve 401 con no-store. Siete peticiones
**sintéticas**, firmadas con la clave instalada y los tipos permitidos,
devolvieron 200, `received: true`, `mode: notification_only`. No fueron eventos
originados por Resend ni verificaciones de identidad. Un tail posterior observó
un evento firmado `email.sent` del proveedor, sin imprimir payload, destinatario,
OTP ni identificadores. Al admitir reintentos, no se atribuye ese evento a una
compra, usuario o envío concreto sólo por su hora. No se habilitaron logs
persistentes ni se afirmó entrega a bandeja por un ACK.

Verificación final del código: 598 pruebas de portal, 17 focalizadas del webhook,
ESLint y 98 probes workerd aprobadas. El smoke usó la imagen verificada, cuatro
montajes read-only, red deshabilitada, cero consultas y cero correos reales.
Las pruebas reales de las tres plantillas se registran separadamente en el
runbook del backend: el propietario confirmó su recepción. No se cambió UI,
árbol, datos, sesiones ni permisos; la clave de envío sólo se instaló en Core,
nunca en este receptor público.
