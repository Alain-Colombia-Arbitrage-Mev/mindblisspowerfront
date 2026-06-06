import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, TrendingUp, UserCheck, AlertCircle } from 'lucide-react';
import UserManagementEngine from '@/lib/UserManagementEngine';
import UserCreationForm from '@/components/admin/UserCreationForm';
import UserListView from '@/components/admin/UserListView';
import UserDetailPanel from '@/components/admin/UserDetailPanel';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    UserManagementEngine.initializeDemo();
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = UserManagementEngine.getAllUsers();
    setUsers(allUsers);
    setStats(UserManagementEngine.getStats());
  };

  const handleUserCreated = () => {
    loadUsers();
  };

  const handleUserUpdated = () => {
    loadUsers();
    setSelectedUser(UserManagementEngine.getUser(selectedUser?.id));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>
            USUARIOS Y ACCESO
          </p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
            Gestión de Usuarios
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
            Crear, invitar, asignar roles y gestionar la red de usuarios
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)' }}>
          <Plus size={16} />
          Crear Usuario
        </button>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users, label: 'Total', value: stats.total, color: '#3b82f6' },
            { icon: UserCheck, label: 'Activos', value: stats.active, color: '#10b981' },
            { icon: AlertCircle, label: 'Pendientes', value: stats.pending, color: '#fb923c' },
            { icon: TrendingUp, label: 'Con Inversión', value: stats.with_investment, color: '#8b5cf6' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl"
                style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}22` }}>
                <div className="flex items-center justify-between mb-2">
                  <Icon size={14} style={{ color: stat.color }} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 4px 0' }}>
                  {stat.label}
                </p>
                <p style={{ color: stat.color, fontSize: 24, fontWeight: 900, margin: 0 }}>
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* User List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}>
        <UserListView
          users={users}
          onUserSelect={setSelectedUser}
          onUserUpdated={handleUserUpdated}
        />
      </motion.div>

      {/* Modals */}
      <UserCreationForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onUserCreated={handleUserCreated}
      />

      <UserDetailPanel
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onUpdated={handleUserUpdated}
      />
    </div>
  );
}