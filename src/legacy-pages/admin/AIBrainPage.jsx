/**
 * VICION AI Brain — Dedicated Admin Page
 * Route: /admin-dashboard/ai-brain
 */
import { useState } from 'react';
import AIBrain from '@/components/admin/AIBrain';
import Copilot from './Copilot';
import { Brain, Zap } from 'lucide-react';

export default function AIBrainPage() {
  const [tab, setTab] = useState('brain');

  return (
    <div className="max-w-[1400px]">
      <div className="flex gap-1 border-b mb-6" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {[
          { id: 'brain', label: 'AI Brain', icon: Brain },
          { id: 'copilot', label: 'AI Copilot', icon: Zap },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2"
              style={{ borderColor: tab === t.id ? '#3b82f6' : 'transparent', color: tab === t.id ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
              <Icon size={13} /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === 'brain' ? <AIBrain /> : <Copilot />}
    </div>
  );
}