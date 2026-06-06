import { useState } from 'react';
import { Plus, TrendingUp } from 'lucide-react';

export default function GrowthExperiments() {
  const [experiments, setExperiments] = useState([
    { id: 1, name: 'CTA Button Color Test', variant_a: 'Blue Button', variant_b: 'Green Button', winner: 'B', confidence: 94 },
    { id: 2, name: 'Onboarding Copy Variant', variant_a: 'Short form', variant_b: 'Long form', winner: null, confidence: 72 },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">A/B Experiments</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-vicion-blue text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-all">
          <Plus size={14} /> New Experiment
        </button>
      </div>

      <div className="space-y-2">
        {experiments.map(exp => (
          <div key={exp.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between mb-2">
              <p className="text-white text-sm font-medium">{exp.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Confidence: {exp.confidence}%</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: 8, borderRadius: 6 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Variant A</p>
                <p className="text-white">{exp.variant_a}</p>
              </div>
              <div style={{ background: exp.winner === 'B' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', padding: 8, borderRadius: 6 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Variant B</p>
                <p className="text-white">{exp.variant_b}</p>
                {exp.winner === 'B' && <p style={{ color: '#10b981', fontSize: 10, marginTop: 4 }}>✓ Winner</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}