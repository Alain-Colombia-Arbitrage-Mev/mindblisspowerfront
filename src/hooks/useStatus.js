import { useState, useEffect } from 'react';
import {
  calculateReputationScore,
  getStatusFromScore,
  getNextStatusTarget,
  getStatusProgressPercentage,
  getStatusTimeline,
  STATUS_LEVELS,
  STATUS_BENEFITS,
} from '@/lib/statusEngine';

export function useStatus(userData) {
  const [status, setStatus] = useState(null);
  const [score, setScore] = useState(0);
  const [nextTarget, setNextTarget] = useState(null);
  const [progress, setProgress] = useState(0);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    if (!userData) return;

    // Simulate status calculation
    const newScore = calculateReputationScore(userData);
    const newStatus = getStatusFromScore(newScore);
    const newTarget = getNextStatusTarget(newScore);
    const newProgress = getStatusProgressPercentage(newScore);
    const newTimeline = getStatusTimeline(userData);

    setScore(newScore);
    setStatus(newStatus);
    setNextTarget(newTarget);
    setProgress(newProgress);
    setTimeline(newTimeline);
  }, [userData]);

  return {
    status,
    score,
    statusInfo: status ? STATUS_LEVELS[status] : null,
    nextTarget,
    progress,
    timeline,
    benefits: status ? STATUS_BENEFITS[status] : [],
  };
}