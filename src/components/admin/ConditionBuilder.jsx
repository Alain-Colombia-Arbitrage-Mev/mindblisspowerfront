import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function ConditionBuilder({ conditions, setConditions }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCondition, setNewCondition] = useState({ field: '', operator: 'equals', value: '' });

  const operators = ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists'];
  const fields = ['user_status', 'activation_status', 'rank_level', 'account_age', 'email_verified'];

  const addCondition = () => {
    if (newCondition.field) {
      setConditions([...conditions, { ...newCondition, id: Date.now() }]);
      setNewCondition({ field: '', operator: 'equals', value: '' });
      setShowAdd(false);
    }
  };

  const removeCondition = (id) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-white font-semibold text-sm">Conditions (If...)</h4>
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
            value={newCondition.field}
            onChange={(e) => setNewCondition({ ...newCondition, field: e.target.value })}
            className="w-full px-2 py-1 bg-white/10 text-white rounded text-xs border border-white/20"
          >
            <option value="">Select Field</option>
            {fields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={newCondition.operator}
            onChange={(e) => setNewCondition({ ...newCondition, operator: e.target.value })}
            className="w-full px-2 py-1 bg-white/10 text-white rounded text-xs border border-white/20"
          >
            {operators.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
          <input
            type="text"
            placeholder="Value"
            value={newCondition.value}
            onChange={(e) => setNewCondition({ ...newCondition, value: e.target.value })}
            className="w-full px-2 py-1 bg-white/10 text-white rounded text-xs border border-white/20"
          />
          <div className="flex gap-2">
            <button
              onClick={addCondition}
              className="flex-1 py-1 bg-vicion-electric text-white rounded text-xs font-semibold hover:bg-blue-500 transition-all"
            >
              Add
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
        {conditions.map(cond => (
          <div key={cond.id} className="p-2 rounded-lg flex items-center justify-between" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p style={{ color: '#3b82f6', fontSize: 11 }}>
              {cond.field} {cond.operator} "{cond.value}"
            </p>
            <button onClick={() => removeCondition(cond.id)} className="text-white/30 hover:text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}