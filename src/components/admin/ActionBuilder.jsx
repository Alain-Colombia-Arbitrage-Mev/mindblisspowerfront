import { useState } from 'react';
import { Plus, Trash2, ChevronRight } from 'lucide-react';

export default function ActionBuilder({ actions, setActions }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newAction, setNewAction] = useState({ type: '', recipient: '', message: '' });

  const actionTypes = [
    { id: 'send_email', name: 'Send Email', fields: ['recipient', 'message'] },
    { id: 'send_notification', name: 'Send Notification', fields: ['recipient', 'message'] },
    { id: 'update_field', name: 'Update Field', fields: ['field', 'value'] },
    { id: 'add_points', name: 'Add Points', fields: ['user', 'amount'] },
    { id: 'call_function', name: 'Call Function', fields: ['function_name', 'params'] },
    { id: 'create_record', name: 'Create Record', fields: ['entity', 'data'] },
  ];

  const addAction = () => {
    if (newAction.type) {
      setActions([...actions, { ...newAction, id: Date.now() }]);
      setNewAction({ type: '', recipient: '', message: '' });
      setShowAdd(false);
    }
  };

  const removeAction = (id) => {
    setActions(actions.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold text-sm">Actions (Then...)</h4>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-white/10 text-white rounded hover:bg-white/20 transition-all"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {showAdd && (
        <div className="p-3 rounded-lg space-y-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <select
            value={newAction.type}
            onChange={(e) => setNewAction({ ...newAction, type: e.target.value })}
            className="w-full px-2 py-1 bg-white/10 text-white rounded text-xs border border-white/20"
          >
            <option value="">Select Action</option>
            {actionTypes.map(at => <option key={at.id} value={at.id}>{at.name}</option>)}
          </select>
          {newAction.type && (
            <>
              <input
                type="text"
                placeholder="Recipient / Field"
                value={newAction.recipient}
                onChange={(e) => setNewAction({ ...newAction, recipient: e.target.value })}
                className="w-full px-2 py-1 bg-white/10 text-white rounded text-xs border border-white/20"
              />
              <input
                type="text"
                placeholder="Message / Value"
                value={newAction.message}
                onChange={(e) => setNewAction({ ...newAction, message: e.target.value })}
                className="w-full px-2 py-1 bg-white/10 text-white rounded text-xs border border-white/20"
              />
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={addAction}
              className="flex-1 py-1 bg-vicion-electric text-white rounded text-xs font-semibold hover:bg-blue-500 transition-all"
            >
              Add Action
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-1 bg-white/10 text-white rounded text-xs font-semibold hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {actions.map((action, idx) => (
          <div key={action.id}>
            <div className="p-2 rounded-lg flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p style={{ color: '#10b981', fontSize: 11 }}>
                {action.type}: {action.recipient}
              </p>
              <button onClick={() => removeAction(action.id)} className="text-white/30 hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </div>
            {idx < actions.length - 1 && (
              <div className="flex justify-center py-1">
                <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}