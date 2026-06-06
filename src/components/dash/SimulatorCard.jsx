import { useState } from 'react';

export default function SimulatorCard() {
  const [level, setLevel] = useState('growth');
  const [months, setMonths] = useState(12);

  const projections = {
    start: { months: 12, value: 1200 },
    growth: { months: 12, value: 2400 },
    advance: { months: 12, value: 5800 },
  };

  const result = projections[level];
  const monthlyValue = Math.floor(result.value / result.months);

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 20,
      padding: 32,
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      marginBottom: 24,
    }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: '#2F80ED', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Proyección
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0A1F44', margin: 0 }}>
          Simula tu crecimiento
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 28 }}>
        {/* Left: inputs */}
        <div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#0A1F44', marginBottom: 8 }}>
              Nivel
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['start', 'growth', 'advance'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: `2px solid ${level === l ? '#2F80ED' : '#E2E8F0'}`,
                    background: level === l ? '#2F80ED' : '#FFFFFF',
                    color: level === l ? '#FFFFFF' : '#0A1F44',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#0A1F44', marginBottom: 8 }}>
              Meses: {months}
            </label>
            <input
              type="range"
              min="3"
              max="36"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              style={{
                width: '100%',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>

        {/* Right: output */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginBottom: 8, letterSpacing: 0.5 }}>
            PROYECCIÓN TOTAL
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#2F80ED', marginBottom: 12, lineHeight: 1 }}>
            USD {Math.floor((result.value / result.months) * months).toLocaleString()}
          </div>
          <div style={{
            fontSize: 12,
            color: '#64748B',
            paddingTop: 12,
            borderTop: '1px solid #E2E8F0',
          }}>
            USD {monthlyValue.toLocaleString()} / mes estimado
          </div>
        </div>
      </div>

      <button style={{
        width: '100%',
        padding: 14,
        background: '#2F80ED',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#1E68D4'}
      onMouseLeave={(e) => e.currentTarget.style.background = '#2F80ED'}
      >
        Ver detalles de este plan
      </button>
    </div>
  );
}