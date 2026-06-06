import { useState, useCallback } from 'react';

/**
 * useButtonAction
 * 
 * Maneja el ciclo completo de una acción de botón:
 * idle → loading → success/error → reset
 * 
 * Usage:
 * const { state, isLoading, execute } = useButtonAction(async () => {
 *   // simulación o lógica real
 *   await delay(1000);
 *   return { success: true, data: {...} };
 * });
 */

export default function useButtonAction(actionFn, options = {}) {
  const { autoReset = true, resetDelay = 2000 } = options;
  const [state, setState] = useState('idle'); // idle | loading | success | error
  const [result, setResult] = useState(null);

  const execute = useCallback(async () => {
    setState('loading');
    try {
      const res = await actionFn();
      setResult(res);
      setState('success');

      if (autoReset) {
        const timer = setTimeout(() => {
          setState('idle');
          setResult(null);
        }, resetDelay);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      setResult({ error: err.message });
      setState('error');

      if (autoReset) {
        const timer = setTimeout(() => {
          setState('idle');
          setResult(null);
        }, resetDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [actionFn, autoReset, resetDelay]);

  return {
    state,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    result,
    execute,
    reset: () => {
      setState('idle');
      setResult(null);
    },
  };
}