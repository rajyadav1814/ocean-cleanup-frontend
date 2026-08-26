import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContributorImpact, invalidateContributorStats } from '../store/contributorSlice';

/**
 * useContributorImpact — the "Your Impact" event-model summary (spec §22),
 * same Redux-cached pattern as useContributorStats.
 */
export function useContributorImpact() {
  const dispatch = useDispatch();
  const { impact, impactStatus, impactError } = useSelector((state) => state.contributor);

  const loading = impactStatus === 'idle' || impactStatus === 'loading';

  useEffect(() => {
    if (impactStatus === 'idle') {
      dispatch(fetchContributorImpact());
    }
  }, [dispatch, impactStatus]);

  const refresh = useCallback(() => {
    dispatch(invalidateContributorStats());
    dispatch(fetchContributorImpact());
  }, [dispatch]);

  return { impact, loading, error: impactError, refresh };
}
