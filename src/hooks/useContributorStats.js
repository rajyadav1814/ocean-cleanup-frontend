import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContributorStats, invalidateContributorStats } from '../store/contributorSlice';

/**
 * useContributorStats — reads from the global Redux store.
 * The API is called at most once per session (cached globally), so
 * switching sidebar tabs and coming back doesn't refetch.
 */
export function useContributorStats() {
  const dispatch = useDispatch();
  const { stats, statsStatus, statsError } = useSelector((state) => state.contributor);

  const loading = statsStatus === 'idle' || statsStatus === 'loading';

  useEffect(() => {
    if (statsStatus === 'idle') {
      dispatch(fetchContributorStats());
    }
  }, [dispatch, statsStatus]);

  const refresh = useCallback(() => {
    dispatch(invalidateContributorStats());
    dispatch(fetchContributorStats());
  }, [dispatch]);

  return { stats, loading, error: statsError, refresh };
}
