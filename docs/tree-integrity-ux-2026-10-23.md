# Lectura del arbol y posiciones

Fecha: 2026-10-23, America/Bogota. Rama `feature/tree-integrity-ux-20261023`.

La posicion sigue definida por `parent_id` y `position`, no por sponsor ni orden del array. No se escriben posiciones desde el frontend.

## Cambios

- BFF `/api/member/tree`: conteo real de hijos, campos aditivos `hasChildren`/`childrenComplete` y proteccion contra incluir la raiz dentro de su descendencia.
- `tree-read-model.mjs`: indice L/R que no reubica duplicados; recorrido iterativo y cobertura de respuestas parciales. Una ausencia sin cobertura confirmada se muestra como "Sin cargar", no como "Disponible". La tarjeta de posicion conserva tambien esa distincion y usa ID si falta el nombre de un ocupante.
- Un 401/403 al actualizar descarta datos privados previos. Un fallo temporal conserva una lectura explicitamente antigua con reintento.
- Profundidad visual desde raiz nivel 0, conteos etiquetados como cargados, limites existentes conservados. No se promete una red completa si el limite de nodos trunca el resultado.
- Nodos 176x308, texto mas legible, controles de 44 px, comandos agrupados y raiz centrada en movil. Los bloqueados siguen ocupando su lado con nombre "Not Available" y descendientes navegables.
- No se modifican fuentes financieras, PV, comisiones, pagos, permisos, rate limits ni autenticacion.

## Validacion

`npm test`: 138 pruebas, incluyendo ocho regresiones nuevas. `npm run typecheck`, `npm run lint` y build aprobados. Consulta real del BFF probada en PostgreSQL QA mediante:

```powershell
node scripts/test-member-tree-query.mjs --qa-docker
```

El script solo apunta al contenedor/DB QA fijos, crea datos sinteticos dentro de una transaccion y hace ROLLBACK. No prueba Cognito ni cambia la copia historica.

Para ver el componente sin autenticar, desde el repo admin despues de compilar ambos repositorios:

```powershell
$env:UI_PREVIEW_ROOT = 'D:\vicionpower\mindblisspowerfront'
$env:UI_PREVIEW_ENTRY = 'D:\vicionpower\mindblisspowerfront\scripts\ui-preview\tree.jsx'
bun scripts/preview-ui.mjs --fixtures
```

El visor imprime un puerto local; `/dashboard/network` muestra los datos de prueba y `?state=partial` una lectura incompleta. Este componente de prueba no llama APIs reales ni forma parte del runtime Next. La comparacion visual usa el mismo juego de posiciones que el visor admin, no todos los afiliados historicos.

Solo entrega local/Docker, sin publicacion a produccion. La copia historica contiene 121013 afiliados pero cero intents Stripe; no certifica volumenes actuales ni altas nuevas.
