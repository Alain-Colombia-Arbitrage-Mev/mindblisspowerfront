# Portal en Cloudflare Workers

Producción publicada en `https://mindblisspower.com` con acceso por email OTP.
Se verificaron login HTTP200, sesión anónima sin privilegios y claves públicas
del backend privado. El primer administrador todavía debe consumir su código
real en el navegador: aceptar el envío no prueba un inicio de sesión completo.
La publicación no habilita cobros, retiros ni compensación automática.

Este adaptador conserva Next.js 16.4.3, React y los comandos/Docker existentes.
OpenNext 1.20.13 declara Next `>=16.4.1` y Wrangler `^4.148.0`; aquí se fija
Wrangler 4.152.0. No se migra a vinext ni se degrada Next.

## Construcción local, sin secretos ni recursos remotos

- `npm run cf:build`: Docker Linux con copias permitidas explícitamente. No copia
  `.env`, `.dev.vars`, Git ni claves. Genera `.open-next` y valida un dry-run.
- `npm run cf:types`: tipos locales desde la configuración de staging.
- `npm run cf:dry-run`: validación Wrangler, **no publica**.
- `npm run cf:smoke`: ocho sondas del portal real en workerd, en contenedor
  read-only, sin red externa, base real, mensajes ni credenciales.
- `npm test` y `npm run typecheck`: regresiones Node y aislamiento de peticiones.

`cf:bundle` es la operación interna del contenedor. No ejecutarla en un checkout
con `.env.local`: Next carga archivos de entorno durante su compilación.

El middleware Node `src/proxy.js` no tiene soporte estable de OpenNext. Sólo la
copia aislada de Workers lo omite. `cloudflare-worker.mjs` vuelve a aplicar las
políticas originales de CSRF y separación de dominios, con el mismo matcher.
El archivo original y el despliegue Docker convencional quedan intactos.

## Requisitos antes de habilitar staging o producción

Staging sigue bloqueado y sin rutas. Producción tiene readiness explícito, su
dominio aprobado, binding privado del core e Hyperdrive lector comprobado con
caché desactivada. No hay `workers.dev` ni URLs de preview. Los secretos no están
en Git. No existe comando de publicación automática.

1. Vincular el Worker privado del núcleo como `CORE_API`. Hosts internos:
   `auth.core.internal`/`core.internal` (Bun), `payments.core.internal`,
   `withdrawals.core.internal` y `engine.core.internal` (Go). No cambia paths.
   El transporte en Workers rechaza destinos públicos, credenciales y otros
   hosts; no tiene alternativa mediante DNS público.
2. Crear/verificar fuera del build un Hyperdrive lector de la base curada con
   TLS del origen verificado y **caché de consultas deshabilitada**. Vincularlo
   como `HYPERDRIVE_MEMBER_FRESH`. El código no puede inspeccionar la caché real:
   el preflight de infraestructura debe comprobarla antes de poner
   `MEMBER_DB_QUERY_CACHE_DISABLED=true`.
   Confirmar permisos SELECT-only y `statement_timeout` acotado en el rol de
   origen. No se envían cambios de estado de sesión a Hyperdrive ni se depende
   de `default_transaction_read_only` para impedir escrituras.
3. Provisionar sólo los secretos necesarios mediante bindings privados:
   `AUTH_BFF_SHARED_SECRET` (32+ caracteres), `PAYMENTS_SERVICE_TOKEN`, el origen
   público HTTPS exacto (`AUTH_PUBLIC_ORIGIN`), issuer/audience y URL JWKS de
   Better Auth. `BETTER_AUTH_JWKS_URL=https://auth.core.internal/api/auth/jwks`
   viaja por `CORE_API`, no por Internet.
4. La UI selecciona Better Auth desde `AUTH_PROVIDER` en el servidor y usa sólo
   email OTP (6 dígitos), sin contraseña ni SMS. Registro y recuperación redirigen
   al acceso; no crean afiliados ni asignan posición. Los envíos muestran el mismo
   mensaje exista o no una cuenta. Un correo verificado sin identidad aprobada
   queda pendiente de revisión, no obtiene permisos de red. La base y el rol de autenticación
   también deben pasar el preflight del backend.
5. Revisar CSP, límites globales, errores, caché externa y rutas de cada entorno;
   probar login, sesión revocada, usuario bloqueado y autorización del árbol.
   No habilitar retiros ni procesos financieros por desplegar la infraestructura.
6. Sólo entonces registrar las rutas autorizadas y activar la bandera de readiness.

Cada petición Worker obtiene su cliente Postgres.js independiente, máximo una
conexión y `prepare=true`. El rol lector del origen debe imponer un timeout SQL
acotado y los permisos mínimos; no se altera estado de sesión a través del pool.
Hyperdrive mantiene el pool del origen. El cliente se cierra al finalizar,
cancelar o fallar el stream de respuesta, no al iniciar un SSR con streaming.
No se leen certificados del sistema de archivos en el camino Hyperdrive.
Node/Docker conserva su pool y configuración TLS previos.

El catálogo público no comparte promesas de E/S entre peticiones Worker. No se
provisionan R2, KV, caché ISR persistente ni optimización Images. Autenticación,
permisos, posiciones, rangos y saldos utilizan lecturas frescas; la instalación
Chatwoot queda fuera de esta etapa y conserva su base separada.

Fuentes: [OpenNext](https://opennext.js.org/cloudflare),
[Worker personalizado](https://opennext.js.org/cloudflare/howtos/custom-worker),
[Hyperdrive/Postgres.js](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/postgres-js/),
[caché de Hyperdrive](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/).

## Referidos y acceso — revisión del 2 de noviembre de 2026

La generación de enlaces usa el origen público de autenticación en runtime,
con `https://mindblisspower.com` como referencia canónica. Ya no comparte el
host retirado `app.mindblisspower.com`, ni copia URLs arbitrarias del API.
Conserva códigos opacos válidos y ramas explícitas `L`/`R`; un código demasiado
largo se rechaza, no se trunca a otro identificador. Todas las respuestas de
`/api/member/referral` son privadas, `no-store`, con `Vary: Cookie`.

El registro conserva la rama elegida antes del posterior acceso por email.
Los indicios se aíslan por correo en el navegador, con caducidad máxima de
30 días y 20 entradas; mirar otra cuenta no borra ni adopta sus referencias.
No son identidad, consentimiento financiero ni autoridad para cambiar un nodo.
El servidor conserva el patrocinador de afiliados existentes y valida los
indicios de compradores aún sin posición. No se habilita el escritor legado de
atribución ni se envían campos nuevos sin soporte a Better Auth.

Copiar/compartir conserva el diseño y comunica los fallos reales del portapapeles.
También se incluyen las mejoras de acceso por contraseña ya revisadas: ignorar
respuestas tardías y esperar la comprobación canónica antes de mostrar éxito;
recuperación exige HTTP200 con el acuse exacto. OTP, permisos, posiciones,
rangos, pagos y comisiones no cambian por esta publicación.

Verificación:581 pruebas del portal, TypeScript y ESLint correctos;54 pruebas
enfocadas, incluidos tres contratos BFF registro → confirmación → acceso →
checkout con transportes sintéticos. El build Linux/OpenNext pasó90 sondas de
workerd, sin red externa, consultas a DB ni mensajes reales. La misma imagen
probada se exportó como artefacto para publicar, sin cargar `.env.local`.

Límites: la atribución local no sincroniza dispositivos. Esta entrega corrige
los enlaces nuevos y copiados, pero no modifica DNS ni publica un alias para
los enlaces antiguos de `app.mindblisspower.com`; deben compartirse nuevamente
desde el panel. El límite diario de correo de Cloudflare es independiente de
estas reglas de caché; su restablecimiento no equivale a verificar al usuario.

Publicación confirmada a las17:07:58 de Bogotá del2 de noviembre: versión del
portal `5b7e6665-fdfa-470c-b3af-62dd016db306`, al100% del tráfico. Login,
recuperación y registro con ambos lados respondieron200; referido, árbol e
historial NOWPayments anónimos respondieron401, sin caché compartida ni cookies.
Ocho chunks y `BUILD_ID` coinciden con el mismo artefacto Linux probado; los
estáticos versionados siguen siendo inmutables. El build anterior se conservó
en el directorio ignorado `.wrangler/open-next-before-referrals-20261102-1700`.
Core, Admin, Hyperdrive, DNS y secretos no se modificaron. No se usaron códigos,
sesiones ni facturas reales para comprobar esta publicación.

El CLI Wrangler4.152.0 autodetecta OpenNext sin `--config` y puede delegar a un
flujo que exige conexión Hyperdrive local. El primer intento se detuvo antes
del upload. El código instalado confirma que `--config wrangler.jsonc` evita
esa autodetección; se validó dry-run y se publicó el artefacto ya probado con
la configuración explícita de producción y `--keep-vars`, sin proporcionar
credenciales locales de DB ni saltarse la validación de despliegue.
