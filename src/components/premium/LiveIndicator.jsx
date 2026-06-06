/**
 * LIVE INDICATOR
 * Color-coded status indicators for network health
 */

export const StatusIndicator = ({ status, value, label }) => {
  let color = '#93C5FD';
  let icon = '○';

  if (status === 'healthy') {
    color = '#10b981';
    icon = '✓';
  } else if (status === 'warning') {
    color = '#fb923c';
    icon = '⚠';
  } else if (status === 'critical') {
    color = '#ef4444';
    icon = '✕';
  } else if (status === 'elite') {
    color = '#fbbf24';
    icon = '★';
  }

  return {
    color,
    icon,
    label,
    value,
  };
};

/**
 * Get status color for investment level
 */
export const getInvestmentStatusColor = (investment, threshold = 5000) => {
  if (investment >= threshold * 2) return '#fbbf24'; // Elite (gold)
  if (investment >= threshold) return '#10b981'; // Healthy (green)
  if (investment >= threshold / 2) return '#93C5FD'; // Active (blue)
  return '#6B7280'; // Inactive (gray)
};

/**
 * Get status color for member activity
 */
export const getActivityStatusColor = (status) => {
  const colors = {
    active: '#10b981',
    inactive: '#6B7280',
    pending: '#fb923c',
    suspended: '#ef4444',
  };
  return colors[status] || '#93C5FD';
};

/**
 * Get rank color (for badge/indicator)
 */
export const getRankColor = (rank) => {
  const colors = {
    'Principiante': '#6B7280',
    'Bronce': '#92400e',
    'Plata': '#374151',
    'Oro': '#d97706',
    'Platino': '#9333ea',
    'Zafiro': '#0369a1',
    'Rubí': '#dc2626',
    'Esmeralda': '#059669',
    'Diamante': '#4f46e5',
    'Diamante Azul': '#0ea5e9',
    'Diamante Negro': '#1f2937',
    'E. Corona': '#fbbf24',
  };
  return colors[rank] || '#93C5FD';
};

export default StatusIndicator;