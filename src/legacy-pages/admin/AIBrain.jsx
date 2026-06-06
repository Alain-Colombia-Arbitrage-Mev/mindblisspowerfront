import { useState } from 'react';
import AIBrain from '@/components/admin/AIBrain';
import AICopilotConsole from '@/components/admin/AICopilotConsole';
import AutoModeConsole from '@/components/admin/AutoModeConsole';
import LegalAIPanel from '@/components/admin/LegalAIPanel';
import { Brain, Zap, Activity, Scale } from 'lucide-react';
import AlertDisplay from '@/components/admin/AlertDisplay';

export default function AIBrainPage() {
  const [tab, setTab] = useState('brain');

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {[
          { id: 'brain', label: 'AI Brain', icon: Brain },
          { id: 'copilot', label: 'AI Copilot', icon: Zap },
          { id: 'automode', label: 'Auto Mode', icon: Activity },
          { id: 'legal', label: 'Legal AI', icon: Scale },
      ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all"
              style={{ borderColor: tab === t.id ? '#3b82f6' : 'transparent', color: tab === t.id ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>
      <AlertDisplay maxAlerts={5} />
      {tab === 'brain' && <AIBrain />}
      {tab === 'copilot' && <AICopilotConsole />}
      {tab === 'automode' && <AutoModeConsole compact />}
      {tab === 'legal' && <LegalAIPanel />}
    </div>
  );
}