/**
 * Overlay Effects Engine
 * Detects events and triggers smart visual overlays
 * Non-blocking, lightweight, performance-optimized
 */

export const createOverlayEffect = (type, target, intensity = 'medium') => {
  return {
    id: `overlay-${Date.now()}-${Math.random()}`,
    type, // 'highlight' | 'pulse' | 'glow' | 'frame' | 'marker' | 'path'
    target, // { panelId, elementSelector, position }
    intensity, // 'low' | 'medium' | 'high'
    createdAt: Date.now(),
    duration: intensity === 'high' ? 8000 : intensity === 'medium' ? 5000 : 3000,
    active: true,
  };
};

// Event detectors
export const detectPaymentIssue = (kpis) => {
  if (kpis.pendingVerifications > 5) {
    return {
      detected: true,
      severity: 'high',
      message: 'Multiple payments flagged',
      effect: createOverlayEffect('pulse', { panelId: 'payments' }, 'high'),
    };
  }
  return { detected: false };
};

export const detectLeaderIssue = (activityLog) => {
  const violations = activityLog.filter(a => a.action.includes('VIOLATION') || a.action.includes('BLOCKED'));
  if (violations.length > 0) {
    return {
      detected: true,
      severity: violations.length > 2 ? 'high' : 'medium',
      message: `${violations.length} leader issue(s) detected`,
      effect: createOverlayEffect('frame', { panelId: 'leaders' }, violations.length > 2 ? 'high' : 'medium'),
    };
  }
  return { detected: false };
};

export const detectConversionChange = (kpis, prevKpis) => {
  if (!prevKpis) return { detected: false };
  const change = kpis.conversionRate - prevKpis.conversionRate;
  if (Math.abs(change) > 2) {
    return {
      detected: true,
      severity: change > 0 ? 'opportunity' : 'warning',
      message: `Conversion rate ${change > 0 ? 'improved' : 'dropped'} ${Math.abs(change).toFixed(1)}%`,
      effect: createOverlayEffect('glow', { panelId: 'conversion-kpi' }, change > 0 ? 'low' : 'high'),
    };
  }
  return { detected: false };
};

export const detectGrowthSignal = (kpis) => {
  if (kpis.growthSignal > 15) {
    return {
      detected: true,
      severity: 'opportunity',
      message: 'Strong growth signal detected',
      effect: createOverlayEffect('marker', { panelId: 'growth-kpi' }, 'medium'),
    };
  }
  return { detected: false };
};

export const detectActiveAlert = (activityLog) => {
  const recentCritical = activityLog.filter((a, i) => i < 3 && a.color === '#ef4444');
  if (recentCritical.length > 0) {
    return {
      detected: true,
      severity: 'critical',
      message: 'Critical event requires attention',
      effect: createOverlayEffect('pulse', { panelId: 'alerts' }, 'high'),
    };
  }
  return { detected: false };
};

// Overlay intensity resolver
export const resolveOverlayIntensity = (severity) => {
  const map = {
    critical: 'high',
    high: 'high',
    opportunity: 'medium',
    warning: 'medium',
    low: 'low',
  };
  return map[severity] || 'low';
};