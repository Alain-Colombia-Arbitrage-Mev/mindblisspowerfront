/**
 * ALERT ENGINE — Intelligent alert generation
 * Based on real conditions, not random
 */

class AlertEngine {
  generateAlertsForUser(userId, user, investments, payments, behavior, networkStats) {
    const alerts = [];

    // Overdue payments alert
    const overduePayments = payments.filter(p => p.userId === userId && p.status === 'vencido');
    if (overduePayments.length > 0) {
      alerts.push({
        id: `alert-${userId}-overdue`,
        type: 'overdue_payment',
        severity: overduePayments.length > 2 ? 'critical' : 'high',
        message: `${overduePayments.length} pago(s) vencido(s) · $${overduePayments.reduce((s, p) => s + p.amount, 0)} pendiente`,
        createdAt: new Date().toISOString(),
      });
    }

    // Investment expiring alert
    const expiringInvestments = investments.filter(inv => {
      if (inv.userId !== userId || inv.status !== 'activo') return false;
      const daysLeft = (new Date(inv.endDate) - Date.now()) / (1000 * 60 * 60 * 24);
      return daysLeft < 7 && daysLeft > 0;
    });
    if (expiringInvestments.length > 0) {
      alerts.push({
        id: `alert-${userId}-expiring`,
        type: 'expiring_investment',
        severity: 'warning',
        message: `${expiringInvestments.length} inversión(es) vence(n) en 7 días`,
        createdAt: new Date().toISOString(),
      });
    }

    // Inactivity alert
    const daysInactive = (Date.now() - new Date(user.lastActivity)) / (1000 * 60 * 60 * 24);
    if (daysInactive > 30) {
      alerts.push({
        id: `alert-${userId}-inactivity`,
        type: 'inactivity',
        severity: daysInactive > 60 ? 'critical' : 'warning',
        message: `Sin actividad por ${Math.floor(daysInactive)} días`,
        createdAt: new Date().toISOString(),
      });
    }

    // High risk alert
    if (behavior.riskLevel === 'critico') {
      alerts.push({
        id: `alert-${userId}-risk`,
        type: 'high_risk',
        severity: 'critical',
        message: `Usuario en riesgo crítico · Commitment: ${behavior.commitmentScore}%`,
        createdAt: new Date().toISOString(),
      });
    }

    // Non-reinvestment alert (for leaders)
    if (user.role === 'leader' && behavior.reinvestmentRate < 30) {
      alerts.push({
        id: `alert-${userId}-reinvestment`,
        type: 'low_reinvestment',
        severity: 'warning',
        message: `Tasa de reinversión baja: ${Math.round(behavior.reinvestmentRate)}%`,
        createdAt: new Date().toISOString(),
      });
    }

    return alerts;
  }

  generateNetworkAlerts(leaderId, networkStats) {
    const alerts = [];

    // Unbalanced network alert
    const balance = networkStats.balance;
    if (balance > 75 || balance < 25) {
      alerts.push({
        id: `alert-${leaderId}-imbalance`,
        type: 'network_imbalance',
        severity: 'warning',
        message: `Red desbalanceada: ${balance}% izquierda / ${100 - balance}% derecha`,
        createdAt: new Date().toISOString(),
      });
    }

    // Poor network health alert
    if (networkStats.networkHealth === 'critica') {
      alerts.push({
        id: `alert-${leaderId}-health`,
        type: 'poor_network_health',
        severity: 'critical',
        message: `Salud de red crítica · Activos: ${networkStats.activeMembers}/${networkStats.totalMembers}`,
        createdAt: new Date().toISOString(),
      });
    }

    // High overdue payments alert
    if (networkStats.overduePayments > 5) {
      alerts.push({
        id: `alert-${leaderId}-overdue`,
        type: 'network_overdue',
        severity: 'critical',
        message: `${networkStats.overduePayments} pagos vencidos en la red`,
        createdAt: new Date().toISOString(),
      });
    }

    // Network risk alert
    if (networkStats.riskLevel === 'critico') {
      alerts.push({
        id: `alert-${leaderId}-risk`,
        type: 'network_risk',
        severity: 'critical',
        message: `Red en riesgo crítico · Estabilidad: ${networkStats.stability}%`,
        createdAt: new Date().toISOString(),
      });
    }

    return alerts;
  }
}

export default new AlertEngine();