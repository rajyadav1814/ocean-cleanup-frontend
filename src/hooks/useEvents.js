import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents, invalidateEvents } from '../store/eventsSlice';

/**
 * useEvents — reads the environmental_events list from the global Redux
 * store, same "fetch once per session" pattern as useActivities. Pass a
 * contributorId to scope the fetch server-side (GET /api/events?contributorId=)
 * instead of pulling the whole list and filtering client-side.
 */
export function useEvents(contributorId) {
  const dispatch = useDispatch();
  const { items: events, status, error } = useSelector((state) => state.events);

  const loading = status === 'idle' || status === 'loading';

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchEvents(contributorId));
    }
  }, [dispatch, status, contributorId]);

  const refresh = useCallback(() => {
    dispatch(invalidateEvents());
    dispatch(fetchEvents(contributorId));
  }, [dispatch, contributorId]);

  return { events, loading, error, refresh };
}
