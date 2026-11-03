# Pausa de nuevos cobros Stripe

`STRIPE_CHECKOUT_ENABLED` es una variable de runtime privada del servidor. Sólo
el valor exacto `true` permite iniciar o reanudar un checkout Stripe. Ausencia,
`false` u otros valores bloquean. La configuración base, staging y producción
declaran `false`; no se utilizan variables `NEXT_PUBLIC_*` ni claves del proveedor.

- `POST /api/payments/checkout` conserva origen estricto, JSON, identidad verificada
  y validación de entrada. Stripe explícito o proveedor omitido devuelve
  `503 {"error":"stripe_checkout_disabled"}` sin contactar pagos.
- `GET /api/pay/resume` no consume su token ni consulta pagos mientras esté pausado;
  redirige al catálogo con `303` y `private, no-store`.
- El catálogo pasa sólo un booleano al selector existente. Stripe aparece
  deshabilitado; NOWPayments conserva su contrato, disponibilidad y revisión.
- No se modifican los webhooks, las ventas históricas, el historial ni la
  configuración de NOWPayments. Este cambio no habilita ningún servicio financiero.

Las sesiones Stripe alojadas creadas antes de esta pausa no se cancelan con este
cambio del portal. Su expiración/cancelación requiere una revisión y operación
separada en el proveedor; no se ejecuta ninguna operación real en esta revisión.

Pruebas locales: políticas y handlers puros, selector React real y smoke del Worker
con proveedor/identidad sintéticos. El smoke comprueba cero llamadas de creación y
reanudación Stripe, y conserva una llamada NOWPayments con `review_required`.
