import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Zap } from 'lucide-react';

export default function InternalSimulator() {
  const [months, setMonths] = useState(12);
  const [level, setLevel] = useState('Growth');
  const [continuity, setContinuity] = useState(80);

  const levels = ['Start', 'Growth', 'Advance', 'Pro'];
  const simulatedBenefit = Math.round((months / 12) * 1500 * (levels.indexOf(level) + 1) * (continuity / 100));
  const unlockedFeatures = Math.ceil((months / 6) * 2);

  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1f3c, #0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 24 }}>
      <div style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat, sans-serif', marginBottom: 4, textTransform: 'uppercase' }}>
        Herramienta interactiva
      </div>
      <h3 style={{ color: 'white', fontSize: 18, fontWeight: 800, fontFamily: 'Montserrat, sans-serif', marginBottom: 16 }}>
        Simula tu crecimiento
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>
            Tiempo: {months} meses
          </label>
          <Slider value={[months]} onValueChange={(v) => setMonths(v[0])} min={1} max={60} step={1}
            className="w-full"
            style={{ height: 6 }}
          />
        </div>
        <div>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>
            Nivel
          </label>
          <select value={level} onChange={(e) => setLevel(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: 'white', fontSize: 12, fontWeight: 600 }}>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>
            Continuidad: {continuity}%
          </label>
          <Slider value={[continuity]} onValueChange={(v) => setContinuity(v[0])} min={0} max={100} step={5}
            className="w-full"
            style={{ height: 6 }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>BENEFICIOS PROYECTADOS</div>
          <div style={{ color: '#60a5fa', fontSize: 22, fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
            ${simulatedBenefit}
          </div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>CARACTERÍSTICAS DESBLOQUEADAS</div>
          <div style={{ color: '#34d399', fontSize: 22, fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>
            +{unlockedFeatures}
          </div>
        </div>
      </div>

      <div style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Zap size={14} style={{ color: '#fbbf24' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Resultado simulado basado en parámetros ingresados</p>
      </div>
    </div>
  );
}