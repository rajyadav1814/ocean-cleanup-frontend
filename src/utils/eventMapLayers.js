// Map layers derive from the environmental_event model (spec §24) — each
// answers one of the doc's example questions instead of a map just being a
// pin dump. Shared between the public Global Impact Map and the
// contributor's own "Your Areas" map so both read the same vocabulary and
// stay in sync as the model evolves.
//
// "test" runs against an event plus a shared context object
// ({ userLocation, organizationId }) for the two layers that need input
// beyond the event's own fields.

// 'reassessed' included — it's a closed report reopened by a fresh
// corroborator (spec §11), so it belongs on the "unresolved" layer just
// like 'recurring' does, not on the resolved side with 'addressed'.
const UNRESOLVED_STATES = new Set([
  'observed', 'corroborated', 'needs_attention', 'action_planned',
  'action_underway', 'recurring', 'disputed', 'unable_to_verify', 'reassessed',
]);
export const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const NEAR_ME_RADIUS_KM = 250;

/**
 * The single definition of "needs attention" (spec §9/§16), shared by the
 * dashboard's Needs Attention card and the map's question of the same name.
 *
 * These were written separately and disagreed: the card listed everything
 * not yet addressed, while the map matched only the literal 'needs_attention'
 * state — so a dashboard showing two open issues sat directly above a map
 * insisting nothing needed attention. Anything still being tracked counts;
 * 'addressed' is the only resting state.
 */
export function needsAttention(event) {
  return event?.eventState !== 'addressed';
}

// haversine distance in km — used only by the "Near me" layer, no need for
// a full geo library for a single radius filter.
export function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ── Answer helpers ───────────────────────────────────────────────────────
   Each layer states a question; these turn its filtered set into an actual
   answer (spec §9: "the map should answer questions, not just show pins").
   Every one returns null on an empty set — the caller already renders a
   "nothing matches" line, and a fabricated answer is worse than none. */

function placeOf(e) {
  if (e.locationLabel) return e.locationLabel;
  if (e.lat == null || e.lon == null) return null;
  // ~1km bucket, so repeat reports of one spot collapse into one "place"
  // even when each pin carries its own exact coordinates.
  return `${Number(e.lat).toFixed(2)},${Number(e.lon).toFixed(2)}`;
}

function distinctPlaces(events) {
  return new Set(events.map(placeOf).filter(Boolean)).size;
}

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function daysSince(value) {
  if (!value) return null;
  const ms = Date.now() - new Date(value).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 86400000) : null;
}

function agoPhrase(days) {
  if (days == null) return null;
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

function labelOf(e) {
  return e.subjects?.[0]?.label || e.title || 'a report';
}

// Most frequently reported place, for the recurring question.
function topPlace(events) {
  const counts = new Map();
  for (const e of events) {
    const place = placeOf(e);
    if (place) counts.set(place, (counts.get(place) || 0) + 1);
  }
  let best = null;
  for (const [place, n] of counts) {
    if (!best || n > best.n) best = { place, n };
  }
  return best;
}

/* ── Places, not pins ─────────────────────────────────────────────────────
   The map's real unit is a place a contributor keeps returning to, not one
   row per submission. Four reports of the same jetty are one place that
   "keeps coming back" — which is the whole point of the recurring question
   and is invisible when every report is just another dot. */

// How a place is labelled: the reverse-geocoded string is long
// ("Ring Road -2, Munjka, Rajkot Taluka, Rajkot, Gujarat"), so the first
// couple of parts name the spot and the rest situate it.
function splitPlaceLabel(label) {
  if (!label) return { name: 'Unknown location', region: null };
  const parts = label.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 2) return { name: parts.join(', ') || 'Unknown location', region: null };
  return { name: parts.slice(0, 2).join(', '), region: parts.slice(2).join(', ') };
}

function monthsBetween(from, to) {
  const months = Math.round((new Date(to) - new Date(from)) / (30 * 86400000));
  if (months <= 1) return 'a month';
  if (months < 12) return `${months} months`;
  const years = Math.round(months / 12);
  return years === 1 ? 'a year' : `${years} years`;
}

function relativeDay(value) {
  const days = daysSince(value);
  if (days == null) return null;
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 7) return `${days} days ago`;
  return null;
}

// Status precedence when one place carries several: recurrence is the most
// actionable thing to know about a place, then whether it's waiting on
// someone, then mere recent movement.
export const PLACE_STATUS = {
  recurring:      { id: 'recurring',      label: 'Keeps coming back', color: '#c14f2c' },
  needs_attention:{ id: 'needs_attention',label: 'Needs attention',   color: '#f59e0b' },
  recent:         { id: 'recent',         label: 'Changed recently',  color: '#378add' },
};

/**
 * groupIntoPlaces — collapses a contributor's events into the places they
 * happened, with the recurrence count and the one-line reason each place is
 * worth looking at. Ordered by how much it wants attention.
 */
export function groupIntoPlaces(events) {
  const buckets = new Map();
  for (const e of events) {
    const key = placeOf(e);
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(e);
  }

  const places = [...buckets.values()].map((evs) => {
    const sorted = [...evs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const newest = sorted.reduce((acc, e) =>
      !acc || new Date(e.updatedAt) > new Date(acc.updatedAt) ? e : acc, null);
    const { name, region } = splitPlaceLabel(newest?.locationLabel || evs[0].locationLabel);

    const isRecurring = evs.some((e) => e.eventState === 'recurring') || evs.length >= 3;
    const wantsAttention = evs.some(needsAttention);
    const changedRecently = newest?.updatedAt
      && Date.now() - new Date(newest.updatedAt).getTime() <= RECENT_WINDOW_MS;

    const status = isRecurring ? PLACE_STATUS.recurring
      : wantsAttention ? PLACE_STATUS.needs_attention
      : changedRecently ? PLACE_STATUS.recent
      : null;

    // The reason line — why this place is on the list, in its own terms.
    let reason = null;
    if (isRecurring && evs.length > 1) {
      reason = `Reported ${evs.length} times in ${monthsBetween(sorted[0].createdAt, newest.updatedAt)}`;
    } else if (wantsAttention) {
      const awaitingAction = evs.find((e) => e.eventState === 'action_planned' || e.eventState === 'action_underway');
      const unverified = evs.some((e) => e.eventState === 'addressed' && e.verificationState === 'unverified');
      reason = awaitingAction
        ? (awaitingAction.eventState === 'action_underway' ? 'Action underway' : 'Action planned')
        : unverified ? 'Waiting on verification' : 'Still open';
    } else if (changedRecently) {
      const when = relativeDay(newest.updatedAt);
      const underway = evs.some((e) => e.eventState === 'action_underway' || e.eventState === 'action_planned');
      reason = underway
        ? `Cleanup started${when ? ` ${when}` : ''}`
        : `Updated${when ? ` ${when}` : ''}`;
    }

    return {
      key: placeOf(newest || evs[0]),
      name,
      region,
      reason,
      status,
      count: evs.length,
      lat: Number(newest?.lat ?? evs[0].lat),
      lon: Number(newest?.lon ?? evs[0].lon),
      updatedAt: newest?.updatedAt || null,
      events: evs,
    };
  });

  const rank = { recurring: 0, needs_attention: 1, recent: 2 };
  return places.sort((a, b) => {
    const ra = a.status ? rank[a.status.id] : 3;
    const rb = b.status ? rank[b.status.id] : 3;
    if (ra !== rb) return ra - rb;
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });
}

// The four questions the contributor map leads with (spec §9 explicitly
// warns against overloading it with every filter at once). The remaining
// layers stay available to the public Global Impact Map, which serves a
// different, exploratory purpose.
export const CONTRIBUTOR_LAYER_IDS = ['all', 'needs-attention', 'recurring', 'recent'];

// An answer may be a plain sentence or a { headline, detail } pair — the
// contributor map leads with a bolded headline, while the public map's
// remaining layers still return one line. Normalizing here means neither
// renderer has to care which it got.
export function normalizeAnswer(answer) {
  if (!answer) return null;
  if (typeof answer === 'string') return { headline: answer, detail: null };
  return { headline: answer.headline || null, detail: answer.detail || null };
}

export const MAP_LAYERS = [
  {
    id: 'all',
    label: 'All events',
    chip: "Everywhere I've been",
    question: 'Everything recorded here.',
    test: () => true,
    answer: (events) => events.length ? {
      headline: `${plural(distinctPlaces(events), 'place', 'places')}, ${plural(events.length, 'report', 'reports')}.`,
      detail: (() => {
        const open = events.filter((e) => UNRESOLVED_STATES.has(e.eventState)).length;
        const done = events.filter((e) => e.eventState === 'addressed').length;
        const parts = [];
        if (done > 0) parts.push(`${done} resolved`);
        if (open > 0) parts.push(`${open} still open`);
        return parts.length ? `${parts.join(', ')}.` : null;
      })(),
    } : null,
  },
  {
    // Its own question (spec §9 lists it) rather than folded into
    // "unresolved": a report nobody has acted on is a different ask from one
    // that's merely not closed yet.
    id: 'needs-attention',
    label: 'Needs attention',
    chip: 'What needs attention?',
    question: 'What needs attention?',
    // Shared with the dashboard card of the same name — see needsAttention().
    test: (e) => needsAttention(e),
    answer: (events) => {
      if (!events.length) return null;
      const flagged = events.filter((e) => e.eventState === 'needs_attention').length;
      const underway = events.filter((e) => e.eventState === 'action_underway' || e.eventState === 'action_planned').length;
      const reopened = events.filter((e) => e.eventState === 'reassessed').length;
      const confirmed = events.filter((e) => e.eventState === 'corroborated').length;
      const parts = [];
      if (flagged > 0) parts.push(`${flagged} flagged for action`);
      if (underway > 0) parts.push(`${underway} with action planned or underway`);
      if (confirmed > 0) parts.push(`${confirmed} confirmed by others, awaiting action`);
      if (reopened > 0) parts.push(`${reopened} reopened after new reports`);
      return {
        headline: `${plural(distinctPlaces(events), 'place is', 'places are')} still open.`,
        detail: parts.length ? `${parts.join(', ')}.` : null,
      };
    },
  },
  {
    id: 'unresolved',
    label: 'Unresolved problems',
    question: 'Where are unresolved problems?',
    test: (e) => UNRESOLVED_STATES.has(e.eventState) && !e.subjects?.every((s) => s.family === 'human_action'),
    answer: (events) => {
      if (!events.length) return null;
      // Named `flagged`, not `needsAttention` — that name now belongs to the
      // shared predicate above, and shadowing it here invites reading the
      // function as a boolean (which is always truthy).
      const flagged = events.filter((e) => e.eventState === 'needs_attention').length;
      const underway = events.filter((e) => e.eventState === 'action_underway' || e.eventState === 'action_planned').length;
      const oldest = events.reduce((acc, e) => {
        const d = daysSince(e.createdAt);
        return d != null && (acc == null || d > acc) ? d : acc;
      }, null);
      const parts = [];
      if (flagged > 0) parts.push(`${flagged} needing attention`);
      if (underway > 0) parts.push(`${underway} with action underway`);
      const breakdown = parts.length ? ` — ${parts.join(', ')}` : '';
      const age = oldest != null && oldest > 0 ? ` Oldest is ${agoPhrase(oldest)}.` : '';
      return `${plural(events.length, 'report is', 'reports are')} still unresolved${breakdown}.${age}`;
    },
  },
  {
    id: 'cleanups',
    label: 'Cleanups occurring',
    question: 'Where are cleanups and other human actions underway?',
    test: (e) => e.subjects?.some((s) => s.family === 'human_action') &&
      (e.eventState === 'action_planned' || e.eventState === 'action_underway'),
    answer: (events) => {
      if (!events.length) return null;
      const underway = events.filter((e) => e.eventState === 'action_underway').length;
      const planned = events.filter((e) => e.eventState === 'action_planned').length;
      const parts = [];
      if (underway > 0) parts.push(`${underway} underway`);
      if (planned > 0) parts.push(`${planned} planned`);
      // Falls back to the plain count — without this, a set that matched the
      // layer but neither sub-case rendered as " across 2 places."
      const lead = parts.length ? parts.join(', ') : plural(events.length, 'action', 'actions');
      return `${lead} across ${plural(distinctPlaces(events), 'place', 'places')}.`;
    },
  },
  {
    // The test was always family-agnostic ('recurring' is an event_state,
    // not a pollution flag) — only the wording assumed cleanup, which meant
    // a recurring bleaching event or a repeat water anomaly landed on a
    // layer that claimed to be about pollution.
    id: 'recurring',
    label: 'Keeps coming back',
    chip: 'What keeps coming back?',
    question: 'What keeps recurring here?',
    test: (e) => e.eventState === 'recurring',
    answer: (events) => {
      if (!events.length) return null;
      const worst = topPlace(events);
      return {
        headline: `${plural(distinctPlaces(events), 'place keeps', 'places keep')} coming back.`,
        detail: worst && worst.n > 1 ? `Most often at ${worst.place} — ${worst.n} reports.` : null,
      };
    },
  },
  {
    // The complement of 'unresolved' — the spec lists "What has been
    // resolved?" as its own question, and without it the map could only
    // ever show what's still wrong. 'addressed' is the resolved state
    // whatever the outcome was (removed, rescued, restored, reassessed
    // away), so this stays universal rather than cleanup-shaped.
    id: 'resolved',
    label: 'Resolved',
    question: 'What has been resolved?',
    test: (e) => e.eventState === 'addressed',
    answer: (events) => {
      if (!events.length) return null;
      const verified = events.filter((e) => e.verificationState === 'verified').length;
      const latest = events.reduce((acc, e) =>
        !acc || new Date(e.updatedAt) > new Date(acc.updatedAt) ? e : acc, null);
      const confirmed = verified > 0 ? `, ${verified} of them verified` : '';
      const recent = latest
        ? ` Most recently ${labelOf(latest)}, ${agoPhrase(daysSince(latest.updatedAt))}.`
        : '';
      return `${plural(events.length, 'report has', 'reports have')} been resolved${confirmed}.${recent}`;
    },
  },
  {
    id: 'recent',
    label: 'Changed recently',
    chip: 'What changed recently?',
    question: 'What has changed in the last 7 days?',
    test: (e) => e.updatedAt && Date.now() - new Date(e.updatedAt).getTime() <= RECENT_WINDOW_MS,
    answer: (events) => {
      if (!events.length) return null;
      const resolved = events.filter((e) => e.eventState === 'addressed').length;
      const started = events.filter((e) => e.eventState === 'action_underway' || e.eventState === 'action_planned').length;
      const corroborated = events.filter((e) => (e.corroborationCount ?? 0) > 0).length;
      const parts = [];
      if (started > 0) parts.push(`${started === 1 ? 'One cleanup' : `${started} cleanups`} started`);
      if (corroborated > 0) parts.push(`${corroborated === 1 ? 'one' : corroborated} picked up new reports from other people`);
      if (resolved > 0) parts.push(`${resolved} resolved`);
      const detail = parts.length
        ? `${parts.join(', ').replace(/^./, (ch) => ch.toUpperCase())}.`
        : null;
      return {
        headline: `${plural(distinctPlaces(events), 'place', 'places')} moved in the last week.`,
        detail,
      };
    },
  },
  {
    id: 'strongest-evidence',
    label: 'Strongest evidence',
    question: 'Where is evidence strongest?',
    test: (e) => e.verificationState === 'verified' || e.verificationState === 'corroborated',
    answer: (events) => {
      if (!events.length) return null;
      const verified = events.filter((e) => e.verificationState === 'verified').length;
      const corroborated = events.length - verified;
      const parts = [];
      if (verified > 0) parts.push(`${verified} verified by a reviewer`);
      if (corroborated > 0) parts.push(`${corroborated} confirmed by other people`);
      return `${parts.join(', ')} across ${plural(distinctPlaces(events), 'place', 'places')}.`;
    },
  },
  {
    id: 'near-me',
    label: 'Near me',
    question: 'What is happening around me?',
    needsLocation: true,
    test: (e, ctx) =>
      ctx.userLocation != null &&
      distanceKm(ctx.userLocation[0], ctx.userLocation[1], Number(e.lat), Number(e.lon)) <= NEAR_ME_RADIUS_KM,
    answer: (events, ctx) => {
      if (!events.length || !ctx?.userLocation) return null;
      const nearest = events.reduce((acc, e) => {
        const d = distanceKm(ctx.userLocation[0], ctx.userLocation[1], Number(e.lat), Number(e.lon));
        return !acc || d < acc.d ? { d, event: e } : acc;
      }, null);
      const open = events.filter((e) => UNRESOLVED_STATES.has(e.eventState)).length;
      const openPhrase = open > 0 ? `, ${open} still unresolved` : '';
      const nearestPhrase = nearest
        ? ` Nearest is ${labelOf(nearest.event)}, ${Math.round(nearest.d)} km away.`
        : '';
      return `${plural(events.length, 'report', 'reports')} within ${NEAR_ME_RADIUS_KM} km${openPhrase}.${nearestPhrase}`;
    },
  },
  {
    id: 'by-org',
    label: 'By organization',
    question: 'Where does this organization operate?',
    needsOrganization: true,
    test: (e, ctx) => ctx.organizationId != null && e.organizationId === ctx.organizationId,
    answer: (events) => {
      if (!events.length) return null;
      const resolved = events.filter((e) => e.eventState === 'addressed').length;
      const resolvedPhrase = resolved > 0 ? `, ${resolved} resolved` : '';
      return `${plural(events.length, 'report', 'reports')} across ${plural(distinctPlaces(events), 'place', 'places')}${resolvedPhrase}.`;
    },
  },
];
