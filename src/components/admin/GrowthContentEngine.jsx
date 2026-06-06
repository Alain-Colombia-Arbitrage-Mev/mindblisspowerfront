import { useState } from 'react';
import { Plus, Wand2, Copy } from 'lucide-react';

export default function GrowthContentEngine() {
  const [templates] = useState([
    {
      id: 1,
      name: 'Onboarding CTA',
      variations: 3,
      usage: 2400,
      lastUpdated: '2026-04-10',
      performance: 'High'
    },
    {
      id: 2,
      name: 'Activation Email',
      variations: 5,
      usage: 1840,
      lastUpdated: '2026-04-08',
      performance: 'Medium'
    },
    {
      id: 3,
      name: 'Success Page Copy',
      variations: 2,
      usage: 940,
      lastUpdated: '2026-04-05',
      performance: 'High'
    },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Content Templates</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-vicion-blue text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-all">
          <Plus size={14} /> New Template
        </button>
      </div>

      <div className="space-y-2">
        {templates.map(t => (
          <div key={t.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <Wand2 size={14} style={{ color: '#a78bfa' }} /> {t.name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                  {t.variations} variations • {t.usage} uses
                </p>
              </div>
              <button className="text-white/40 hover:text-white/70 transition-all">
                <Copy size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <p style={{ color: 'rgba(255,255,255,0.3)' }}>Updated: {t.lastUpdated}</p>
              <span style={{ background: t.performance === 'High' ? 'rgba(16,185,129,0.2)' : 'rgba(251,146,60,0.2)', color: t.performance === 'High' ? '#10b981' : '#f59e0b', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                {t.performance}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}