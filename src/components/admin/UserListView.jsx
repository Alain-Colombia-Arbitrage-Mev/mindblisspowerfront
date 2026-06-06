import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit2, Ban, RefreshCw, Mail, Lock, Trash2 } from 'lucide-react';
import UserManagementEngine from '@/lib/UserManagementEngine';

const STATUS_COLORS = {
  active: '#10b981',
  pending: '#fb923c',
  under_review: '#06b6d4',
  blocked: '#ef4444',
};

export default function UserListView({ users, onUserSelect, onUserUpdated }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = users;
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => 
        u.full_name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(u => u.status === statusFilter);
    }
    
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    
    return result;
  }, [users, search, statusFilter, roleFilter]);

  const handleStatusChange = (userId, newStatus) => {
    const updated = UserManagementEngine.changeStatus(userId, newStatus);
    if (updated.success) {
      onUserUpdated();
    }
  };

  const handleBlock = (userId) => {
    const user = UserManagementEngine.getUser(userId);
    if (user) {
      const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
      handleStatusChange(userId, newStatus);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-64 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>Todos los Estados</option>
          <option value="pending" style={{ background: '#0d1f3c' }}>Pendiente</option>
          <option value="active" style={{ background: '#0d1f3c' }}>Activo</option>
          <option value="under_review" style={{ background: '#0d1f3c' }}>En Revisión</option>
          <option value="blocked" style={{ background: '#0d1f3c' }}>Bloqueado</option>
        </select>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>Todos los Roles</option>
          <option value="investor" style={{ background: '#0d1f3c' }}>Inversor</option>
          <option value="leader" style={{ background: '#0d1f3c' }}>Líder</option>
          <option value="admin" style={{ background: '#0d1f3c' }}>Admin</option>
          <option value="support" style={{ background: '#0d1f3c' }}>Soporte</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,18,40,0.5)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <tr>
              {['ID', 'Nombre', 'Correo', 'Rol', 'Nivel', 'Estado', 'Inversión', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => {
              const sc = STATUS_COLORS[user.status] || '#6b7280';
              return (
                <tr
                  key={user.id}
                  onClick={() => onUserSelect(user)}
                  className="cursor-pointer transition-all hover:bg-white/5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 10 }}>
                    {user.id}
                  </td>
                  <td className="px-4 py-3">
                    <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{user.full_name}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {user.email}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {user.role}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{
                      background: 'rgba(59,130,246,0.15)',
                      color: '#3b82f6'
                    }}>
                      {user.access_level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{
                      background: `${sc}18`,
                      color: sc,
                      border: `1px solid ${sc}25`
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#10b981', fontWeight: 700 }}>
                    ${user.investment_total?.toLocaleString() || '0'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={e => { e.stopPropagation(); onUserSelect(user); }}
                        className="p-1.5 rounded hover:bg-white/10 transition-all"
                        title="Editar"
                        style={{ color: '#3b82f6' }}>
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleBlock(user.id); }}
                        className="p-1.5 rounded hover:bg-white/10 transition-all"
                        title={user.status === 'blocked' ? 'Activar' : 'Bloquear'}
                        style={{ color: user.status === 'blocked' ? '#10b981' : '#ef4444' }}>
                        {user.status === 'blocked' ? <RefreshCw size={12} /> : <Ban size={12} />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {filtered.length === 0 && (
        <div className="text-center py-8">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No se encontraron usuarios</p>
        </div>
      )}

      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
        Mostrando {filtered.length} de {users.length} usuarios
      </p>
    </div>
  );
}