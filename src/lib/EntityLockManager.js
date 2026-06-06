/**
 * Entity Lock Manager
 * Prevents multiple admins from editing the same entity simultaneously
 */

class EntityLockManager {
  constructor() {
    this.locks = new Map(); // entityId -> { adminId, adminName, timestamp, timeout }
    this.listeners = new Set();
    this.lockTimeout = 15 * 60 * 1000; // 15 minutes
    this.cleanupInterval = null;
  }

  /**
   * Acquire lock on entity
   */
  acquireLock(entityId, adminId, adminName) {
    // Check if entity is already locked
    if (this.locks.has(entityId)) {
      const existingLock = this.locks.get(entityId);
      if (existingLock.adminId !== adminId) {
        return {
          success: false,
          lockedBy: existingLock.adminName,
          error: `This item is being edited by ${existingLock.adminName}`,
        };
      }
    }

    // Acquire lock
    const lockData = {
      entityId,
      adminId,
      adminName,
      timestamp: Date.now(),
      timeout: null,
    };

    // Set auto-release timeout
    lockData.timeout = setTimeout(() => {
      this.releaseLock(entityId, adminId);
    }, this.lockTimeout);

    this.locks.set(entityId, lockData);
    this.notifyListeners();

    return { success: true };
  }

  /**
   * Release lock on entity
   */
  releaseLock(entityId, adminId) {
    const lock = this.locks.get(entityId);
    
    // Only allow release if admin who locked it or timeout
    if (lock && (lock.adminId === adminId || !adminId)) {
      if (lock.timeout) {
        clearTimeout(lock.timeout);
      }
      this.locks.delete(entityId);
      this.notifyListeners();
      return true;
    }

    return false;
  }

  /**
   * Check if entity is locked
   */
  isLocked(entityId) {
    return this.locks.has(entityId);
  }

  /**
   * Get lock info
   */
  getLock(entityId) {
    return this.locks.get(entityId) || null;
  }

  /**
   * Check if current admin can edit
   */
  canEdit(entityId, adminId) {
    if (!this.locks.has(entityId)) {
      return true;
    }

    const lock = this.locks.get(entityId);
    return lock.adminId === adminId;
  }

  /**
   * Get all active locks
   */
  getActiveLocks() {
    return Array.from(this.locks.values());
  }

  /**
   * Subscribe to lock changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          activeLocks: this.getActiveLocks(),
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Error in lock listener:', err);
      }
    });
  }

  /**
   * Start periodic cleanup
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [entityId, lock] of this.locks) {
        if (now - lock.timestamp > this.lockTimeout) {
          this.releaseLock(entityId);
        }
      }
    }, 60000); // Check every minute
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Reset for testing
   */
  reset() {
    for (const lock of this.locks.values()) {
      if (lock.timeout) clearTimeout(lock.timeout);
    }
    this.locks.clear();
    this.notifyListeners();
  }
}

export default new EntityLockManager();