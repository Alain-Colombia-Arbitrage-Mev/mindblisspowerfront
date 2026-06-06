import { useState } from 'react';
import { Zap, Calendar, Share2, TrendingUp, Target } from 'lucide-react';
import ContentScheduler from './ContentScheduler';
import PlatformPublisher from './PlatformPublisher';
import EngagementMetrics from './EngagementMetrics';
import CampaignManager from './CampaignManager';

export default function SocialMediaControl() {
  const [activeTab, setActiveTab] = useState('content');

  const tabs = [
    { id: 'content', label: 'Content Scheduler', icon: Calendar },
    { id: 'publisher', label: 'Platform Publisher', icon: Share2 },
    { id: 'engagement', label: 'Engagement Metrics', icon: TrendingUp },
    { id: 'campaigns', label: 'Campaign Manager', icon: Target },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-8 rounded-2xl" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.25)' }}>
        <p style={{ color: '#ec4899', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
          SOCIAL CONTROL CENTER
        </p>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 12px 0' }}>
          Social Media Control
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Centralized management of social growth, content scheduling, and multi-platform engagement.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.id ? 'rgba(236,72,153,0.2)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#ec4899' : 'rgba(255,255,255,0.5)',
                border: activeTab === tab.id ? '1px solid rgba(236,72,153,0.3)' : '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'content' && <ContentScheduler />}
        {activeTab === 'publisher' && <PlatformPublisher />}
        {activeTab === 'engagement' && <EngagementMetrics />}
        {activeTab === 'campaigns' && <CampaignManager />}
      </div>
    </div>
  );
}