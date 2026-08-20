import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../services/api';

/**
 * useContributorInsights — fetches /api/contributor/insights for the logged-in
 * contributor: top locations, disposal method breakdown, and wildlife sightings.
 */
export function useContributorInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet('/api/contributor/insights');
      if (data.ok && data.insights) {
        setInsights(data.insights);
      } else {
        setError(data.error || 'Failed to load insights');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { insights, loading, error, refresh: fetchInsights };
}
