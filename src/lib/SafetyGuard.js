/**
 * Safety Guard System
 * Prevents dangerous operations by requiring confirmations
 */

class SafetyGuard {
  constructor() {
    this.pendingConfirmations = {};
    this.confirmationThreshold = 1; // Default single confirmation
    this.sessionTimeout = 60000; // 60 seconds
    this.observers = [];
  }

  /**
   * Subscribe to confirmation updates
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers
   */
  notifyObservers(confirmationId, state) {
    this.observers.forEach(cb => cb(confirmationId, state));
  }

  /**
   * Critical operations requiring double confirmation or higher role
   */
  CRITICAL_OPERATIONS = {
    // Financial operations
    APPROVE_PAYMENT: { category: 'financial', requiresDoubleConfirm: true, minRole: 'admin' },
    REJECT_PAYMENT: { category: 'financial', requiresDoubleConfirm: true, minRole: 'admin' },
    REFUND_PAYMENT: { category: 'financial', requiresDoubleConfirm: true, minRole: 'admin' },
    PROCESS_PAYOUT: { category: 'financial', requiresDoubleConfirm: true, minRole: 'admin' },

    // Account operations
    BLOCK_ACCOUNT: { category: 'account', requiresDoubleConfirm: true, minRole: 'admin' },
    SUSPEND_ACCOUNT: { category: 'account', requiresDoubleConfirm: true, minRole: 'admin' },
    DELETE_ACCOUNT: { category: 'account', requiresDoubleConfirm: true, minRole: 'admin' },

    // Role operations
    GRANT_ADMIN_ROLE: { category: 'role', requiresDoubleConfirm: true, minRole: 'admin' },
    REVOKE_ADMIN_ROLE: { category: 'role', requiresDoubleConfirm: true, minRole: 'admin' },
    CHANGE_USER_ROLE: { category: 'role', requiresDoubleConfirm: true, minRole: 'admin' },

    // Plan operations
    DOWNGRADE_PLAN: { category: 'plan', requiresDoubleConfirm: false, minRole: 'admin' },
    UPGRADE_PLAN: { category: 'plan', requiresDoubleConfirm: false, minRole: 'admin' },
    CANCEL_PLAN: { category: 'plan', requiresDoubleConfirm: true, minRole: 'admin' },

    // Leader operations
    REASSIGN_LEADER: { category: 'leader', requiresDoubleConfirm: true, minRole: 'admin' },
    REMOVE_LEADER: { category: 'leader', requiresDoubleConfirm: true, minRole: 'admin' },
    REVOKE_LEADER_STATUS: { category: 'leader', requiresDoubleConfirm: true, minRole: 'admin' },
  };

  /**
   * Request confirmation for an operation
   */
  requestConfirmation(operationType, context) {
    const operation = this.CRITICAL_OPERATIONS[operationType];
    if (!operation) {
      throw new Error(`Unknown operation: ${operationType}`);
    }

    const confirmationId = this.generateId();
    const requiresDoubleConfirm = operation.requiresDoubleConfirm;

    const confirmation = {
      id: confirmationId,
      operationType,
      context, // target user, amount, details
      requiresDoubleConfirm,
      minRole: operation.minRole,
      stage: 1, // 1 or 2
      status: 'pending', // pending, confirmed, rejected, timeout
      confirmations: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + this.sessionTimeout,
    };

    this.pendingConfirmations[confirmationId] = confirmation;
    this.notifyObservers(confirmationId, 'created');

    // Auto-cleanup after timeout
    setTimeout(() => {
      if (this.pendingConfirmations[confirmationId]?.status === 'pending') {
        this.pendingConfirmations[confirmationId].status = 'timeout';
        this.notifyObservers(confirmationId, 'timeout');
        delete this.pendingConfirmations[confirmationId];
      }
    }, this.sessionTimeout);

    return confirmationId;
  }

  /**
   * Confirm an operation (stage 1)
   */
  confirmStage1(confirmationId, actor, userRole) {
    const confirmation = this.pendingConfirmations[confirmationId];
    if (!confirmation) return { success: false, error: 'Confirmation not found' };

    // Check role requirement
    if (userRole !== 'admin') {
      return { success: false, error: 'Insufficient role for this operation' };
    }

    confirmation.confirmations.push({
      stage: 1,
      actor,
      timestamp: Date.now(),
    });

    if (!confirmation.requiresDoubleConfirm) {
      // Single confirmation sufficient
      confirmation.status = 'confirmed';
      confirmation.stage = 1;
      this.notifyObservers(confirmationId, 'confirmed');
      return { success: true, confirmed: true };
    } else {
      // Move to stage 2
      confirmation.stage = 2;
      this.notifyObservers(confirmationId, 'stage2');
      return { success: true, confirmed: false, requiresStage2: true };
    }
  }

  /**
   * Confirm an operation (stage 2 - second actor)
   */
  confirmStage2(confirmationId, actor, userRole) {
    const confirmation = this.pendingConfirmations[confirmationId];
    if (!confirmation) return { success: false, error: 'Confirmation not found' };
    if (confirmation.stage !== 2) {
      return { success: false, error: 'Not in stage 2' };
    }

    // Check that stage 2 is from different actor
    const stage1Actor = confirmation.confirmations[0]?.actor;
    if (actor === stage1Actor) {
      return { success: false, error: 'Second confirmation must be from different admin' };
    }

    // Check role
    if (userRole !== 'admin') {
      return { success: false, error: 'Insufficient role for this operation' };
    }

    confirmation.confirmations.push({
      stage: 2,
      actor,
      timestamp: Date.now(),
    });

    confirmation.status = 'confirmed';
    confirmation.stage = 2;
    this.notifyObservers(confirmationId, 'confirmed');
    return { success: true, confirmed: true };
  }

  /**
   * Reject a confirmation
   */
  rejectConfirmation(confirmationId, actor, reason) {
    const confirmation = this.pendingConfirmations[confirmationId];
    if (!confirmation) return { success: false, error: 'Confirmation not found' };

    confirmation.status = 'rejected';
    confirmation.rejectedBy = actor;
    confirmation.rejectionReason = reason;
    this.notifyObservers(confirmationId, 'rejected');

    return { success: true };
  }

  /**
   * Get confirmation status
   */
  getConfirmationStatus(confirmationId) {
    return this.pendingConfirmations[confirmationId] || null;
  }

  /**
   * Check if operation is approved and ready to execute
   */
  isApproved(confirmationId) {
    const confirmation = this.pendingConfirmations[confirmationId];
    if (!confirmation) return false;
    return confirmation.status === 'confirmed';
  }

  /**
   * Execute operation (after confirmation)
   */
  executeOperation(confirmationId) {
    const confirmation = this.pendingConfirmations[confirmationId];
    if (!confirmation) return { success: false, error: 'Confirmation not found' };
    if (!this.isApproved(confirmationId)) {
      return { success: false, error: 'Operation not approved' };
    }

    // Log execution
    confirmation.executedAt = Date.now();
    this.notifyObservers(confirmationId, 'executed');

    // Clean up after 5 minutes
    setTimeout(() => {
      delete this.pendingConfirmations[confirmationId];
    }, 5 * 60 * 1000);

    return { success: true, confirmation };
  }

  /**
   * Get pending confirmations
   */
  getPendingConfirmations() {
    return Object.values(this.pendingConfirmations).filter(
      c => c.status === 'pending'
    );
  }

  /**
   * Generate ID
   */
  generateId() {
    return `conf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get operation details
   */
  getOperationDetails(operationType) {
    return this.CRITICAL_OPERATIONS[operationType] || null;
  }

  /**
   * Reset (testing only)
   */
  reset() {
    this.pendingConfirmations = {};
  }
}

export default new SafetyGuard();