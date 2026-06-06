import { useState, useCallback } from 'react';
import ActionExecutor, { ACTION_TYPES } from '@/lib/ActionExecutor';

/**
 * useAdminAction Hook
 * Executes admin actions with loading state, error handling, and feedback
 */

export default function useAdminAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const execute = useCallback(async (actionType, payload, onSuccess, onError) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ActionExecutor.execute(actionType, payload);

      setSuccess({
        message: result.message,
        data: result.data,
        timestamp: result.timestamp,
      });

      // Call success callback if provided
      if (onSuccess) onSuccess(result);

      // Auto-clear success after 4 seconds
      setTimeout(() => setSuccess(null), 4000);

      return result;
    } catch (err) {
      const errorMessage = err.message || 'Action failed. Please try again.';
      setError(errorMessage);

      // Call error callback if provided
      if (onError) onError(err);

      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    execute,
    loading,
    error,
    success,
    clearMessages,
    ACTION_TYPES,
  };
}