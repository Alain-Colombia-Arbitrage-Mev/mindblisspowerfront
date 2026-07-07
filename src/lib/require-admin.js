/**
 * require-admin.js — Server-side admin gate for the /dashboard routes.
 *
 * next/navigation and @/lib/admin-bff are imported LAZILY inside
 * assertAdminOrRedirect() so that `import { evaluateAccess }` works
 * under `node --test` without pulling in Next.js runtime modules or
 * unresolved path aliases.
 */

/** Pura y testeable — no depende del runtime de Next.js. */
export function evaluateAccess(email, isAdmin) {
  return email && isAdmin ? "allow" : "deny";
}

/** Server-only: verifica sesión admin o redirige a /login (fail-closed). */
export async function assertAdminOrRedirect() {
  const [{ redirect }, { sessionEmail, isAdminEmail }] = await Promise.all([
    import("next/navigation"),
    import("@/lib/admin-bff"),
  ]);
  try {
    const email = await sessionEmail();
    const isAdmin = email ? await isAdminEmail(email) : false;
    if (evaluateAccess(email, isAdmin) === "deny") redirect("/login");
    return email;
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err; // re-throw Next's redirect signal
    redirect("/login");
  }
}
