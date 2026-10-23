# Reparacion de errores de lint

Rama: `feature/lint-cleanup-20261023`. Base: `d239db5`.
Sin push ni despliegue. El backend, las bases de datos y el codigo del
repositorio administrativo no se modificaron.

## Alcance

Se corrigieron los 269 errores `unused-imports/no-unused-imports` reportados
en la fase de cache: 218 eran iconos y el resto imports sin uso de React,
graficos y componentes/helpers locales. La limpieza afecta 137 archivos.

La correccion mecanica se limito a esa regla de ESLint. No se desactivaron
reglas ni se cambiaron scripts, dependencias, configuracion, permisos,
formularios, JSX, consultas, calculos de dinero o posiciones del arbol.

En `CollaborationNotification` y `ContractManager` se conserva un import
sin bindings de `base44Client`: cargarlo inicializa el SDK y los parametros
del navegador. `NotificationPanel` conserva de igual manera la inicializacion
heredada de `notificationEngine`. Eliminar esos modulos completos hubiera
cambiado su evaluacion; una migracion de esos servicios requiere otra revision.

Las dependencias puras retiradas de componentes se revisaron. En
`AdminUsersPanel`, `UnifiedDataEngine` sigue importado directamente; en
`AdminLayout`, el hook sigue importando `AdminSessionManager`.

## Comprobacion de invariancia

Se compararon las AST de los 137 archivos contra `d239db5`, normalizando
LF/CRLF y omitiendo posiciones del parser. Al excluir `ImportDeclaration`,
las AST son identicas: no se modificaron funciones, expresiones, JSX ni
exports. Se retiraron exactamente 269 bindings y no se agregaron modulos
ni bindings nuevos.

## Validacion

- Cliente `npm run lint`: pasa, cero errores. La ejecucion completa de
  ESLint mantiene 154 avisos de variables sin usar, sin convertirlos en
  errores ni ocultarlos con una nueva configuracion.
- Cliente `npm test`: 117 correctas; admin `npm test`: 37 correctas.
- `npm run build`: correcto en ambos repositorios.
- Admin `npm run lint`: pasa, cero errores y 11 avisos previos.
- Playwright sobre componentes reales con HTTP sintetico: cinco viewports
  por app, menus, busqueda, estados de carga/error/cero y reintentos,
  sin excepciones JavaScript ni desbordamiento horizontal.
- Regresion de llamadas API: Perfil sigue haciendo tres GET, Administradores
  y Comunicados dos cada uno; cinco visitas a Rangos hacen un GET de catalogo
  y cinco de posicion. Las mejoras de cache se conservan.
- Next compilado local: login 200 en escritorio/movil; API privada sin
  sesion 401; sesion anonima administrativa fail-closed y `private, no-store`.
- `git diff --check`: correcto.

## Pendiente separado

`npm run typecheck` no pasa. Se comparo el programa TypeScript completo con
un CompilerHost que usa las fuentes originales de `d239db5` en memoria,
sin revertir archivos: 413 errores antes y 413 despues, sin diagnosticos
nuevos (comparados por archivo, codigo y mensaje).

Esta rama corrige los 269 errores de lint solicitados, no certifica la
eliminacion de esa deuda de tipos. Debe abordarse por modulos con pruebas
especificas; no se agregaron `any`, `ts-ignore`, `ts-nocheck` ni exclusiones
para aparentar un resultado correcto. Falta tambien la validacion
autenticada en staging antes de una publicacion.
