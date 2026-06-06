import { ChevronDown } from 'lucide-react';

export default function FlowChain({ trigger, conditions, actions }) {
  return (
    <div className="space-y-2">
      <div className="p-3 rounded-lg" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
        <p style={{ color: '#a855f7', fontSize: 11, fontWeight: 700 }}>TRIGGER</p>
        <p className="text-white text-sm mt-1">{trigger || 'No trigger selected'}</p>
      </div>

      {conditions.length > 0 && (
        <>
          <div className="flex justify-center">
            <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700 }}>CONDITIONS ({conditions.length})</p>
            <div className="space-y-1 mt-2">
              {conditions.map((cond, i) => (
                <p key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                  • {cond.field} {cond.operator} {cond.value}
                </p>
              ))}
            </div>
          </div>
        </>
      )}

      {actions.length > 0 && (
        <>
          <div className="flex justify-center">
            <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700 }}>ACTIONS ({actions.length})</p>
            <div className="space-y-1 mt-2">
              {actions.map((action, i) => (
                <p key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                  {i + 1}. {action.type}: {action.recipient}
                </p>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}