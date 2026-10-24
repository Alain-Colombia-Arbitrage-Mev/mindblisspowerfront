# Dependencias Y Seguridad - 2026-10-24

Rama: `feature/security-dependencies-20261024`.

- Next.js 16.4.1 -> 16.4.3; aws-jwt-verify 4.0.1 -> 5.2.1; PostCSS 8.5.23 -> 8.5.31; ESLint/@eslint/js 9.39.2 -> 9.39.5. Lockfile actualizado con npm, sin forzar peers.
- npm audit inicial y final: 0 vulnerabilidades conocidas; auditoria de produccion tambien limpia. Esto no prueba ausencia de vulnerabilidades no publicadas.
- Ocho pruebas nuevas con JWT RSA firmados y JWKS en memoria: firma, identidad alterada, audiencia, emisor, tipo, expiracion y configuracion. Sin Cognito/OTP reales. Total Docker: 165 pruebas aprobadas; typecheck y build correctos. Revision lint enfocada sin errores.
- Workflow de seguridad para PR/branch/manual y gate npm audit bloqueante antes de despliegue. Workflows comprobados localmente, no ejecutados en GitHub.
- Login Docker real con estilos e imagen cargados, sin overflow a 1280px. No se modifico el diseno, posiciones ni calculos financieros.
- React 18 y ESLint 9 siguen mostrando avisos de deprecacion/soporte. No tienen alertas en esta auditoria npm; la migracion mayor requiere revisar peers. No se fuerza ESLint 10 porque el plugin React actual declara compatibilidad hasta 9; tampoco se migro React/Tailwind para este parche.
- No se modifico la DB historica ni se desplego a produccion. Se conserva el codigo del arbol de la rama anterior.

[Release oficial Next.js 16.4.3](https://github.com/vercel/next.js/releases/tag/v16.4.3).
