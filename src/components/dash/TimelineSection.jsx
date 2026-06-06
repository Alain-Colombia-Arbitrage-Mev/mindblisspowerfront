import { Check } from 'lucide-react';

export default function TimelineSection() {
  const events = [
    { label: 'Cuenta creada', date: 'Feb 26', completed: true },
    { label: 'Email verificado', date: 'Feb 27', completed: true },
    { label: 'Nivel Growth activado', date: 'Mar 1', completed: true },
    { label: 'Primer beneficio', date: 'Mar 15', completed: true },
    { label: 'Meta próximo nivel', date: 'May 15', completed: false },
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
          Progreso
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0A1F44', margin: 0, marginBottom: 4 }}>
          Tu evolución dentro del sistema
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
          Tu avance refleja tu permanencia y actividad.
        </p>
      </div>

      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {events.map((e, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 16,
            marginBottom: i < events.length - 1 ? 24 : 0,
            position: 'relative',
          }}>
            {/* Timeline dot and line */}
            <div style={{
              position: 'absolute',
              left: -28,
              top: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: e.completed ? '#27AE60' : '#E2E8F0',
                border: `2px solid ${e.completed ? '#27AE60' : '#E2E8F0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}>
                {e.completed && <Check size={12} color="#FFFFFF" />}
              </div>
              {i < events.length - 1 && (
                <div style={{
                  width: 2,
                  height: 24,
                  background: e.completed ? '#27AE60' : '#E2E8F0',
                  marginTop: 8,
                }} />
              )}
            </div>

            {/* Content */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0A1F44', marginBottom: 2 }}>
                {e.label}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>
                {e.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}