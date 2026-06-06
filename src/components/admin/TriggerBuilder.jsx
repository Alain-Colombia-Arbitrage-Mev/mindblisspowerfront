import { useState } from 'react';
import { Zap, Plus } from 'lucide-react';

export default function TriggerBuilder({ onSelect }) {
  const triggers = [
    { id: 'user_register', name: 'User Registers', description: 'Fired when a new user creates account' },
    { id: 'purchase_complete', name: 'Purchase Complete', description: 'Fired after successful payment' },
    { id: 'rank_achieved', name: 'Rank Achieved', description: 'Fired when user reaches new rank' },
    { id: 'activation_confirmed', name: 'Activation Confirmed', description: 'Fired when activation is confirmed' },
    { id: 'invite_accepted', name: 'Invite Accepted', description: 'Fired when referred user joins' },
    { id: 'daily_scheduled', name: 'Daily Schedule', description: 'Fires at specified time daily' },
    { id: 'weekly_scheduled', name: 'Weekly Schedule', description: 'Fires at specified day/time weekly' },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-white font-semibold text-sm">Select Trigger</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {triggers.map(trigger => (
          <button
            key={trigger.id}
            onClick={() => onSelect(trigger.id)}
            className="p-4 rounded-lg text-left transition-all hover:border-vicion-electric"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-start gap-2">
              <Zap size={14} style={{ color: '#a855f7', marginTop: 2 }} />
              <div>
                <p className="text-white text-sm font-medium">{trigger.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                  {trigger.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}