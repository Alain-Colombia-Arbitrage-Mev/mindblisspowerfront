import { useState, useCallback } from 'react';
import SafetyGuard from '@/lib/SafetyGuard';

/**
 * Hook for using Safety Guard in components
 * Handles confirmation workflow and operation execution
 */
export default function useSafetyGuard(actor, userRole = 'admin') {
  const [confirmationId, setConfirmationId] = useState(null);
  const [isPending, setIsPending] = useState(false);

  /**
   * Request confirmation for an operation
   */
  const requestConfirmation = useCallback((operationType, context = {}) => {
    try {
      const id = SafetyGuard.requestConfirmation(operationType, context);
      setConfirmationId(id);
      setIsPending(true);
      return id;
    } catch (error) {
      console.error('Confirmation request failed:', error);
      return null;
    }
  }, []);

  /**
   * Handle confirmation approval
   */
  const onConfirmationApproved = useCallback((id) => {
    // Operation approved - caller can proceed with execution
    return SafetyGuard.executeOperation(id);
  }, []);

  /**
   * Handle confirmation rejection
   */
  const onConfirmationRejected = useCallback((id) => {
    setConfirmationId(null);
    setIsPending(false);
  }, []);

  /**
   * Check if an operation is approved
   */
  const isOperationApproved = useCallback((id) => {
    return SafetyGuard.isApproved(id);
  }, []);

  /**
   * Get confirmation status
   */
  const getStatus = useCallback((id) => {
    return SafetyGuard.getConfirmationStatus(id);
  }, []);

  /**
   * Clear confirmation
   */
  const clearConfirmation = useCallback(() => {
    setConfirmationId(null);
    setIsPending(false);
  }, []);

  /**
   * Wrapper function for safe operations
   * Usage: await safeExecute('APPROVE_PAYMENT', {amount: 100, targetUser: 'user@email.com'}, asyncFn)
   */
  const safeExecute = useCallback(async (operationType, context, asyncFn) => {
    try {
      // Step 1: Request confirmation
      const id = SafetyGuard.requestConfirmation(operationType, context);
      setConfirmationId(id);
      setIsPending(true);

      // Step 2: Wait for confirmation (this is handled by UI dialog)
      // Return a promise that resolves when operation is approved
      return new Promise((resolve, reject) => {
        const checkApproval = setInterval(() => {
          const confirmation = SafetyGuard.getConfirmationStatus(id);
          
          if (confirmation?.status === 'confirmed') {
            clearInterval(checkApproval);
            setIsPending(false);
            
            // Step 3: Execute the async function
            asyncFn()
              .then(result => {
                SafetyGuard.executeOperation(id);
                setConfirmationId(null);
                resolve(result);
              })
              .catch(error => {
                reject(error);
              });
          } else if (confirmation?.status === 'rejected' || confirmation?.status === 'timeout') {
            clearInterval(checkApproval);
            setIsPending(false);
            setConfirmationId(null);
            reject(new Error(`Operation ${confirmation?.status}`));
          }
        }, 500); // Poll every 500ms

        // Cleanup after 5 minutes
        setTimeout(() => {
          clearInterval(checkApproval);
        }, 5 * 60 * 1000);
      });
    } catch (error) {
      console.error('Safe execution failed:', error);
      throw error;
    }
  }, [clearConfirmation]);

  return {
    confirmationId,
    isPending,
    requestConfirmation,
    onConfirmationApproved,
    onConfirmationRejected,
    isOperationApproved,
    getStatus,
    clearConfirmation,
    safeExecute,
  };
}