export default function MetricsRow() {
  const metrics = [
    { label: 'Tu acceso a beneficios evoluciona con el tiempo', value: 'USD 2,400', sub: 'A medida que mantienes tu participación, puedes desbloquear nuevas etapas dentro del sistema.', icon: '📈' },
    { label: 'Simulación de acceso periódico', value: 'Visualización', sub: 'Basada en tu nivel actual y continuidad dentro del sistema.', icon: '📊' },
    { label: 'Tus beneficios activos', value: '4 accesos', sub: 'Estos son los beneficios disponibles según tu nivel actual.', icon: '✨' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: 16,
      marginBottom: 24,
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{m.icon}</div>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 6, letterSpacing: 0.5 }}>
            {m.label.toUpperCase()}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0A1F44', marginBottom: 4 }}>
            {m.value}
          </div>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            {m.sub}
          </div>
        </div>
      ))}
    </div>
  );
}