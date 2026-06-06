import { useState, useEffect, useCallback } from 'react';
import IntegrationFlow from '@/lib/IntegrationFlow';

// Hook for managing API integration actions in components
export function useIntegration(actionKey) {
  const [state, setState] = useState({
    status: 'idle',
    loading: false,
    error: null,
    data: null,
    success: false,
  });

  const flow = IntegrationFlow.getInstance();

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = flow.subscribe((event) => {
      if (event.actionKey === actionKey) {
        const flowState = event.state;
        setState({
          status: flowState.status,
          loading: flowState.status === 'loading',
          error: flowState.error ? flowState.error.message : null,
          data: flowState.data,
          success: flowState.status === 'success',
        });
      }
    });

    return unsubscribe;
  }, [actionKey]);

  // Execute action
  const execute = useCallback(async (endpoint, method = 'POST', data = null, options = {}) => {
    return flow.executeAction(actionKey, endpoint, method, data, options);
  }, [actionKey]);

  // Reset state
  const reset = useCallback(() => {
    flow.resetState(actionKey);
    setState({
      status: 'idle',
      loading: false,
      error: null,
      data: null,
      success: false,
    });
  }, [actionKey]);

  return {
    ...state,
    execute,
    reset,
    isLoading: state.loading,
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
  };
}

// Hook for batch actions
export function useIntegrationBatch() {
  const [states, setStates] = useState({});
  const [loading, setLoading] = useState(false);

  const flow = IntegrationFlow.getInstance();

  useEffect(() => {
    const unsubscribe = flow.subscribe((event) => {
      setStates(prev => ({
        ...prev,
        [event.actionKey]: event.state,
      }));
    });

    return unsubscribe;
  }, []);

  const executeBatch = useCallback(async (actions) => {
    setLoading(true);
    try {
      const results = await flow.executeBatch(actions);
      return results;
    } finally {
      setLoading(false);
    }
  }, []);

  const getState = useCallback((key) => {
    return states[key] || { status: 'idle' };
  }, [states]);

  return {
    states,
    loading,
    executeBatch,
    getState,
  };
}

export default useIntegration;