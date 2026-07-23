import { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPost } from '../services/api';

export function useActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/activities');
      setActivities(data.activities || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Call POST /api/activities/:id/review with { status, reviewNote }
  // Returns { ok, activity } and updates local state immediately
  const reviewActivity = useCallback(async (id, status, reviewNote = '') => {
    const data = await apiPost(`/api/activities/${id}/review`, { status, reviewNote });
    if (data.ok) {
      setActivities(prev =>
        prev.map(a => a.id === id ? { ...a, ...data.activity } : a)
      );
    }
    return data;
  }, []);

  return { activities, loading, reviewActivity, refresh: fetchActivities };
}
