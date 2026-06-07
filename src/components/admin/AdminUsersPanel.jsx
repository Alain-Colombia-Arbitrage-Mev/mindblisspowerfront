/**
 * ADMIN USERS PANEL
 * Displays all 183 visible user records with complete fields
 * Master account + 182 child users
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X, Users, TrendingUp } from 'lucide-react';
import DNAPanel from '@/components/DNAPanel';
import dashboardDataService from '@/lib/DashboardDataService';
import unifiedDataEngine from '@/lib/UnifiedDataEngine';

export default function AdminUsersPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('registration_date');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Get all users: master + children
  const allUsers = useMemo(() => {
    const master = {
      id: 'master-cuenta-mvp-principal',
      full_name: 'Cuenta MVP Principal',
      email: 'master@mindblisspower.com',
      phone: '+57-301-1000000',
      country: 'CO',
      city: 'Bogotá',
      role: 'Líder Principal',
      rank: 'E. Corona',
      status: 'Activo',
      membership_plan: 'Elite',
      investment_amount: 25000,
      registration_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      onboarding_status: 'completado',
      document_type: 'cedula',
      document_number_simulated: 1000000000,
      documentation_status: 'verified',
      payment_status: 'activo',
      next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      binary_side: 'root',
      upline_id: null,
      is_master: true,
    };

    // Add all member users from integrity model
    const members = unifiedDataEngine.integrityModel.users.map(u => ({
      ...u,
      is_master: false,
    })) || [];

    return [master, ...members];
  }, []);

  // Filter and sort
  const filteredUsers = useMemo(() => {
    let result = allUsers;

    if (filterRole !== 'all') {
      result = result.filter(u => u.role === filterRole);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.country?.includes(q)
      );
    }

    return result.sort((a, b) => {
      if (sortBy === 'registration_date') {
        return new Date(b.registration_date) - new Date(a.registration_date);
      } else if (sortBy === 'name') {
        return a.full_name.localeCompare(b.full_name);
      } else if (sortBy === 'investment') {
        return b.investment_amount - a.investment_amount;
      }
      return 0;
    });
  }, [allUsers, searchQuery, sortBy, filterRole]);

  const toggleRow = (id) => {
    const newSet = new Set(expandedRows);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedRows(newSet);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'rgba(4,10,22,0.7)', borderRadius: 12 }}>
      {/* HEADER */}
      <div className="flex-shrink-0 p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: 0 }}>Usuarios del Sistema</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>
              {filteredUsers.length} de {allUsers.length} usuarios
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 12, fontWeight: 700 }}>
            <Users size={14} />
            {allUsers.length} TOTAL
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, email, teléfono..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
            <Search size={14} style={{ position: 'absolute', right: 12, top: 10, color: 'rgba(255,255,255,0.3)' }} />
          </div>

          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs flex-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            >
              <option value="all">Todos los roles</option>
              <option value="Líder Principal">Líder Principal</option>
              <option value="lider">Líder</option>
              <option value="inversor">Inversor</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs flex-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            >
              <option value="registration_date">Más recientes</option>
              <option value="name">Nombre A-Z</option>
              <option value="investment">Mayor inversión</option>
            </select>
          </div>
        </div>
      </div>

      {/* USERS LIST */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead style={{ position: 'sticky', top: 0, background: 'rgba(4,10,22,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 10 }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Nombre</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Rol</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Plan</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Inversión</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredUsers.map((user, idx) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: user.is_master ? 'rgba(139,92,246,0.08)' : expandedRows.has(user.id) ? 'rgba(59,130,246,0.06)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '12px 16px', color: 'white', fontSize: 12, fontWeight: user.is_master ? 700 : 500 }}>
                    {user.is_master && '👑'} {user.full_name}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{user.email}</td>
                  <td style={{ padding: '12px 16px', color: '#3b82f6', fontSize: 11, fontWeight: 600 }}>{user.role}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{user.membership_plan}</td>
                  <td style={{ padding: '12px 16px', color: '#10b981', fontSize: 12, fontWeight: 700 }}>${user.investment_amount?.toLocaleString() || 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: user.status === 'Activo' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: user.status === 'Activo' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedUserId(user.id)}
                      className="px-2 py-1 rounded text-xs font-bold transition-all"
                      style={{
                        background: 'rgba(59,130,246,0.15)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59,130,246,0.3)',
                      }}
                    >
                      Ver ADN
                    </button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* DNA PANEL */}
      {selectedUserId && (
        <DNAPanel userId={selectedUserId} onClose={() => setSelectedUserId(null)} isAdmin={true} />
      )}
    </div>
  );
}