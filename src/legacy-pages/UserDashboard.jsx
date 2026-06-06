import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, TrendingUp, DollarSign, Network, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import platformDataCore from '@/lib/platformDataCore';
import { getWarRoomLeaderDNA } from '@/lib/warRoomDataAdapter';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [descendants, setDescendants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth
    const userAuth = localStorage.getItem('user_auth');
    const userId = localStorage.getItem('user_id');
    const userDataStr = localStorage.getItem('user_data');

    if (!userAuth) {
      navigate('/login');
      return;
    }

    // Parse user data
    const parsedUser = userDataStr ? JSON.parse(userDataStr) : null;
    setUser(parsedUser);

    // Get full user data from platform core
    const fullUser = platformDataCore.getUserById(userId);
    if (fullUser) {
      setUser(prev => ({ ...prev, ...fullUser }));
    }

    // Get DNA data
    const dna = getWarRoomLeaderDNA(userId);
    setUserData(dna);

    // Get descendants
    const allDescendants = platformDataCore.getDescendantsForLeader(userId);
    const descendantUsers = allDescendants.map(node => platformDataCore.getUserById(node.user_id)).filter(Boolean);
    setDescendants(descendantUsers);

    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user_auth');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_data');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #050c1a 50%, #020408 100%)'
      }}>
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0a1628 0%, #050c1a 50%, #020408 100%)'
    }}>
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{
        borderColor: 'rgba(255,255,255,0.08)',
        background: 'rgba(4,10,22,0.5)',
        backdropFilter: 'blur(10px)'
      }}>
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>
            {user.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0 0' }}>
            {user.rank} {user.rank_icon}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-white/10"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* PROFILE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(13,31,60,0.4)',
            border: '1px solid rgba(59,130,246,0.2)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>
            Perfil del Usuario
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Email', value: user.email },
              { label: 'Rango', value: user.rank },
              { label: 'País', value: user.country || 'N/A' },
              { label: 'Estado', value: user.status || 'Activo' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0, fontWeight: 600 }}>
                  {item.label}
                </p>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '4px 0 0 0' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* METRICS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* INVESTMENT & INCOME */}
          <div className="rounded-2xl p-6" style={{
            background: 'rgba(13,31,60,0.4)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>
              Inversión e Ingresos
            </h3>
            <div className="space-y-3">
              {[
                { icon: DollarSign, label: 'Inversión Personal', value: `$${(userData?.inversion_personal || 0).toLocaleString()}`, color: '#3b82f6' },
                { icon: TrendingUp, label: 'Ingresos Mes', value: `$${(userData?.ingresos_mes || 0).toLocaleString()}`, color: '#10b981' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}20` }}>
                      <Icon size={14} style={{ color: item.color }} />
                    </div>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0, fontWeight: 600 }}>
                        {item.label}
                      </p>
                      <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '2px 0 0 0' }}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NETWORK SUMMARY */}
          <div className="rounded-2xl p-6" style={{
            background: 'rgba(13,31,60,0.4)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>
              Estructura de Red
            </h3>
            <div className="space-y-3">
              {[
                { icon: Users, label: 'Red Activa', value: userData?.red_activa || 0, color: '#10b981' },
                { icon: Network, label: 'Línea Binaria', value: `${userData?.left_count || 0} / ${userData?.right_count || 0}`, color: '#8b5cf6' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}20` }}>
                      <Icon size={14} style={{ color: item.color }} />
                    </div>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0, fontWeight: 600 }}>
                        {item.label}
                      </p>
                      <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '2px 0 0 0' }}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* DESCENDANTS */}
        {descendants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(13,31,60,0.4)',
              border: '1px solid rgba(59,130,246,0.2)',
            }}
          >
            <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>
              Mi Red ({descendants.length} miembros)
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {descendants.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div>
                    <p style={{ color: 'white', fontSize: 12, fontWeight: 600, margin: 0 }}>
                      {member.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>
                      {member.rank} {member.rank_icon}
                    </p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600 }}>
                    {member.country}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}