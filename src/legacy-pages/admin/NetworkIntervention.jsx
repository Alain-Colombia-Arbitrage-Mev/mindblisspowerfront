import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Zap } from 'lucide-react';
import NetworkSelector from '@/components/admin/NetworkSelector';
import NetworkVisualization from '@/components/admin/NetworkVisualization';
import NetworkNodePanel from '@/components/admin/NetworkNodePanel';
import NetworkHealthAnalysis from '@/components/admin/NetworkHealthAnalysis';
import CriticalDetectionEngine from '@/components/admin/CriticalDetectionEngine';
import LeaderControlPanel from '@/components/admin/LeaderControlPanel';
import NetworkSnapshot from '@/components/admin/NetworkSnapshot';
import UserManagementEngine from '@/lib/UserManagementEngine';

export default function NetworkIntervention() {
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const network = selectedLeader ? UserManagementEngine.getNetworkByLeader(selectedLeader.id) : null;

  const handleNodeSelect = (node) => {
    setSelectedNode(node);
  };

  const handleAction = (nodeId, action) => {
    alert(`Acción: ${action} en nodo ${nodeId}`);
  };

  const handleInterventionNeeded = (type) => {
    alert(`Intervención: ${type}`);
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-3">
          <Zap size={24} style={{ color: '#8b5cf6' }} />
          <div>
            <p style={{ color: '#8b5cf6', fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', margin: 0, textTransform: 'uppercase' }}>NETWORK COMMAND CENTER</p>
            <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '2px 0 0 0', letterSpacing: -0.5 }}>Intervención de Red</h1>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
          Control estratégico de redes completas, análisis de estructura binaria, detección automática de problemas e intervención en cascada
        </p>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Selector + Leader Panel */}
        <div className="space-y-4">
          <NetworkSelector onSelectLeader={setSelectedLeader} />
          {selectedLeader && network && (
            <LeaderControlPanel leader={selectedLeader} network={network} />
          )}
        </div>

        {/* Center: Network Visualization */}
        <div className="lg:col-span-2">
          {selectedLeader && network ? (
            <NetworkVisualization
              leaderId={selectedLeader.id}
              onNodeSelect={handleNodeSelect}
            />
          ) : (
            <div className="p-8 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <AlertTriangle size={32} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                Selecciona un líder para visualizar su red
              </p>
            </div>
          )}
        </div>

        {/* Right: Node Panel */}
        {selectedNode && (
          <NetworkNodePanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onAction={handleAction}
          />
        )}
      </div>

      {/* Analysis Section */}
      {selectedLeader && network && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div>
            <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 12px 0', textTransform: 'uppercase' }}>ANÁLISIS Y DETECCIÓN</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NetworkHealthAnalysis network={network} />
            <CriticalDetectionEngine network={network} onInterventionNeeded={handleInterventionNeeded} />
          </div>

          {/* Snapshot */}
          <div>
            <p style={{ color: '#10b981', fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 12px 0', textTransform: 'uppercase' }}>SNAPSHOT DE RED</p>
            <NetworkSnapshot network={network} />
          </div>
        </motion.div>
      )}
    </div>
  );
}