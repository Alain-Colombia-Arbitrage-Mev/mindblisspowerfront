import { useState } from 'react';
import { TrendingUp, Info } from 'lucide-react';

export default function SimulationEngine() {
  const [level, setLevel] = useState(5000);
  const [months, setMonths] = useState(12);
  const [userType, setUserType] = useState('active');
  const [continuity, setContinuity] = useState(80);
  const [scenario, setScenario] = useState('active');

  // Escenarios predefinidos
  const scenarios = {
    conservador: { continuity: 60, months: 12, userType: 'basic', name: 'Conservador' },
    activo: { continuity: 80, months: 24, userType: 'active', name: 'Activo' },
    expansivo: { continuity: 95, months: 36, userType: 'leader', name: 'Expansivo' },
  };

  // Obtener valores según escenario seleccionado
  const getScenarioValues = (scenarioKey) => {
    const s = scenarios[scenarioKey];
    return { continuity: s.continuity, months: s.months, userType: s.userType };
  };

  // Usar valores del escenario si está activo, sino los inputs manuales
  const activeLevel = level;
  const activeMonths = scenario ? getScenarioValues(scenario).months : months;
  const activeContinuity = scenario ? getScenarioValues(scenario).continuity : continuity;
  const activeUserType = scenario ? getScenarioValues(scenario).userType : userType;

  // Cálculo de beneficios
  const calculateBenefits = () => {
    const baseValue = activeLevel;
    const timeMultiplier = activeMonths / 12; // Convertir a años
    const continuityFactor = (activeContinuity / 100) * timeMultiplier;
    
    // Multiplicador por tipo de usuario
    const userTypeMultiplier = {
      basic: 0.5,
      active: 1.0,
      leader: 1.5,
    }[activeUserType] || 1.0;

    const benefitIndex = (baseValue * 0.02) * continuityFactor * userTypeMultiplier;

    return {
      baseAccess: baseValue,
      expandedAccess: Math.floor(baseValue * 1.25),
      continuousAccess: Math.floor(baseValue * 1.5),
      estimatedBenefit: Math.floor(benefitIndex),
      monthlyBenefit: Math.floor(benefitIndex / (activeMonths || 1)),
    };
  };

  const benefits = calculateBenefits();

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 20,
      padding: 32,
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
      marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, color: '#2F80ED', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
          Simulador
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0A1F44', margin: 0, marginBottom: 4 }}>
          Explora escenarios
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
          Ajusta tu participación y visualiza cómo evoluciona tu acceso a beneficios.
        </p>
      </div>

      {/* Scenario buttons */}
      <div style={{ marginBottom: 28, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {Object.entries(scenarios).map(([key, data]) => (
          <button
            key={key}
            onClick={() => setScenario(scenario === key ? null : key)}
            style={{
              padding: 12,
              borderRadius: 12,
              border: `2px solid ${scenario === key ? '#2F80ED' : '#E2E8F0'}`,
              background: scenario === key ? '#2F80ED' : '#F8FAFC',
              color: scenario === key ? '#FFFFFF' : '#0A1F44',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {data.name}
          </button>
        ))}
      </div>

      {/* Inputs grid */}
      {!scenario && (
        <div style={{ marginBottom: 28, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {/* Nivel */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A1F44', marginBottom: 8 }}>
              Nivel de participación
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2F80ED', minWidth: 80 }}>
                USD {level.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Tiempo */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A1F44', marginBottom: 8 }}>
              Período
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="1"
                max="60"
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2F80ED', minWidth: 80 }}>
                {Math.floor(months / 12) > 0 ? `${Math.floor(months / 12)}a ${months % 12}m` : `${months}m`}
              </div>
            </div>
          </div>

          {/* Tipo de usuario */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A1F44', marginBottom: 8 }}>
              Perfil
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                fontSize: 12,
                color: '#0A1F44',
                cursor: 'pointer',
              }}
            >
              <option value="basic">Básico</option>
              <option value="active">Activo</option>
              <option value="leader">Líder</option>
            </select>
          </div>

          {/* Continuidad */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0A1F44', marginBottom: 8 }}>
              Continuidad
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="0"
                max="100"
                value={continuity}
                onChange={(e) => setContinuity(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#27AE60', minWidth: 60 }}>
                {continuity}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        {/* Acceso base */}
        <div style={{
          padding: 16,
          background: '#F8FAFC',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
        }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginBottom: 8, letterSpacing: 0.5 }}>
            ACCESO BASE
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0A1F44' }}>
            USD {benefits.baseAccess.toLocaleString()}
          </div>
        </div>

        {/* Acceso ampliado */}
        <div style={{
          padding: 16,
          background: '#F8FAFC',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
        }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginBottom: 8, letterSpacing: 0.5 }}>
            ACCESO AMPLIADO
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2F80ED' }}>
            USD {benefits.expandedAccess.toLocaleString()}
          </div>
        </div>

        {/* Acceso continuo */}
        <div style={{
          padding: 16,
          background: '#F8FAFC',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
        }}>
          <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, marginBottom: 8, letterSpacing: 0.5 }}>
            ACCESO CONTINUO
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#27AE60' }}>
            USD {benefits.continuousAccess.toLocaleString()}
          </div>
        </div>

        {/* Beneficio estimado */}
        <div style={{
          padding: 16,
          background: 'linear-gradient(135deg, #2F80ED15, #2F80ED08)',
          borderRadius: 12,
          border: '1px solid #2F80ED30',
        }}>
          <div style={{ fontSize: 11, color: '#2F80ED', fontWeight: 600, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            BENEFICIO PROYECTADO
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2F80ED', marginBottom: 4 }}>
            USD {benefits.estimatedBenefit.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            ~USD {benefits.monthlyBenefit.toLocaleString()}/mes
          </div>
        </div>
      </div>

      {/* Info note */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginTop: 20,
        padding: 12,
        background: '#F8FAFC',
        borderRadius: 8,
        border: '1px solid #E2E8F0',
      }}>
        <Info size={16} style={{ color: '#94A3B8', flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 11, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
          Los valores proyectados se calculan en función de tu nivel de participación, continuidad y perfil. Los resultados son estimaciones basadas en el modelo.
        </p>
      </div>
    </div>
  );
}