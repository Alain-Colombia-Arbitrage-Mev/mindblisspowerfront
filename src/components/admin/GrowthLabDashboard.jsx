import { useState } from 'react';
import { BarChart3, Beaker, Target, Zap, TrendingUp, Wand2, ChevronRight } from 'lucide-react';
import GrowthCampaigns from './GrowthCampaigns';
import GrowthExperiments from './GrowthExperiments';
import GrowthAudiences from './GrowthAudiences';
import GrowthAutomation from './GrowthAutomation';
import GrowthAnalytics from './GrowthAnalytics';
import GrowthContentEngine from './GrowthContentEngine';

const modules = [
  { id: 'campaigns', label: 'Campaigns', icon: BarChart3, desc: 'Create & manage growth campaigns' },
  { id: 'experiments', label: 'Experiments', icon: Beaker, desc: 'A/B testing system' },
  { id: 'audiences', label: 'Audiences', icon: Target, desc: 'User segmentation' },
  { id: 'automation', label: 'Automation', icon: Zap, desc: 'Trigger-based flows' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, desc: 'Performance tracking' },
  { id: 'content', label: 'Content Engine', icon: Wand2, desc: 'Dynamic content generation' },
];

const moduleComponents = {
  campaigns: GrowthCampaigns,
  experiments: GrowthExperiments,
  audiences: GrowthAudiences,
  automation: GrowthAutomation,
  analytics: GrowthAnalytics,
  content: GrowthContentEngine,
};

export default function GrowthLabDashboard() {
  const [activeModule, setActiveModule] = useState('campaigns');

  const ActiveComponent = moduleComponents[activeModule];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-white font-montserrat font-black text-2xl mb-2">Growth Lab</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Internal experimentation & optimization system</p>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(mod => {
          const Icon = mod.icon;
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className="p-6 rounded-xl text-left transition-all"
              style={{
                background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(13,31,60,0.6)',
                border: isActive ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <Icon size={20} style={{ color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.4)', marginBottom: 12 }} />
              <h3 className="text-white font-semibold text-sm mb-1">{mod.label}</h3>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{mod.desc}</p>
              {isActive && (
                <ChevronRight size={16} style={{ color: '#3b82f6', marginTop: 8 }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Module Content */}
      <div className="p-6 rounded-xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <ActiveComponent />
      </div>
    </div>
  );
}