/**
 * useBinaryInsertion
 * React hook wrapping BinaryInsertionEngine for safe, progressive member insertion.
 * Provides status, progress, and result tracking.
 */

import { useState, useCallback } from 'react';
import {
  insertMember,
  insertMembersSequentially,
  getNextAvailableSlot,
  validateNetworkIntegrity,
  recalculateFromRoot,
} from '@/lib/BinaryInsertionEngine';

export function useBinaryInsertion() {
  const [inserting, setInserting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, results: [] });
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  // Insert a single member
  const insert = useCallback(async (memberData) => {
    setInserting(true);
    setError(null);
    try {
      const result = await insertMember(memberData);
      setLastResult(result);
      return result;
    } catch (err) {
      setError(err.error || err.message || 'Insertion failed');
      return err;
    } finally {
      setInserting(false);
    }
  }, []);

  // Insert multiple members sequentially with progress tracking
  const insertBatch = useCallback(async (members) => {
    setInserting(true);
    setError(null);
    setProgress({ current: 0, total: members.length, results: [] });

    const results = await insertMembersSequentially(members, (result, idx, total) => {
      setProgress(prev => ({
        current: idx + 1,
        total,
        results: [...prev.results, result],
      }));
    });

    setInserting(false);
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      setError(`${failed.length} insertion(s) failed`);
    }
    return results;
  }, []);

  // Preview next slot without inserting
  const previewSlot = useCallback((sponsorId) => {
    return getNextAvailableSlot(sponsorId);
  }, []);

  // Validate current network integrity
  const validate = useCallback(() => {
    return validateNetworkIntegrity();
  }, []);

  // Force recalculation from root
  const recalculate = useCallback(() => {
    return recalculateFromRoot();
  }, []);

  return {
    inserting,
    progress,
    lastResult,
    error,
    insert,
    insertBatch,
    previewSlot,
    validate,
    recalculate,
  };
}

export default useBinaryInsertion;