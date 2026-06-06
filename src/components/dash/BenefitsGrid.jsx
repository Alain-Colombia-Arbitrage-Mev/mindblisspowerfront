export default function BenefitsGrid() {
  const benefits = [
    { icon: '🎯', title: 'Acceso plataforma', desc: 'Participación en ecosistema' },
    { icon: '💳', title: 'Beneficios monetarios', desc: 'Según tu nivel actual' },
    { icon: '🌍', title: 'Red global', desc: '35+ países conectados' },
    { icon: '📚', title: 'Formación incluida', desc: 'Módulos de desarrollo' },
  ];

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 20,
      padding: 32,
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      marginBottom: 24,
    }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: '#2F80ED', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Beneficios
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0A1F44', margin: 0, marginBottom: 4 }}>
          Tus beneficios activos
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
          Estos son los beneficios disponibles según tu nivel actual.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
      }}>
        {benefits.map((b, i) => (
          <div key={i} style={{
            padding: 20,
            background: '#F8FAFC',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>{b.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0A1F44', marginBottom: 4 }}>
                {b.title}
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                {b.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}