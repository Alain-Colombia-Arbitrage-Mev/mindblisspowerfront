// User Management Engine - Simulación y persistencia de estado
const STORAGE_KEY = 'vicion_users_db';

export const UserManagementEngine = {
  // Obtener todos los usuarios
  getAllUsers: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Crear nuevo usuario
  createUser: (userData) => {
    const users = UserManagementEngine.getAllUsers();
    const newUser = {
      id: `USR-${Date.now()}`,
      ...userData,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      status: userData.status || 'pending',
      investment_total: userData.investment_total || 0,
      referrals: userData.referrals || 0,
      network_side: userData.network_side || null,
      upline_id: userData.upline_id || null,
      history: [],
      alerts: [],
    };
    
    users.push(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    return newUser;
  },

  // Actualizar usuario
  updateUser: (id, updates) => {
    const users = UserManagementEngine.getAllUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates, updated_date: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      return users[index];
    }
    return null;
  },

  // Obtener usuario por ID
  getUser: (id) => {
    const users = UserManagementEngine.getAllUsers();
    return users.find(u => u.id === id);
  },

  // Enviar invitación (simular)
  sendInvitation: (userId) => {
    const user = UserManagementEngine.getUser(userId);
    if (user) {
      const updated = UserManagementEngine.updateUser(userId, {
        invitation_sent: new Date().toISOString(),
        invitation_status: 'sent',
      });
      UserManagementEngine.addHistory(userId, `Invitación enviada a ${user.email}`);
      return { success: true, message: `Invitación enviada a ${user.email}`, user: updated };
    }
    return { success: false, message: 'Usuario no encontrado' };
  },

  // Generar credenciales
  generateCredentials: (userId) => {
    const user = UserManagementEngine.getUser(userId);
    if (user) {
      const tempPassword = Math.random().toString(36).substring(2, 11).toUpperCase();
      const updated = UserManagementEngine.updateUser(userId, {
        temp_password: tempPassword,
        status: 'active',
        credentials_sent: new Date().toISOString(),
      });
      UserManagementEngine.addHistory(userId, `Credenciales temporales generadas`);
      return { success: true, credentials: { email: user.email, temp_password: tempPassword }, user: updated };
    }
    return { success: false, message: 'Usuario no encontrado' };
  },

  // Cambiar estado
  changeStatus: (userId, newStatus) => {
    const user = UserManagementEngine.getUser(userId);
    if (user) {
      const updated = UserManagementEngine.updateUser(userId, { status: newStatus });
      UserManagementEngine.addHistory(userId, `Estado cambió a: ${newStatus}`);
      return { success: true, user: updated };
    }
    return { success: false };
  },

  // Asignar líder
  assignLeader: (userId, leaderId) => {
    const user = UserManagementEngine.getUser(userId);
    const leader = UserManagementEngine.getUser(leaderId);
    if (user && leader) {
      const updated = UserManagementEngine.updateUser(userId, { upline_id: leaderId });
      UserManagementEngine.addHistory(userId, `Líder asignado: ${leader.full_name}`);
      return { success: true, user: updated };
    }
    return { success: false };
  },

  // Asignar lado de red
  assignNetworkSide: (userId, side, leaderId) => {
    const user = UserManagementEngine.getUser(userId);
    if (user) {
      const updated = UserManagementEngine.updateUser(userId, {
        network_side: side,
        upline_id: leaderId,
      });
      UserManagementEngine.addHistory(userId, `Posición de red: ${side} bajo ${leaderId}`);
      return { success: true, user: updated };
    }
    return { success: false };
  },

  // Agregar a historial
  addHistory: (userId, action) => {
    const user = UserManagementEngine.getUser(userId);
    if (user) {
      const history = user.history || [];
      history.unshift({
        timestamp: new Date().toISOString(),
        action,
      });
      UserManagementEngine.updateUser(userId, { history: history.slice(0, 20) });
    }
  },

  // Agregar alerta
  addAlert: (userId, alert) => {
    const user = UserManagementEngine.getUser(userId);
    if (user) {
      const alerts = user.alerts || [];
      alerts.unshift({ ...alert, timestamp: new Date().toISOString() });
      UserManagementEngine.updateUser(userId, { alerts: alerts.slice(0, 10) });
    }
  },

  // Filtrar usuarios
  filterUsers: (filters) => {
    let users = UserManagementEngine.getAllUsers();
    
    if (filters.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(u => 
        u.full_name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }
    
    if (filters.status) {
      users = users.filter(u => u.status === filters.status);
    }
    
    if (filters.role) {
      users = users.filter(u => u.role === filters.role);
    }
    
    if (filters.access_level) {
      users = users.filter(u => u.access_level === filters.access_level);
    }
    
    return users;
  },

  // Estadísticas
  getStats: () => {
    const users = UserManagementEngine.getAllUsers();
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      pending: users.filter(u => u.status === 'pending').length,
      blocked: users.filter(u => u.status === 'blocked').length,
      under_review: users.filter(u => u.status === 'under_review').length,
      with_investment: users.filter(u => u.investment_total > 0).length,
      leaders: users.filter(u => u.role === 'leader').length,
    };
  },

  // Inicializar con datos de demo
  initializeDemo: () => {
    if (UserManagementEngine.getAllUsers().length === 0) {
      const demoUsers = [
        { full_name: 'Carlos López', email: 'carlos@vicion.local', phone: '+34912345678', role: 'leader', access_level: 'advanced', status: 'active', user_type: 'Líder', company: 'Vicion BR', investment_total: 2500 },
        { full_name: 'Ana Silva', email: 'ana@vicion.local', phone: '+55119876543', role: 'leader', access_level: 'advanced', status: 'active', user_type: 'Líder', company: 'Vicion BR', investment_total: 3000 },
        { full_name: 'Roberto Díaz', email: 'roberto@vicion.local', phone: '+34912345679', role: 'investor', access_level: 'basic', status: 'active', user_type: 'Inversor', company: 'Vicion ES', investment_total: 1000 },
        { full_name: 'Luisa Fernández', email: 'luisa@vicion.local', phone: '+34912345680', role: 'support', access_level: 'intermediate', status: 'active', user_type: 'Soporte', investment_total: 0 },
        { full_name: 'Pedro Martínez', email: 'pedro@vicion.local', phone: '+34912345681', role: 'investor', access_level: 'basic', status: 'pending', user_type: 'Inversor', company: 'Vicion MX', investment_total: 500 },
      ];
      
      demoUsers.forEach(user => UserManagementEngine.createUser(user));
    }
  },
};

export default UserManagementEngine;