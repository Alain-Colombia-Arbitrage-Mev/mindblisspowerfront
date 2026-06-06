import { useState } from 'react';
import { Gift, Plus, Edit2 } from 'lucide-react';

export default function RewardLogic() {
  const [rewards, setRewards] = useState([
    { id: 1, name: 'Invite Bonus', type: 'Per successful invite', value: '$15 USD', condition: 'Referred user activates' },
    { id: 2, name: 'Tier Bonus', type: 'Tiered incentive', value: '5-10%', condition: 'Based on personal volume' },
    { id: 3, name: 'Viral Bonus', type: 'Network growth', value: '$50 bonus', condition: '10+ referrals converted' },
    { id: 4, name: 'Activation Match', type: 'Direct reward', value: '10% of referral spend', condition: 'Immediate' },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Reward Structure</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-vicion-blue text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-all">
          <Plus size={14} /> New Reward
        </button>
      </div>

      <div className="space-y-2">
        {rewards.map(reward => (
          <div key={reward.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <Gift size={14} style={{ color: '#ec4899' }} /> {reward.name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                  {reward.type}
                </p>
              </div>
              <button className="text-white/40 hover:text-white/70 transition-all">
                <Edit2 size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Value</p>
                <p className="text-vicion-electric font-semibold">{reward.value}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Condition</p>
                <p className="text-white">{reward.condition}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}