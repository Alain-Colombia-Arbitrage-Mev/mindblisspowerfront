import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWarRoomLeaderDNA, getRootLeader, getWarRoomLeaders, getWarRoomChildren } from '@/lib/warRoomDataAdapter';
import { createWarRoomNavigation } from '@/lib/warRoomNavigationContext';
import WarRoomNetworkViz from '@/components/admin/WarRoom/WarRoomNetworkViz';
import WarRoomRightPanel from '@/components/admin/WarRoom/WarRoomRightPanel';
import { TrendingUp, Users, DollarSign, Eye } from 'lucide-react';

export default function UserDashboardNetwork() {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState(null);
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(true);

  // PHASE 1: FORCE USER LOAD
  const userId = localStorage.getItem('user_id');
  
  useEffect(() => {
    if (!userId) {
      navigate('/login', { replace: true });
    } else {
      setLoading(false);
    }
  }, [userId, navigate]);

  const userData = localStorage.getItem('user_data');
  const user = userData ? JSON.parse(userData) : null;

  // PHASE 2: LOAD REAL USER DATA
  const dna = userId ? getWarRoomLeaderDNA(userId) : null;
  
  // PHASE 3: ACTIVATE LEVEL LOGIC (CRITICAL)
  // Get descendants to check network status
  const allLeaders = getWarRoomLeaders();
  const children = allLeaders.filter(l => l.id !== userId);
  const hasNetwork = children && children.length > 0;
  const isLeader = dna && (dna.direct_referrals > 0 || dna.deep_generation > 0);

  useEffect(() => {
    const root = getRootLeader();
    if (root && !navigation) {
      setNavigation(createWarRoomNavigation(root));
    }
  }, [navigation]);

  // PHASE 5: HARD DEBUG MODE
  useEffect(() => {
    if (userId) {
      console.log('=== DASHBOARD EXECUTION DEBUG ===');
      console.log('USER:', userId);
      console.log('CHILDREN:', getWarRoomChildren(userId));
      console.log('DESC:', children);
      console.log('HAS_NETWORK:', hasNetwork);
      console.log('IS_LEADER:', isLeader);
      console.log('DNA:', dna);
    }
  }, [userId, children, dna]);

  const handleLogout = () => {
    localStorage.removeItem('user_auth');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_data');
    localStorage.removeItem('selected_user');
    localStorage.removeItem('selected_node');
    navigate('/login', { replace: true });
  };

  // PHASE 5: BLOCK EMPTY FALLBACK + PHASE 2 CONTINUATION
  if (loading || !dna || !user) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: '#060e1c' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>Cargando datos...</div>
      </div>
    );
  }

  const kpis = [
    { icon: Users, label: 'Red Activa', value: dna.red_activa || 0, color: '#10b981' },
    { icon: DollarSign, label: 'Inversión Personal', value: `$${(dna.inversion_personal || 0).toLocaleString()}`, color: '#3b82f6' },
    { icon: TrendingUp, label: 'Ingresos Mes', value: `$${(dna.ingresos_mes || 0).toLocaleString()}`, color: '#fb923c' },
    { icon: Users, label: 'Inv. Red', value: `$${(dna.inversion_red || 0).toLocaleString()}`, color: '#8b5cf6' },
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: '#060e1c' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(4,10,22,0.95)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 4px 0' }}>
              {dna.name || user.name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
              {dna.rank || user.rank} {dna.rank_icon || ''} · {dna.country || 'N/A'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
          >
            Salir
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-4 gap-2">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${kpi.color}30` }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={14} style={{ color: kpi.color }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: 0 }}>{kpi.label}</span>
                </div>
                <p style={{ color: 'white', fontSize: 12, fontWeight: 900, margin: 0 }}>{kpi.value}</p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button className="px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Eye size={12} className="inline mr-1" /> Ver mi red
          </button>
          <button className="px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Ver ADN
          </button>
          <button className="px-3 py-2 rounded-lg text-xs font-semibold transition-all" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
            Ver ingresos
          </button>
        </div>
      </div>

      {/* PHASE 4: FORCE VIEW SWITCH */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4">
        {/* NO NETWORK: PRODUCT VIEW */}
        {!hasNetwork && (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ textAlign: 'center', maxWidth: 400 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'white', marginBottom: 12 }}>Comienza tu viaje</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Sin red activa. Invita a tus primeros miembros para activar la estructura.</p>
              <button className="px-6 py-2 rounded-lg text-sm font-semibold" style={{ background: '#3b82f6', color: 'white' }}>Ver mi enlace de referencia</button>
            </div>
          </div>
        )}

        {/* HAS NETWORK + NO LEADER: BASIC NETWORK VIEW */}
        {hasNetwork && !isLeader && navigation && (
          <>
            <WarRoomNetworkViz
              sim={{}}
              selectedNode={selectedNode}
              onNodeSelect={setSelectedNode}
              navigation={navigation}
              onNavigate={setNavigation}
            />
            {selectedNode && (
              <WarRoomRightPanel
                selectedNode={selectedNode}
                onClose={() => setSelectedNode(null)}
                navigation={navigation}
                onNavigate={setNavigation}
              />
            )}
          </>
        )}

        {/* IS LEADER: FULL ADVANCED NETWORK */}
        {isLeader && navigation && (
          <>
            <WarRoomNetworkViz
              sim={{}}
              selectedNode={selectedNode}
              onNodeSelect={setSelectedNode}
              navigation={navigation}
              onNavigate={setNavigation}
            />
            {selectedNode && (
              <WarRoomRightPanel
                selectedNode={selectedNode}
                onClose={() => setSelectedNode(null)}
                navigation={navigation}
                onNavigate={setNavigation}
              />
            )}
          </>
        )}

        {/* INITIALIZING */}
        {!navigation && (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <p>Inicializando red...</p>
          </div>
        )}
      </div>
    </div>
  );
}