import { useContext } from 'react';
import { NotificationContext } from '@/lib/NotificationContext';

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
}

// Notification type map with colors and icons
export const notificationConfig = {
  SISTEMA: { color: '#3b82f6', icon: '⚙️', bgColor: 'rgba(59,130,246,0.08)' },
  ACTIVACION: { color: '#10b981', icon: '✓', bgColor: 'rgba(16,185,129,0.08)' },
  REVISION: { color: '#f59e0b', icon: '⏳', bgColor: 'rgba(245,158,11,0.08)' },
  FORMACION: { color: '#a78bfa', icon: '📚', bgColor: 'rgba(167,139,250,0.08)' },
  RED: { color: '#34d399', icon: '👥', bgColor: 'rgba(52,211,153,0.08)' },
  ALERTA: { color: '#ef6b67', icon: '⚠️', bgColor: 'rgba(239,107,103,0.08)' },
};