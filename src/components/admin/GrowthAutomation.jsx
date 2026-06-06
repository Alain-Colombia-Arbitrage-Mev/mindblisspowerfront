import { useState } from 'react';
import { Plus, Zap } from 'lucide-react';

export default function GrowthAutomation() {
  const [automations, setAutomations] = useState([
    { id: 1, name: 'Onboarding Drip', trigger: 'New signup', action: 'Send email sequence', status: 'active', executions: 2340 },
    { id: 2, name: 'Activation Nudge', trigger: 'Day 3 inactive', action: 'Push notification', status: 'active', executions: 1840 },
    { id: 3, name: 'Churn Prevention', trigger: '30 days inactive', action: 'Win-back campaign', status: 'paused', executions: 640 },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Automation Flows</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-vicion-blue text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-all">
          <Plus size={14} /> New Flow
        </button>
      </div>

      <div className="space-y-2">
        {automations.map(auto => (
          <div key={auto.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white text-sm font-medium flex items-center gap-2">
                <Zap size={14} style={{ color: '#f59e0b' }} /> {auto.name}
              </p>
              <span style={{ background: auto.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)', color: auto.status === 'active' ? '#10b981' : '#6b7280', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                {auto.status}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
              {auto.trigger} → {auto.action}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 4 }}>
              Executions: {auto.executions.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}