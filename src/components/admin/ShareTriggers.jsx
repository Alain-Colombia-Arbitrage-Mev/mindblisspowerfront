import { useState } from 'react';
import { Plus, Zap, Power } from 'lucide-react';

export default function ShareTriggers() {
  const [triggers, setTriggers] = useState([
    { id: 1, event: 'Account Activation', action: 'Show share modal', status: 'active' },
    { id: 2, event: 'First Purchase', action: 'Send referral email', status: 'active' },
    { id: 3, event: 'Milestone Reached', action: 'Display share banner', status: 'paused' },
    { id: 4, event: 'Rank Promotion', action: 'Trigger celebratory invite', status: 'active' },
  ]);

  const toggleTrigger = (id) => {
    setTriggers(triggers.map(t => 
      t.id === id ? { ...t, status: t.status === 'active' ? 'paused' : 'active' } : t
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Share Event Triggers</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-vicion-blue text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-all">
          <Plus size={14} /> New Trigger
        </button>
      </div>

      <div className="space-y-2">
        {triggers.map(trigger => (
          <div key={trigger.id} className="p-4 rounded-lg flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <p className="text-white text-sm font-medium flex items-center gap-2">
                <Zap size={14} style={{ color: '#f59e0b' }} /> {trigger.event}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
                Action: {trigger.action}
              </p>
            </div>
            <button
              onClick={() => toggleTrigger(trigger.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: trigger.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)',
                color: trigger.status === 'active' ? '#10b981' : '#9ca3af',
              }}
            >
              <Power size={12} /> {trigger.status}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}