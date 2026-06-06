import { useEffect, useState, useCallback } from 'react';
import AdminSessionManager from '@/lib/AdminSessionManager';

/**
 * useAdminSession Hook
 * Manages current admin session, presence tracking, and real-time collaboration
 */

export default function useAdminSession(adminId, adminData) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [conflictDetected, setConflictDetected] = useState(null);

  // Register session on mount
  useEffect(() => {
    if (!adminId || !adminData) return;

    const session = AdminSessionManager.registerSession(adminId, adminData);
    setCurrentSession(session);

    // Start real-time sync
    AdminSessionManager.startSync();

    return () => {
      AdminSessionManager.stopSync();
      AdminSessionManager.clearSession(adminId);
    };
  }, [adminId, adminData]);

  // Subscribe to session changes
  useEffect(() => {
    const unsubscribe = AdminSessionManager.subscribe((data) => {
      setActiveSessions(data.activeSessions);
      setCurrentSession(data.currentAdmin);
    });

    return unsubscribe;
  }, []);

  // Update presence (module + action)
  const updatePresence = useCallback((module, action = null) => {
    if (!adminId) return;

    AdminSessionManager.updatePresence(adminId, module, action);

    // Check for conflicts
    const conflicts = AdminSessionManager.detectConflict(module, action);
    if (conflicts.length > 1) {
      setConflictDetected({
        module,
        action,
        admins: conflicts,
      });

      // Auto-clear conflict warning after 5s
      setTimeout(() => setConflictDetected(null), 5000);
    }
  }, [adminId]);

  // Get admins in specific module
  const getAdminsInModule = useCallback((module) => {
    return AdminSessionManager.getAdminsInModule(module);
  }, []);

  return {
    activeSessions,
    currentSession,
    conflictDetected,
    updatePresence,
    getAdminsInModule,
  };
}