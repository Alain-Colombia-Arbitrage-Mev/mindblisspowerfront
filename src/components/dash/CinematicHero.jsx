import { useState } from 'react';

const SCENARIOS = {
  control: {
    name: 'Control',
    description: 'Gestión total de tu red y estructura',
  },
  growth: {
    name: 'Crecimiento',
    description: 'Expansión constante y rendimiento sostenido',
  },
  precision: {
    name: 'Precisión',
    description: 'Decisiones informadas, resultados medibles',
  },
  vision: {
    name: 'Visión',
    description: 'Perspectiva a largo plazo y liderazgo estratégico',
  },
};

export default function CinematicHero({ user }) {
  const [scenario, setScenario] = useState('control');
  const current = SCENARIOS[scenario];

  return (
    <div style={{
      position: 'relative',
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 28,
      background: 'linear-gradient(135deg, #05070D 0%, #080f1e 50%, #0a0d1a 100%)',
      border: '1px solid rgba(59,130,246,0.1)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
    }}>

      {/* Subtle radial atmosphere */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 700px 400px at 20% 50%, rgba(59,130,246,0.06) 0%, transparent 65%), radial-gradient(ellipse 400px 300px at 80% 80%, rgba(124,58,237,0.04) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Top edge highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '52px 56px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* Scenario label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} />
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.25em',
            textTransform: 'uppercase', color: '#3b82f6',
          }}>
            {current.name}
          </span>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1 style={{
            fontSize: 40, fontWeight: 900, margin: 0,
            fontFamily: 'Montserrat, sans-serif',
            lineHeight: 1.15, letterSpacing: '-0.5px',
            color: 'white',
            maxWidth: 560,
          }}>
            Tu visión de{' '}
            <span style={{ color: '#3b82f6' }}>largo plazo</span>
          </h1>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.65, maxWidth: 460, margin: 0,
          }}>
            {current.description}. Construida sobre estabilidad y crecimiento constante.
          </p>
        </div>

        {/* CTA row */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
          <button
            style={{
              padding: '11px 26px', borderRadius: 10,
              background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
              color: 'white', fontWeight: 700, fontSize: 13,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => e.target.style.boxShadow = '0 6px 28px rgba(59,130,246,0.45)'}
            onMouseLeave={e => e.target.style.boxShadow = '0 4px 20px rgba(59,130,246,0.3)'}
          >
            Explorar →
          </button>
          <button
            style={{
              padding: '11px 26px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.65)', fontWeight: 600, fontSize: 13,
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer', transition: 'all 200ms ease',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(59,130,246,0.1)'; e.target.style.borderColor = 'rgba(59,130,246,0.3)'; e.target.style.color = 'white'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.color = 'rgba(255,255,255,0.65)'; }}
          >
            Más información
          </button>
        </div>
      </div>

      {/* Scenario selector */}
      <div style={{
        position: 'absolute', bottom: 20, right: 20,
        display: 'flex', gap: 6, zIndex: 20,
      }}>
        {Object.entries(SCENARIOS).map(([key, data]) => (
          <button
            key={key}
            onClick={() => setScenario(key)}
            style={{
              height: 28, padding: '0 12px', borderRadius: 6,
              background: scenario === key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
              border: scenario === key ? '1px solid rgba(59,130,246,0.45)' : '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer', transition: 'all 200ms ease',
              fontSize: 9, fontWeight: 700,
              color: scenario === key ? '#93C5FD' : 'rgba(255,255,255,0.35)',
              letterSpacing: '0.3px', textTransform: 'uppercase',
            }}
          >
            {data.name}
          </button>
        ))}
      </div>
    </div>
  );
}