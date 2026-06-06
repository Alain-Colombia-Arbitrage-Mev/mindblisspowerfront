import { useState, useEffect } from 'react';
import ActivityLogger from '@/lib/ActivityLogger';

/**
 * Hook: useActivityLog
 * Subscribes to real-time activity updates
 */

export default function useActivityLog(limit = 50) {
  const [activities, setActivities] = useState(() => ActivityLogger.getActivities(limit));

  useEffect(() => {
    // Subscribe to activity updates
    const unsubscribe = ActivityLogger.subscribe((newActivities) => {
      setActivities(newActivities.slice(0, limit));
    });

    return unsubscribe;
  }, [limit]);

  return activities;
}