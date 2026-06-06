import { useState } from 'react';
import { Edit2, Save } from 'lucide-react';

export default function ReferralControl() {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState({
    inviteLimit: 50,
    rewardPerInvite: 15,
    conversionRequired: true,
    minActivationValue: 25,
    cooldownDays: 1,
  });

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Referral Configuration</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: isEditing ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
            color: isEditing ? '#10b981' : '#3b82f6',
          }}
        >
          {isEditing ? <Save size={14} /> : <Edit2 size={14} />}
          {isEditing ? 'Save' : 'Edit'}
        </button>
      </div>

      <div className="space-y-4">
        {[
          { key: 'inviteLimit', label: 'Max Invites Per User', unit: 'invites' },
          { key: 'rewardPerInvite', label: 'Reward Per Successful Invite', unit: 'USD' },
          { key: 'minActivationValue', label: 'Min Activation Value Required', unit: 'USD' },
          { key: 'cooldownDays', label: 'Cooldown Between Invites', unit: 'days' },
        ].map(field => (
          <div key={field.key} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <p className="text-white text-sm">{field.label}</p>
              {isEditing ? (
                <input
                  type="number"
                  value={config[field.key]}
                  onChange={(e) => setConfig({ ...config, [field.key]: parseInt(e.target.value) })}
                  className="w-20 px-2 py-1 bg-white/10 text-white rounded text-sm border border-white/20"
                />
              ) : (
                <p className="text-vicion-electric font-semibold">{config[field.key]} {field.unit}</p>
              )}
            </div>
          </div>
        ))}

        <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between">
            <p className="text-white text-sm">Require Activation Before Payout</p>
            <button
              onClick={() => setConfig({ ...config, conversionRequired: !config.conversionRequired })}
              style={{
                background: config.conversionRequired ? '#10b981' : '#6b7280',
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                cursor: isEditing ? 'pointer' : 'not-allowed',
                opacity: isEditing ? 1 : 0.6,
              }}
            />
          </div>
        </div>
      </div>

      {isEditing && (
        <button
          onClick={handleSave}
          className="w-full py-2 rounded-lg bg-vicion-blue text-white font-semibold text-sm hover:bg-blue-500 transition-all"
        >
          Save Configuration
        </button>
      )}
    </div>
  );
}