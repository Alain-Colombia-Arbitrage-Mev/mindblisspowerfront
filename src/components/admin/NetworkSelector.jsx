import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, TrendingUp } from 'lucide-react';
import UserManagementEngine from '@/lib/UserManagementEngine';

export default function NetworkSelector({ onSelectLeader }) {
  const [searchVal, setSearchVal] = useState('');
  const [leaders, setLeaders] = useState([]);

  const filteredLeaders = useMemo(() => {
    const allUsers = UserManagementEngine.getAllUsers();
    const leaderUsers = allUsers.filter(u => u.role === 'leader');
    
    if (!searchVal) return leaderUsers.slice(0, 20);
    
    return leaderUsers.filter(u =>
      u.name.toLowerCase().includes(searchVal.toLowerCase()) ||
      u.email.toLowerCase().includes(searchVal.toLowerCase())
    );
  }, [searchVal]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="p-4 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 800, letterSpacing: 1, margin: '0 0 12px 0', textTransform: 'uppercase' }}>
          Seleccionar Líder
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {/* Leaders List */}
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {filteredLeaders.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', padding: '24px 0', margin: 0 }}>
              No se encontraron líderes
            </p>
          ) : (
            filteredLeaders.map((leader, i) => {
              const network = UserManagementEngine.getNetworkByLeader(leader.id);
              return (
                <motion.button
                  key={leader.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onSelectLeader(leader)}
                  className="w-full text-left p-3 rounded-lg transition-all hover:bg-white/10"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0 }}>
                      {leader.name}
                    </p>
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(139,92,246,0.2)', color: '#8b5cf6' }}>
                      {leader.rank || 'SIN RANGO'}
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 2px 0' }}>
                    {leader.email}
                  </p>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {network?.totalMembers || 0} usuarios
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp size={10} /> ${network?.totalInvestment || 0}
                    </span>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}