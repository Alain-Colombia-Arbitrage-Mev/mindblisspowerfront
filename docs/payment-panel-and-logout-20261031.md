# Panel de pagos y cierre de sesión — 2026-10-31

## Publicación

- Portal: `287ca78b-1082-4c3c-b2a3-60bd5ad42b7e`, verificado al 100 % a las 06:35 UTC.
- Anterior para rollback: `8f6e7758-3e5b-4d99-9120-f6d8c95ca964`.
- Core y administrador conservan sus versiones anteriores. Sin migraciones, cambios de permisos, reglas financieras ni activación de retiros.
- Imagen de compilación Linux: `mindbliss/portal-panel-logout-20261031:local`, manifest `sha256:2950ae4c6cd602b9d1deaca0408a30fa3d85db5c87b11bd146a657a61c7c05b9`.

## Cambios

El encabezado y el menú lateral usaban un enlace GET a `/api/auth/logout`, aunque el receptor de Better Auth sólo admite POST. Ambos utilizan ahora un botón compartido: envía un único POST del mismo origen, espera una confirmación válida y sustituye el documento por `/login`. Sólo después de esa confirmación elimina las claves locales antiguas del miembro. Los fallos no se presentan como un cierre exitoso ni se reintentan automáticamente. El aviso del menú se muestra encima del botón para que no lo recorte el pie lateral.

El panel conserva Montserrat y los colores existentes. Separa capital, comisiones y ROI; mantiene los nueve importes del servidor sin sumarlos como saldo retirable. Las compras tienen tarjetas adaptables, estados con texto e iconos, referencias desplegables y acciones de al menos 44 px. Las reglas de retención y los detalles se conservan; los retiros externos continúan deshabilitados.

No cambian los lectores, las peticiones de compras, `can_resume`, `can_cancel`, la confirmación de cancelación local ni el montaje estable del historial durante la recarga del resumen. No se añade sondeo ni dependencia.

## Comprobaciones

- 507 pruebas del portal, TypeScript y ESLint: correctos.
- Compilación Linux y dry-run de producción: correctos.
- 85 comprobaciones con workerd sin red externa: correctas. Incluyen origen ajeno rechazado, GET sin mutación, POST firmado, cookies host-only eliminadas y sesión sintética revocada.
- Navegador local: escritorio, 390/320 px, tema claro/oscuro, carga/error/vacío, confirmación de cancelación, logout exitoso/fallido y dos botones compartiendo un solo POST.
- 13 comprobaciones públicas anónimas de producción y verificación del despliegue al 100 %: correctas.
- Los archivos JS de logout, resumen y balances publicados coinciden por SHA-256 con el paquete validado.

No se usaron sesiones reales para la prueba de cierre, códigos OTP, mensajes, facturas ni pagos reales. La comprobación pública no sustituye una prueba autenticada de un usuario.
