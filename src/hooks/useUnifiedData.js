/**
 * useUnifiedData — Access to single source of truth
 * All components (Dashboard, Admin, DNA Panel, etc.) use the same data
 */

import { useState, useEffect } from 'react';
import unifiedDataEngine from '@/lib/UnifiedDataEngine';

export function useUnifiedData(userId = null) {
  const [data, setData] = useState(() => {
    if (!userId) return null;
    return {
      user: unifiedDataEngine.getUserById(userId),
      network: unifiedDataEngine.getNetwork(userId),
      networkStats: unifiedDataEngine.getNetworkStats(userId),
      payments: unifiedDataEngine.getUserPayments(userId),
      alerts: unifiedDataEngine.getUserAlerts(userId),
      history: unifiedDataEngine.getUserHistory(userId),
    };
  });

  useEffect(() => {
    if (!userId) return;
    // Re-fetch when userId changes
    setData({
      user: unifiedDataEngine.getUserById(userId),
      network: unifiedDataEngine.getNetwork(userId),
      networkStats: unifiedDataEngine.getNetworkStats(userId),
      payments: unifiedDataEngine.getUserPayments(userId),
      alerts: unifiedDataEngine.getUserAlerts(userId),
      history: unifiedDataEngine.getUserHistory(userId),
    });
  }, [userId]);

  return data;
}

// Get master user (Roberto Díaz)
export function useMasterUser() {
  return unifiedDataEngine.masterUser;
}

// Get all users
export function useAllUsers() {
  return unifiedDataEngine.users;
}

// Get network overview
export function useNetworkOverview(userId) {
  return unifiedDataEngine.getNetwork(userId);
}

// Get user payments
export function useUserPayments(userId) {
  return unifiedDataEngine.getUserPayments(userId);
}

// Get user alerts
export function useUserAlerts(userId) {
  return unifiedDataEngine.getUserAlerts(userId);
}

// Get user history
export function useUserHistory(userId) {
  return unifiedDataEngine.getUserHistory(userId);
}

// Get network stats
export function useNetworkStats(userId) {
  return unifiedDataEngine.getNetworkStats(userId);
}

export default unifiedDataEngine;