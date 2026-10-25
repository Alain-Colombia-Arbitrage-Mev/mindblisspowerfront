# Mindbliss — portal de miembros

Aplicación Next.js. El navegador consume las rutas del mismo origen; las
credenciales de servicios y de PostgreSQL pertenecen únicamente al servidor.

## Desarrollo

Usar la versión Node fijada en Docker/CI e instalar con `npm ci`.
Consultar `deployments/env/production.env.example` para los nombres de configuración;
crear la configuración local fuera de Git y no copiar valores reales al ejemplo.

```sh
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

## Módulos sencillos

| Ubicación | Responsabilidad |
| --- | --- |
| `src/hooks/useMemberSummary.js` | Lectura validada, cancelación y recarga del resumen |
| `src/hooks/useCheckoutActivation.js` | Ciclo de confirmación compartido por modal y página |
| `src/lib/checkout-read.mjs` | Polling serial, límites, cancelación y backoff |
| `src/lib/checkout-status.mjs` | Transiciones de estado puras, probadas sin React |
| `src/lib/payment-display.mjs` | Presentación de importes conocidos/desconocidos |
| `src/app/dashboard/packages/` | Vistas pequeñas de ventas, retiros y confirmación |

Una URL con `paid=1` no demuestra pago. La confirmación necesita evidencia del
servidor; el árbol sólo se consulta después de comprobar activación. No se repiten
intentos en paralelo ni se conserva una respuesta financiera para otra consulta.

En recuperación, las ventas Stripe no se confunden con pagos/comisiones al miembro.
Un saldo `null` se muestra como pendiente de cálculo y no permite solicitar retiro.
El servidor sigue siendo responsable de identidad, autorización y bloqueo de pagos.

## Docker y publicación

El build usa lockfiles y cachés de compilación; excluye `.env`, claves y respaldos.
El runtime standalone es distroless y no privilegiado. Si se usa filesystem de sólo
lectura, montar `/app/.next/cache` como tmpfs de UID/GID 65532 y tamaño acotado.

Las ramas y PRs ejecutan verificaciones. La publicación de imágenes y el despliegue
son operaciones separadas, no consecuencias automáticas de subir una rama.
