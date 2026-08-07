import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../services/api';

/**
 * useContributorStats — fetches /api/contributor/stats for the logged-in contributor.
 * Returns real-time aggregates: kg, volunteers, rank, monthly deltas, tokens.
 */
export function useContributorStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/api/contributor/stats');
      if (data.ok && data.stats) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
