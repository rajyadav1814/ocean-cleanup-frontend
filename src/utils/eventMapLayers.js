// Map layers derive from the environmental_event model (spec §24) — each
// answers one of the doc's example questions instead of a map just being a
// pin dump. Shared between the public Global Impact Map and the
// contributor's own "Your Areas" map so both read the same vocabulary and
// stay in sync as the model evolves.
//
// "test" runs against an event plus a shared context object
// ({ userLocation, organizationId }) for the two layers that need input
// beyond the event's own fields.

const UNRESOLVED_STATES = new Set([
  'observed', 'corroborated', 'needs_attention', 'action_planned',
  'action_underway', 'recurring', 'disputed', 'unable_to_verify',
]);
export const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const NEAR_ME_RADIUS_KM = 250;

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

export const MAP_LAYERS = [
  {
    id: 'all',
    label: 'All events',
    question: 'Everything recorded here.',
    test: () => true,
  },
  {
    id: 'unresolved',
    label: 'Unresolved problems',
    question: 'Where are unresolved problems?',
    test: (e) => UNRESOLVED_STATES.has(e.eventState) && !e.subjects?.every((s) => s.family === 'human_action'),
  },
  {
    id: 'cleanups',
    label: 'Cleanups occurring',
    question: 'Where are cleanups and other human actions underway?',
    test: (e) => e.subjects?.some((s) => s.family === 'human_action') &&
      (e.eventState === 'action_planned' || e.eventState === 'action_underway'),
  },
  {
    id: 'recurring',
    label: 'Recurring pollution',
    question: 'Where is pollution recurring?',
    test: (e) => e.eventState === 'recurring',
  },
  {
    id: 'recent',
    label: 'Changed recently',
    question: 'What has changed in the last 7 days?',
    test: (e) => e.updatedAt && Date.now() - new Date(e.updatedAt).getTime() <= RECENT_WINDOW_MS,
  },
  {
    id: 'strongest-evidence',
    label: 'Strongest evidence',
    question: 'Where is evidence strongest?',
    test: (e) => e.verificationState === 'verified' || e.verificationState === 'corroborated',
  },
  {
    id: 'near-me',
    label: 'Near me',
    question: 'What is happening around me?',
    needsLocation: true,
    test: (e, ctx) =>
      ctx.userLocation != null &&
      distanceKm(ctx.userLocation[0], ctx.userLocation[1], Number(e.lat), Number(e.lon)) <= NEAR_ME_RADIUS_KM,
  },
  {
    id: 'by-org',
    label: 'By organization',
    question: 'Where does this organization operate?',
    needsOrganization: true,
    test: (e, ctx) => ctx.organizationId != null && e.organizationId === ctx.organizationId,
  },
];
