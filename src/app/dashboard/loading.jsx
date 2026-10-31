export default function DashboardLoading() {
  return (
    <section className="executive-page" aria-busy="true" aria-label="Cargando sección del portal">
      <div className="executive-container">
        <p role="status" aria-live="polite" className="text-sm">Cargando sección…</p>
        <div aria-hidden="true" className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="executive-panel min-h-32" />
          <div className="executive-panel min-h-32" />
        </div>
      </div>
    </section>
  );
}
