import UnsubscribeForm from "./UnsubscribeForm";

export const metadata = { title: "Darse de baja · Mindbliss Power" };

export default async function BajaPage({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const token = typeof sp.t === "string" ? sp.t : "";
  return (
    <main style={{ maxWidth: 520, margin: "48px auto", padding: "0 16px", color: "var(--vp-text)" }}>
      <h1 className="auth-display text-3xl">Comunicados por correo</h1>
      <p style={{ marginTop: 12 }}>Si confirmas, dejarás de recibir los comunicados generales de Mindbliss Power. Los correos de tu cuenta (códigos de acceso, comprobantes y soporte) seguirán llegando.</p>
      <UnsubscribeForm token={token} />
    </main>
  );
}
