export default function HeroCard({ user }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 20,
      padding: 40,
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ color: '#2F80ED', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Valor total
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0A1F44', margin: 0, marginBottom: 8, lineHeight: 1.2 }}>
          $12,500
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', margin: 0, lineHeight: 1.6, maxWidth: 500 }}>
          Este es el valor que has construido dentro del sistema hasta hoy.
        </p>
      </div>

      {/* Main metrics grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 32,
        marginBottom: 32,
        paddingBottom: 32,
        borderBottom: '1px solid #E2E8F0',
      }}>
        {/* Participación acumulada */}
        <div>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 8, letterSpacing: 0.5 }}>
            PARTICIPACIÓN
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#0A1F44', lineHeight: 1.1 }}>
            USD 1,000
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            Tu participación acumulada
          </div>
        </div>

        {/* Estado */}
        <div>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 8, letterSpacing: 0.5 }}>
            ESTADO ACTUAL
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#27AE60', lineHeight: 1.1 }}>
            Activo
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            Desde hace 45 días
          </div>
        </div>

        {/* Evolución */}
        <div>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 8, letterSpacing: 0.5 }}>
            EVOLUCIÓN
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#2F80ED', lineHeight: 1.1 }}>
            68%
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            Tu avance refleja tu permanencia y actividad
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
          <span>Crecimiento</span>
          <span>68%</span>
        </div>
        <div style={{
          height: 8,
          background: '#E2E8F0',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: '68%',
            background: 'linear-gradient(90deg, #2F80ED, #5BA3F5)',
            borderRadius: 4,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>
    </div>
  );
}