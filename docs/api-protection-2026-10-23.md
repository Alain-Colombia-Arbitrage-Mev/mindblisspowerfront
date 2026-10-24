# Cache y proteccion de lecturas

Rama: `feature/api-protection-20261023`, sobre `b22fb60`.
Cambios locales, sin push ni despliegue.

## Reglas

| Recurso | Cache / limite |
| --- | --- |
| Catalogo de paquetes/rangos no personal | Next Data Cache: 300s existentes |
| Catalogo de rangos en navegador | 60s existentes, memoria de la pestana |
| Catalogo con cache fria | Una carga concurrente por proceso, dos consultas SQL |
| Invalidacion administrativa del catalogo | 5/min por identidad verificada |
| Posicion de miembro | 120/min por identidad verificada |
| Arbol completo del miembro | 30/min por identidad verificada |
| Consulta de rangos | 60/min por identidad verificada |
| Lecturas combinadas de miembro | 180/min por identidad verificada |
| Consultas activas del arbol hacia Postgres | 32 por proceso, sin cola ilimitada |

`MEMBER_TREE_MAX_CONCURRENT` acepta 1..128; valores invalidos usan 32.
No es el numero de conexiones SQL: el pool existente sigue teniendo max=4.
Cada replica tiene su propio pool y cupo; dimensionar su suma antes de escalar.

## Garantias y compatibilidad

- El limitador se ejecuta despues de verificar el JWT y antes de consultar
  Postgres. Usuarios que comparten IP no comparten su presupuesto de lectura.
- Las claves nuevas usan hash de la identidad, nunca parametros `email`
  elegidos por el navegador. La tabla local de contadores tiene maximo
  50.000 claves; no desaloja cuotas activas de OTP para admitir nuevas claves.
- El arbol conserva sus SQL, limites de filas, posiciones y gates de blacklist.
  El cupo se libera tambien si la consulta falla. Sobrecarga: 503; cuota
  agotada: 429. Ambos devuelven espera sugerida y `private, no-store`.
- Rangos verifica ahora la firma de la sesion, no solo la presencia de cookie.
- Single-flight no retiene respuestas completas ni errores. Copia resultados
  para cada consumidor; tras invalidar, las cargas antiguas siguen la nueva
  generacion para no reinsertar valores obsoletos en el cache exterior.
- Invalidar exige admin y Origin del mismo sitio. Usa
  `revalidateTag("catalog", { expire: 0 })`, compatible con Next instalado.
  Clientes HTTP internos deben enviar Origin correcto y su sesion.
- El GET de resumen de pagos conserva errores/espera del backend y tiene
  plazo de 20s, unido a la cancelacion del cliente. No se agregan reintentos
  a checkout, retiros, OTP ni otras mutaciones.
- No se agregan TTL a dinero, roles, blacklist o posiciones. Los TTL privados
  preexistentes de Go no se aumentan. Los presets de OTP/login no se relajan.

## Pruebas y limites

- `npm test`: 126 pruebas. Incluye 1.100 lectores de catalogo con una sola
  carga, cuotas por identidad, recuperacion, invalidacion durante cargas y
  rechazo de 1.100 trabajos adicionales cuando el cupo SQL esta ocupado.
- `npm run lint` y `npm run build`: correctos. Persisten avisos anteriores.
- Playwright: conteos de API de la fase anterior conservados; cinco viewports,
  menus y estados de error/carga/cero sin regresiones.
- Next compilado: cookie malformada de rangos rechazada con 401 y no-store;
  invalidacion cross-origin 403; APIs privadas sin sesion 401.
- La deuda de TypeScript sigue separada: 413 errores de base, 412 tras usar
  correctamente revalidateTag; sin diagnosticos nuevos en la comparacion.

Contadores y single-flight son locales a cada proceso Next. Para varias
replicas, estos no sustituyen limites compartidos ni un cache handler de
Next compartido para invalidacion coordinada. El TTL de 300s puede servir
catalogo antiguo mientras Next revalida; el navegador suma hasta 60s de
retencion propia. No se promete frescura de precios en 60s ni capacidad
para 1.100 usuarios reales sin una prueba de carga autenticada en staging.
