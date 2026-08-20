import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContributorInsights, invalidateContributorStats } from '../store/contributorSlice';

/**
 * useContributorInsights — reads from the global Redux store.
 * The API is called at most once per session (cached globally), so
 * switching sidebar tabs and coming back doesn't refetch.
 */
export function useContributorInsights() {
  const dispatch = useDispatch();
  const { insights, insightsStatus, insightsError } = useSelector((state) => state.contributor);

  const loading = insightsStatus === 'idle' || insightsStatus === 'loading';

  useEffect(() => {
    if (insightsStatus === 'idle') {
      dispatch(fetchContributorInsights());
    }
  }, [dispatch, insightsStatus]);

  const refresh = useCallback(() => {
    dispatch(invalidateContributorStats());
    dispatch(fetchContributorInsights());
  }, [dispatch]);

  return { insights, loading, error: insightsError, refresh };
}
