import { useEffect, useState, useCallback } from 'react';
import EntityLockManager from '@/lib/EntityLockManager';

/**
 * useEntityLock Hook
 * Manages entity locks for concurrent edit prevention
 */

export default function useEntityLock(entityId, adminId, adminName) {
  const [lockStatus, setLockStatus] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [activeLocks, setActiveLocks] = useState([]);

  // Acquire lock on mount
  useEffect(() => {
    if (!entityId || !adminId) return;

    const result = EntityLockManager.acquireLock(entityId, adminId, adminName);
    
    if (!result.success) {
      setLockStatus({
        isLocked: true,
        lockedBy: result.lockedBy,
        error: result.error,
      });
      setIsLocked(true);
      setCanEdit(false);
    } else {
      setCanEdit(true);
      EntityLockManager.startCleanup();
    }

    // Subscribe to lock changes
    const unsubscribe = EntityLockManager.subscribe((data) => {
      setActiveLocks(data.activeLocks);
      const currentLock = EntityLockManager.getLock(entityId);
      
      if (currentLock && currentLock.adminId !== adminId) {
        setIsLocked(true);
        setCanEdit(false);
      } else if (!currentLock) {
        setIsLocked(false);
      }
    });

    // Release lock on unmount
    return () => {
      unsubscribe();
      EntityLockManager.releaseLock(entityId, adminId);
    };
  }, [entityId, adminId, adminName]);

  // Manually release lock
  const releaseLock = useCallback(() => {
    EntityLockManager.releaseLock(entityId, adminId);
    setCanEdit(false);
  }, [entityId, adminId]);

  // Save and release
  const saveAndRelease = useCallback(() => {
    releaseLock();
    return true;
  }, [releaseLock]);

  return {
    isLocked,
    canEdit,
    lockStatus,
    activeLocks,
    releaseLock,
    saveAndRelease,
  };
}