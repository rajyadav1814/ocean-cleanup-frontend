import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActivities, reviewActivityThunk, invalidateActivities } from '../store/activitiesSlice';

/**
 * useActivities — reads from the global Redux store.
 * The API is called at most once per session (cached globally).
 * Subsequent tab switches return instantly from the store.
 */
export function useActivities() {
  const dispatch = useDispatch();
  const { items: activities, status, error } = useSelector((state) => state.activities);

  const loading = status === 'idle' || status === 'loading';

  // Trigger fetch only when status is 'idle' (first mount or after invalidation)
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchActivities());
    }
  }, [dispatch, status]);

  // Wrap reviewActivity to dispatch the thunk and return the result
  const reviewActivity = useCallback(
    async (id, reviewStatus, reviewNote = '') => {
      const result = await dispatch(reviewActivityThunk({ id, status: reviewStatus, reviewNote }));
      return result.payload;
    },
    [dispatch]
  );

  // Force a fresh fetch on next mount (use after submitting a new activity)
  const refresh = useCallback(() => {
    dispatch(invalidateActivities());
    dispatch(fetchActivities());
  }, [dispatch]);

  return { activities, loading, error, reviewActivity, refresh };
}
