/**
 * SIMULATION ENGINE V3 — Connected to Unified Data
 * All modules consume the same coherent data source
 */

import unifiedDataEngine from './UnifiedDataEngine';

class SimulationEngineV3 {
  constructor() {
    this.tick = 0;
    this.running = true;
    this.selectedUser = unifiedDataEngine.masterUser;
    this.subscribers = [];
    this.activityLog = [];

    // Start simulation
    this.startSimulation();
  }

  startSimulation() {
    setInterval(() => {
      if (!this.running) return;
      this.tick++;
      this.updateSimulation();
      this.notifySubscribers();
    }, 2000);
  }

  updateSimulation() {
    // Simulate user activity
    const randomUser = unifiedDataEngine.users[Math.floor(Math.random() * unifiedDataEngine.users.length)];
    if (randomUser && Math.random() > 0.6) {
      const actions = [
        `Payment APPROVED · ${randomUser.name} · $${Math.floor(Math.random() * 1000)}`,
        `Account UPDATED · ${randomUser.name}`,
        `Alert TRIGGERED · ${randomUser.name} · Network inactive`,
        `Leader ACTIVITY · ${randomUser.name} · +${Math.floor(Math.random() * 5)} members`,
      ];

      this.activityLog.unshift({
        action: actions[Math.floor(Math.random() * actions.length)],
        time: 'just now',
        color: ['#10b981', '#3b82f6', '#ef4444', '#fb923c'][Math.floor(Math.random() * 4)],
      });

      if (this.activityLog.length > 20) this.activityLog.pop();
    }
  }

  // GET DATA FROM UNIFIED ENGINE
  getMasterUser() {
    return unifiedDataEngine.masterUser;
  }

  getNetwork(userId) {
    return unifiedDataEngine.getNetwork(userId);
  }

  getNetworkStats(userId) {
    return unifiedDataEngine.getNetworkStats(userId);
  }

  getUserPayments(userId) {
    return unifiedDataEngine.getUserPayments(userId);
  }

  getUserAlerts(userId) {
    return unifiedDataEngine.getUserAlerts(userId);
  }

  getUserHistory(userId) {
    return unifiedDataEngine.getUserHistory(userId);
  }

  selectUser(userId) {
    this.selectedUser = unifiedDataEngine.getUserById(userId);
    this.notifySubscribers();
  }

  getSelectedUserNetwork() {
    return this.getNetwork(this.selectedUser.id);
  }

  // KPI CALCULATIONS
  get kpis() {
    const master = unifiedDataEngine.masterUser;
    return {
      totalParticipants: unifiedDataEngine.users.length,
      activeLeaders: unifiedDataEngine.users.filter(u => u.role === 'leader' && u.status === 'activo').length,
      activePlans: unifiedDataEngine.users.filter(u => u.status === 'activo').length,
      pendingVerifications: unifiedDataEngine.users.filter(u => u.status === 'pendiente').length,
      paymentVolume: Math.floor(
        unifiedDataEngine.payments
          .filter(p => p.status === 'completado')
          .reduce((sum, p) => sum + p.amount, 0) / 1000
      ),
      conversionRate: 68,
      supportIncidents: unifiedDataEngine.alerts.length,
      growthSignal: 12,
    };
  }

  // SUBSCRIPTIONS
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => cb(this));
  }
}

// SINGLETON
const simulationEngine = new SimulationEngineV3();

export default simulationEngine;
export { SimulationEngineV3 };