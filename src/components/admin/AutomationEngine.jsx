import { useState } from 'react';
import { Zap, Plus, Play, Pause, Trash2, Settings } from 'lucide-react';
import TriggerBuilder from './TriggerBuilder';
import ConditionBuilder from './ConditionBuilder';
import ActionBuilder from './ActionBuilder';
import FlowChain from './FlowChain';
import AutomationLogs from './AutomationLogs';

export default function AutomationEngine() {
  const [activeTab, setActiveTab] = useState('flows');
  const [flows, setFlows] = useState([
    { id: 1, name: 'New Registration Flow', trigger: 'user_register', conditions: 1, actions: 2, status: 'active', executions: 342 },
    { id: 2, name: 'Purchase Confirmation', trigger: 'purchase_complete', conditions: 2, actions: 3, status: 'active', executions: 156 },
    { id: 3, name: 'Rank Promotion Alert', trigger: 'rank_achieved', conditions: 1, actions: 2, status: 'paused', executions: 89 },
  ]);

  const [showBuilder, setShowBuilder] = useState(false);
  const [newFlow, setNewFlow] = useState({ name: '', trigger: '', conditions: [], actions: [] });

  const toggleFlow = (id) => {
    setFlows(flows.map(f => f.id === id ? { ...f, status: f.status === 'active' ? 'paused' : 'active' } : f));
  };

  const deleteFlow = (id) => {
    setFlows(flows.filter(f => f.id !== id));
  };

  const saveFlow = () => {
    if (newFlow.name && newFlow.trigger) {
      setFlows([...flows, { 
        id: Date.now(), 
        ...newFlow, 
        status: 'active', 
        executions: 0 
      }]);
      setNewFlow({ name: '', trigger: '', conditions: [], actions: [] });
      setShowBuilder(false);
    }
  };

  const tabs = [
    { id: 'flows', label: 'Automation Flows' },
    { id: 'logs', label: 'Execution Logs' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-8 rounded-2xl" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
        <p style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
          AUTOMATION ENGINE
        </p>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 12px 0' }}>
          Trigger-Based Workflows
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Create automated flows with triggers, conditions, and chained actions for system events.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.id ? '#a855f7' : 'rgba(255,255,255,0.5)',
              border: activeTab === tab.id ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'flows' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Active Workflows</h3>
            <button
              onClick={() => setShowBuilder(!showBuilder)}
              className="flex items-center gap-2 px-4 py-2 bg-vicion-electric text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-all"
            >
              <Plus size={16} /> New Flow
            </button>
          </div>

          {showBuilder && (
            <div className="p-6 rounded-lg space-y-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <input
                type="text"
                placeholder="Flow name"
                value={newFlow.name}
                onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm"
              />
              <select
                value={newFlow.trigger}
                onChange={(e) => setNewFlow({ ...newFlow, trigger: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm"
              >
                <option value="">Select Trigger</option>
                <option value="user_register">User Registers</option>
                <option value="purchase_complete">Purchase Complete</option>
                <option value="rank_achieved">Rank Achieved</option>
                <option value="activation_confirmed">Activation Confirmed</option>
                <option value="invite_accepted">Invite Accepted</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={saveFlow}
                  className="flex-1 py-2 bg-vicion-electric text-white rounded-lg font-semibold text-sm hover:bg-blue-500 transition-all"
                >
                  Create Flow
                </button>
                <button
                  onClick={() => setShowBuilder(false)}
                  className="flex-1 py-2 bg-white/10 text-white rounded-lg font-semibold text-sm hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {flows.map(flow => (
              <div key={flow.id} className="p-4 rounded-lg flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap size={14} style={{ color: '#a855f7' }} />
                    <p className="text-white font-medium text-sm">{flow.name}</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
                    Trigger: {flow.trigger} • Conditions: {flow.conditions} • Actions: {flow.actions}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 2 }}>
                    {flow.executions} executions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFlow(flow.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                  >
                    {flow.status === 'active' ? (
                      <Pause size={16} style={{ color: '#f59e0b' }} />
                    ) : (
                      <Play size={16} style={{ color: '#10b981' }} />
                    )}
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
                    <Settings size={16} style={{ color: '#3b82f6' }} />
                  </button>
                  <button
                    onClick={() => deleteFlow(flow.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <Trash2 size={16} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && <AutomationLogs />}
    </div>
  );
}