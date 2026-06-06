import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSimulation } from '@/lib/SimulationEngine';
import { createWarRoomNavigation } from '@/lib/warRoomNavigationContext';
import { getRootLeader } from '@/lib/warRoomDataAdapter';
import WarRoomTopBar from './WarRoom/WarRoomTopBar';
import WarRoomLeftPanel from './WarRoom/WarRoomLeftPanel';
import WarRoomNetworkViz from './WarRoom/WarRoomNetworkViz';
import WarRoomRightPanel from './WarRoom/WarRoomRightPanel';
import WarRoomBottomBar from './WarRoom/WarRoomBottomBar';

/**
 * WAR ROOM COMMAND CENTER
 * 
 * Premium executive operations center with 5 visual zones:
 * ZONE 1: Top command strip (KPIs, global status)
 * ZONE 2: Left intelligence column (critical alerts, priorities)
 * ZONE 3: Center strategic canvas (binary network visualization)
 * ZONE 4: Right response column (DNA, detail panel)
 * ZONE 5: Bottom financial strip (payments, actions)
 */

export default function WarRoomCommandCenter() {
  const sim = useSimulation();
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedPanel, setExpandedPanel] = useState(null);
  const [navigation, setNavigation] = useState(null);

  // Initialize navigation with root leader
  useEffect(() => {
    const root = getRootLeader();
    if (root && !navigation) {
      setNavigation(createWarRoomNavigation(root));
    }
  }, [navigation]);

  return (
    <div
      className="h-screen w-full flex flex-col relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #000000 100%)',
      }}
    >
      {/* ZONE 1: TOP COMMAND STRIP */}
      <WarRoomTopBar sim={sim} />

      {/* ZONES 2-4: MAIN GRID (Left | Center | Right) */}
      <div className="flex-1 flex overflow-hidden gap-2 p-2">
        {/* ZONE 2: LEFT INTELLIGENCE COLUMN */}
        <WarRoomLeftPanel sim={sim} expandedPanel={expandedPanel} />

        {/* ZONE 3: CENTER STRATEGIC CANVAS */}
        <WarRoomNetworkViz
          sim={sim}
          selectedNode={selectedNode}
          onNodeSelect={setSelectedNode}
          navigation={navigation}
          onNavigate={setNavigation}
        />

        {/* ZONE 4: RIGHT RESPONSE COLUMN */}
        <WarRoomRightPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          navigation={navigation}
          onNavigate={setNavigation}
        />
      </div>

      {/* ZONE 5: BOTTOM FINANCIAL STRIP */}
      <WarRoomBottomBar sim={sim} />
    </div>
  );
}