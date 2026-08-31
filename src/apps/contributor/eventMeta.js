// Environmental-event state vocabulary (spec §11-12) — event_state and
// verification_state are two independent axes, so they get separate meta
// maps rather than one combined "status" the way the legacy activity
// status pill works. Shared between the dashboard and the areas map so
// the same state always reads as the same color everywhere.
export const EVENT_STATE_META = {
  observed:          { label: 'Observed',          color: '#8299a0' },
  corroborated:      { label: 'Corroborated',      color: '#378add' },
  needs_attention:   { label: 'Needs attention',   color: '#f59e0b' },
  action_planned:    { label: 'Action planned',    color: '#7f77dd' },
  action_underway:   { label: 'Action underway',   color: '#2E9E9B' },
  addressed:         { label: 'Addressed',         color: '#10b981' },
  reassessed:        { label: 'Reassessed',        color: '#8299a0' },
  recurring:         { label: 'Recurring',         color: '#c14f2c' },
  disputed:          { label: 'Disputed',          color: '#ef4444' },
  unable_to_verify:  { label: 'Unable to verify',  color: '#8299a0' },
};

export const VERIFICATION_STATE_META = {
  unverified:    { label: 'Unverified',   color: '#8299a0' },
  supported:     { label: 'Supported',    color: '#378add' },
  corroborated:  { label: 'Corroborated', color: '#2E9E9B' },
  verified:      { label: 'Verified',     color: '#10b981' },
};

export function eventStateMeta(state) {
  return EVENT_STATE_META[state] || EVENT_STATE_META.observed;
}

export function verificationStateMeta(state) {
  return VERIFICATION_STATE_META[state] || VERIFICATION_STATE_META.unverified;
}

// Field-level provenance (spec §17) — mirrors the backend's
// provenance_source enum. Used both for a subject's overall `source` and
// for individual entries in its `attributeProvenance` map, so e.g. a
// contributor-corrected quantity on an otherwise AI-inferred subject reads
// as its own "User provided" rather than inheriting "AI inferred".
export const PROVENANCE_META = {
  user_provided:        { label: 'User provided',      color: '#378add' },
  system_captured:      { label: 'System captured',    color: '#2E9E9B' },
  ai_inferred:          { label: 'AI inferred',         color: '#7f77dd' },
  external_enrichment:  { label: 'External enrichment', color: '#8299a0' },
  verifier_confirmed:   { label: 'Verifier confirmed',  color: '#10b981' },
};

export function provenanceMeta(source) {
  return PROVENANCE_META[source] || PROVENANCE_META.user_provided;
}
