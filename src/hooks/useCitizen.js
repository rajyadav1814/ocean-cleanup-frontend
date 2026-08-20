import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCitizenStats,
  fetchCitizenLeaderboard,
  fetchCitizenFeed,
  invalidateCitizenStats,
} from '../store/citizenSlice';

/**
 * These read from the global Redux store — the API is called at most once
 * per session (cached globally), so switching sidebar tabs and coming back
 * doesn't refetch.
 */

export function useCitizenStats() {
  const dispatch = useDispatch();
  const { stats, statsStatus, statsError } = useSelector((state) => state.citizen);

  const loading = statsStatus === 'idle' || statsStatus === 'loading';

  useEffect(() => {
    if (statsStatus === 'idle') {
      dispatch(fetchCitizenStats());
    }
  }, [dispatch, statsStatus]);

  const refresh = useCallback(() => {
    dispatch(invalidateCitizenStats());
    dispatch(fetchCitizenStats());
  }, [dispatch]);

  return { stats, loading, error: statsError, refresh };
}

export function useCitizenLeaderboard() {
  const dispatch = useDispatch();
  const { leaderboard, myRow, leaderboardStatus } = useSelector((state) => state.citizen);

  const loading = leaderboardStatus === 'idle' || leaderboardStatus === 'loading';

  useEffect(() => {
    if (leaderboardStatus === 'idle') {
      dispatch(fetchCitizenLeaderboard());
    }
  }, [dispatch, leaderboardStatus]);

  return { leaderboard, myRow, loading };
}

export function useCitizenFeed(limit = 15) {
  const dispatch = useDispatch();
  const { feed, feedStatus } = useSelector((state) => state.citizen);

  const loading = feedStatus === 'idle' || feedStatus === 'loading';

  useEffect(() => {
    if (feedStatus === 'idle') {
      dispatch(fetchCitizenFeed(limit));
    }
  }, [dispatch, feedStatus, limit]);

  return { feed, loading };
}
