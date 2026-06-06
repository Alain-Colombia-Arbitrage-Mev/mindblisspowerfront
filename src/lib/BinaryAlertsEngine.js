/**
 * BINARY ALERTS ENGINE
 * Generate alerts for binary tree events:
 * - New investment in left/right branch
 * - Branch imbalance
 * - High-value member joined
 * - Member missing contact info
 * - Member status changes
 */

class BinaryAlertsEngine {
  /**
   * Generate alerts based on current network state
   */
  static generateAlerts(metrics, members, networkNodes, previousMetrics = null) {
    const alerts = [];

    if (!metrics || !Array.isArray(members)) {
      return alerts;
    }

    // 1. Branch imbalance alert
    if (!metrics.isBalanced && metrics.balance > 30) {
      const unbalancedSide = metrics.leftTotal > metrics.rightTotal ? 'left' : 'right';
      alerts.push({
        id: `imbalance-${Date.now()}`,
        type: 'imbalance',
        severity: 'warning',
        title: `Branch Imbalance Detected`,
        message: `${unbalancedSide.toUpperCase()} branch is ${metrics.balance}% larger`,
        action: 'Fortalecer rama',
        color: '#fb923c',
        icon: '⚖️',
      });
    }

    // 2. High-value member alert
    const highValueMembers = members.filter(m => m.investment_amount >= 10000);
    highValueMembers.forEach(member => {
      if (!previousMetrics || !this.memberExistedBefore(member.user_id, previousMetrics)) {
        alerts.push({
          id: `high-value-${member.user_id}-${Date.now()}`,
          type: 'high_value',
          severity: 'success',
          title: `High-Value Member Joined`,
          message: `${member.full_name || member.name} invested $${member.investment_amount.toLocaleString()}`,
          action: 'Ver perfil',
          color: '#10b981',
          icon: '💎',
        });
      }
    });

    // 3. Missing contact info alert
    const incomplete = members.filter(
      m => !m.email || !m.phone || !m.country
    );
    if (incomplete.length > 0) {
      alerts.push({
        id: `incomplete-${Date.now()}`,
        type: 'incomplete_data',
        severity: 'warning',
        title: `${incomplete.length} Members Missing Contact Info`,
        message: `Complete contact details to improve network visibility`,
        action: 'Revisar',
        color: '#fb923c',
        icon: '📋',
      });
    }

    // 4. Inactive members alert
    const inactive = members.filter(m => m.status !== 'active');
    if (inactive.length > 5) {
      alerts.push({
        id: `inactive-${Date.now()}`,
        type: 'inactive',
        severity: 'warning',
        title: `${inactive.length} Inactive Members`,
        message: `Reactivate to strengthen network`,
        action: 'Activar',
        color: '#fb923c',
        icon: '⚡',
      });
    }

    // 5. Growth opportunity alert
    if (metrics.totalMembers > 50 && metrics.isBalanced) {
      alerts.push({
        id: `growth-${Date.now()}`,
        type: 'growth',
        severity: 'success',
        title: `Network Ready for Expansion`,
        message: `Your balanced network is ready to scale`,
        action: 'Estrategia',
        color: '#10b981',
        icon: '📈',
      });
    }

    return alerts;
  }

  /**
   * Check if member existed in previous state
   */
  static memberExistedBefore(memberId, previousMetrics) {
    if (!previousMetrics) return false;
    return (
      (previousMetrics.leftCount > 0 || previousMetrics.rightCount > 0)
    );
  }

  /**
   * Get alert severity color
   */
  static getSeverityColor(severity) {
    const colors = {
      critical: '#ef4444',
      warning: '#fb923c',
      success: '#10b981',
      info: '#3b82f6',
    };
    return colors[severity] || '#93C5FD';
  }

  /**
   * Count alerts by type
   */
  static countAlertsByType(alerts) {
    const counts = {
      critical: 0,
      warning: 0,
      success: 0,
      info: 0,
    };

    if (Array.isArray(alerts)) {
      alerts.forEach(a => {
        if (counts.hasOwnProperty(a.severity)) {
          counts[a.severity]++;
        }
      });
    }

    return counts;
  }
}

export default BinaryAlertsEngine;