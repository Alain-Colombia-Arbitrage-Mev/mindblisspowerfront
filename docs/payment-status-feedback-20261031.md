# Resultado visible de «Ver estado» — 2026-10-31

Publicado en el portal como `447887ea-0366-4ce7-bb68-5e72c6481c6e`, verificado al 100 % a las 06:44 UTC. Rollback anterior: `287ca78b-1082-4c3c-b2a3-60bd5ad42b7e`. Core, administrador, contratos HTTP y base de datos no cambian.

## Causa y corrección

La consulta funcionaba pero colocaba su resultado en un aviso global sobre el historial, fuera de la vista al pulsar una compra inferior. Sus errores también se confundían con fallos de acciones de cobro.

Ahora cada compra tiene su propio resultado accesible debajo de las acciones: consultando, pendiente, pago confirmado con activación pendiente, membresía activada, revisión o error específico. El botón se asocia con el resultado mediante `aria-describedby`. La hora se rotula como consulta al servidor en Bogotá, nunca como fecha de pago o actualización del proveedor.

El nuevo adaptador vuelve a validar el recibo completo y la referencia antes de mostrar éxito. Una confirmación válida sólo restringe continuar/cancelar; nunca concede capacidades que el servidor no haya autorizado. El bloqueo se conserva si una consulta posterior falla o el historial llega antiguo. Un fallo transitorio del historial permite consultar el estado autenticado de una fila existente, sin habilitar mutaciones. Un rechazo de sesión elimina las filas privadas.

La consulta lee el estado registrado, no pregunta a NOWPayments en vivo. Un estado pendiente no demuestra que el usuario no haya enviado fondos. No se añaden reintentos automáticos, sondeo, dependencias ni peticiones de cobro. Abrir una factura no confirma un pago. Cancelar localmente continúa sin revocar la factura externa.

## Verificación

- 516 pruebas del portal, TypeScript y ESLint correctos; 23 pruebas dirigidas de compras/recibos/adaptador.
- Compilación Linux y dry-run de producción correctos. Imagen `mindbliss/portal-payment-status-20261031:local`, manifest `sha256:3696a007e53521d9cff8ecce067b65ac135e2f98aad70bfa6b474d1a043dbad6`.
- 85 comprobaciones workerd sin red externa y 13 comprobaciones públicas anónimas correctas.
- Navegador con componentes reales y datos sintéticos: resultado pendiente en su tarjeta, confirmación sin activación, bloqueo por orden, error específico, temas claro/oscuro y adaptación 320/390 px.
- Los archivos publicados, incluido el nuevo resultado de consulta, coinciden por SHA-256 con el paquete validado.
- Diagnóstico de sólo lectura: consultas de ownership y estado ejecutables, permisos requeridos presentes. No se encontró un fallo de tablas o vinculación que justificase cambiar el backend.

No se crearon sesiones, pagos, facturas ni códigos OTP reales para probar. No se alteraron importes, saldos, árbol, comisiones, retenciones ni retiros. No se realizó una prueba HTTP autenticada con una sesión de producción.
