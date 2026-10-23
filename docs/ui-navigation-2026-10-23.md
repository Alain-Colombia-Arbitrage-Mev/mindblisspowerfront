# UI del miembro: navegacion y resumen

Rama: `feature/ui-navigation-20261023`. Base de auditoria local: `7611937`.
La revision de seguridad anterior permanece en su propio commit.

## Cambios

- Se conserva la identidad negra y amarilla, usando el simbolo de marca que
  ya existe en `public/mindbliss/mindbliss-symbol.png`.
- Navegacion y titulos en espanol, con deteccion por segmentos de ruta.
- Sidebar compacto; nombre y correo extensos no ensanchan la aplicacion.
- Menu movil con dialogo nativo: fondo inerte, Escape, foco restaurado,
  cierre al navegar o pasar a escritorio y bloqueo temporal de scroll.
- Cabecera sin buscador, selector de idioma ni notificaciones desconectados.
  Se conservan enlaces funcionales a mensajes, soporte, perfil y salida.
- Acceso al contenido por teclado y foco visible.
- Saldo y posicion antes de los enlaces de red; cifras tabulares y menos
  contenedores anidados. Las posiciones y los enlaces binarios no cambian.
- Carga, error recuperable y cero real son estados distintos. Las consultas
  anteriores se cancelan al recargar o desmontar el resumen.
- El saldo de billetera ya no se presenta como ganancias historicas; los
  primeros nodos binarios no se presentan como un total de referidos.
- Se elimina el contador fijo de cero tickets del resumen; soporte conserva
  su acceso directo sin inventar un dato de actividad.

## Verificacion

- `npm test`: 108 pruebas pasan, incluidas las nuevas de rutas.
- `npm run build`: compilacion de produccion correcta.
- ESLint de los componentes y helpers editados: sin errores. La configuracion
  existente no incluye DashboardShell en ese comando; el build si lo compila.
- Playwright sobre componentes reales en una fixture aislada: 1440x1000,
  768x1024, 390x844, 375x667 y 844x390; sin desbordamiento horizontal ni
  excepciones JavaScript.
- Probados teclado, Escape, fondo, cierre por ruta, cambio a escritorio,
  carga lenta, saldo legitimo en cero y fallo de billetera/red con reintento.
- La suite global de TypeScript sigue teniendo deuda anterior. No se
  deshabilitaron sus comprobaciones para aprobar esta entrega.

## Limites y revision manual

La fixture y las capturas estan en
`D:/vicionpower/reportes/ui-navigation-20261023/`. Ejecutar `smoke.mjs` con
Node y `CODEX_NODE_MODULES` apuntando a Playwright; requiere Bun en PATH y
ambos repositorios compilados. `serve.mjs` se ejecuta con Bun y muestra URLs
locales de solo lectura. Los datos son sinteticos y no certifican saldos.

El smoke no sustituye una prueba autenticada en staging. No se modifican
cookies, gates de Cognito, endpoints, pagos, reglas de comisiones ni la base
de datos. Sin push ni despliegue de produccion en esta fase.
