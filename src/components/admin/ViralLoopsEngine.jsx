import { useState } from 'react';
import { Share2, Gift, Users, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import ReferralControl from './ReferralControl';
import ShareTriggers from './ShareTriggers';
import RewardLogic from './RewardLogic';
import InviteTracking from './InviteTracking';

const sections = [
  { id: 'referral', label: 'Referral Control', icon: Users, desc: 'Manage referral system' },
  { id: 'share', label: 'Share Triggers', icon: Share2, desc: 'Configure share events' },
  { id: 'rewards', label: 'Reward Logic', icon: Gift, desc: 'Define reward structure' },
  { id: 'tracking', label: 'Invite Tracking', icon: BarChart3, desc: 'Monitor invitations' },
];

const sectionComponents = {
  referral: ReferralControl,
  share: ShareTriggers,
  rewards: RewardLogic,
  tracking: InviteTracking,
};

export default function ViralLoopsEngine() {
  const [activeSection, setActiveSection] = useState('referral');
  const [viralCoefficient, setViralCoefficient] = useState(1.24);
  const [invitesActive, setInvitesActive] = useState(true);

  const ActiveComponent = sectionComponents[activeSection];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-white font-montserrat font-black text-2xl mb-2">Viral Loops Engine</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Real-time viral growth control & referral management</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Viral Coefficient</p>
          <p className="text-white font-bold text-2xl mt-2">{viralCoefficient}</p>
          <p style={{ color: '#10b981', fontSize: 11, marginTop: 4 }}>↑ 0.18 from last week</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Active Invites</p>
          <p className="text-white font-bold text-2xl mt-2">4,240</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>Pending conversion</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Invite Status</p>
          <div className="flex items-center gap-2 mt-2">
            <span style={{ width: 12, height: 12, background: invitesActive ? '#10b981' : '#ef4444', borderRadius: '50%' }} />
            <p className="text-white font-bold">{invitesActive ? 'Active' : 'Paused'}</p>
          </div>
          <button
            onClick={() => setInvitesActive(!invitesActive)}
            style={{ color: '#3b82f6', fontSize: 11, marginTop: 6, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {invitesActive ? 'Pause system' : 'Resume system'}
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(13,31,60,0.6)',
                border: isActive ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(59,130,246,0.15)',
              }}
            >
              <Icon size={16} style={{ color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.4)', marginBottom: 8 }} />
              <h4 className="text-white text-xs font-semibold">{sec.label}</h4>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>{sec.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Active Section */}
      <div className="p-6 rounded-xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <ActiveComponent />
      </div>
    </div>
  );
}