# Cliente Y Arbol: Carga De Datos

Fecha: 2026-10-24. Rama: `feature/member-tree-data-20261024`.

## Causas

- El arbol, referidos y rangos del cliente consultan PostgreSQL mediante `MEMBER_DATABASE_URL` con un rol de lectura. No usan la conexion Go de pagos. Docker QA tenia configurados los servicios Go, pero no esta conexion.
- La pagina de red esperaba conjuntamente arbol, pagos y referidos. Un fallo de red/JSON o demora en cualquiera podia impedir que se publicara el arbol aunque su consulta hubiera terminado correctamente.
- Una respuesta HTTP 200 incompleta podia clasificarse como una cuenta sin posicion. Los importes de comisiones ausentes se convertian en cero y los enlaces fallidos podian parecer pendientes de activacion.

## Cambios

- Lecturas independientes y validadas; cada seccion se publica en cuanto responde. Timeout de 15 segundos y cancelacion al cambiar de vista o actualizar.
- Errores recuperables de pagos/referidos no ocultan el arbol. Si falta una lectura, no se inventan saldos, puntos, ausencia de pagos ni necesidad de comprar una membresia.
- Cualquier 401/403 invalida la vista privada y cancela las otras lecturas. La sesion expirada ofrece iniciar sesion; no se relaja Cognito.
- Los reintentos son manuales. Se conserva la sincronizacion acotada de una colocacion pendiente tras pago confirmado; la primera consulta ya no fuerza `fresh=1` y puede aprovechar la cache del backend.
- Conexion PostgreSQL limitada a 5 segundos; consultas siguen con `statement_timeout=8000`, pool de 4 y TLS obligatorio salvo desactivacion explicita en QA local.
- La prueba SQL usa el rol QA de lectura y valida tanto respuesta parcial como completa. No se cambio el SQL productivo de colocacion, los padres ni los lados del arbol.
- Harness reproducible de componentes reales: `bun scripts/preview-member-data.mjs --fixtures`. Solo loopback, datos sinteticos y GET; no hace llamadas a servicios reales.

## Verificacion

- Docker: typecheck, build optimizado y 157 pruebas aprobadas. Lint enfocado en los archivos editados: sin errores.
- `node scripts/test-member-tree-query.mjs --qa-docker`: SQL real de `/api/member/tree` ejecutado con `qa_member_read`. Conserva bloqueado L, miembro R, descendiente R bajo el bloqueado, `rootSide=L`, niveles y cobertura parcial/completa. Fixtures en transaccion con ROLLBACK.
- Desde backend, `diagnose-member.mjs --qa-docker`: el modulo real `memberDb` conecta desde un contenedor de pruebas que comparte la red del cliente. Verificados `read_only=on`, 2 personas, 0 afiliados, sin permisos de escritura en afiliados ni acceso al esquema auth.
- GET anonimos de arbol, referidos y pagos: HTTP 401. Smoke general: 24 comprobaciones HTTP aprobadas. Las 15 lecturas Go de la auditoria anterior siguen correctas.
- Navegador: arbol normal; fallo y demora de pagos sin bloquear nodos; timeout con arbol visible; respuesta invalida sin falsa activacion pendiente; sesion expirada en pagos elimina nodos; lectura parcial conserva lados y marca espacio no cargado; resumen con billetera fallida y posicion visible; referido fallido con reintento y copia deshabilitada.
- Inspeccion visual a 1280 px y 390x844: los nuevos errores no desbordan la pagina. Consola sin errores JavaScript durante el reintento de enlaces. Viewport restaurado al terminar.

## Limites

La base historica recuperada permanece intacta y no esta conectada a esta aplicacion. QA usa una base sintetica casi vacia. Cognito aun no esta configurado: no se ha verificado una sesion real de extremo a extremo, ni los datos de un cliente real. No hubo OTP, emails, cobros, cambios de comisiones o despliegue a produccion.

Para certificar datos reales: preparar una copia aislada de trabajo del respaldo, validar esquema y conteos, configurar su rol de lectura y Cognito por un canal seguro, y probar con una sesion autorizada. No conectar el unico respaldo a una aplicacion con permisos de escritura ni activar demo sobre datos reales.
