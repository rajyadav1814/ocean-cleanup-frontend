import { useState, useEffect, useCallback } from 'react';
import { citizenApi } from '../services/api';

export function useCitizenStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await citizenApi.getStats();
      if (data.ok) setStats(data.stats);
      else setError(data.error || 'Failed to load stats');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, error, refresh };
}

export function useCitizenLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRow, setMyRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    citizenApi.getLeaderboard().then(data => {
      if (data.ok) {
        setLeaderboard(data.leaderboard || []);
        setMyRow(data.myRow || null);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return { leaderboard, myRow, loading };
}

export function useCitizenFeed(limit = 15) {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    citizenApi.getFeed(limit).then(data => {
      if (data.ok) setFeed(data.feed || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [limit]);

  return { feed, loading };
}
