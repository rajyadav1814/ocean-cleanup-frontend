import { useEffect, useMemo, useState } from 'react';
import { eventApi } from '../services/api';

/**
 * useEventSignals — verification signals (corroborationCount, sanityFlags,
 * eventState, verificationState) for a set of event IDs, keyed by
 * eventId (spec §20: give a verifier the risk/confidence signal the
 * backend already computes, instead of a flat approve/reject list with no
 * way to tell a well-corroborated report from a thin one).
 *
 * Deliberately NOT routed through the Redux events slice — that cache is
 * shaped for "the global list" or "one contributor's list" and keyed
 * accordingly, whereas this is a plain, small, frequently-changing batch
 * (whichever events are currently in someone's review queue) that doesn't
 * belong in a long-lived global cache.
 */
export function useEventSignals(eventIds) {
  const key = useMemo(() => [...new Set((eventIds || []).filter(Boolean))].sort().join(','), [eventIds]);
  const [signalsByEventId, setSignalsByEventId] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) { setSignalsByEventId({}); return; }
    let cancelled = false;
    setLoading(true);
    eventApi.listByIds(key.split(','))
      .then((res) => {
        if (cancelled || !res.ok) return;
        setSignalsByEventId(Object.fromEntries(res.events.map((e) => [e.eventId, e])));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [key]);

  return { signalsByEventId, loading };
}
