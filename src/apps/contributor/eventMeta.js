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

// Adaptive "Your Impact" metrics (spec §8): which two numbers a
// contributor's dashboard leads with, chosen by whichever subject family
// dominates their events — a wildlife observer sees rescues, a
// water-quality contributor sees anomalies, not everyone forced into
// "cleanup actions completed" / "kg removed". Shared between
// ContributorOverview's dashboard cards and the dedicated MyImpact page so
// the two never disagree about what a contributor's numbers mean.
export const FAMILY_IMPACT_METRICS = {
  pollution_waste: (impact) => [
    { key: 'actions', label: 'Actions Completed', value: impact.actionsCompleted ?? 0, unit: '', sub: 'Cleanup actions completed' },
    { key: 'waste', label: 'Waste Removed', value: impact.kgRemoved ?? 0, unit: 'kg', sub: 'Total waste removed' },
  ],
  life: (impact, byFamily) => [
    { key: 'observations', label: 'Wildlife Observations', value: byFamily.life?.total ?? 0, unit: '', sub: 'Life subjects reported' },
    { key: 'rescues', label: 'Rescues', value: byFamily.life?.addressed ?? 0, unit: '', sub: 'Individuals rescued or resolved' },
  ],
  water: (impact, byFamily) => [
    { key: 'measurements', label: 'Measurements Submitted', value: byFamily.water?.total ?? 0, unit: '', sub: 'Water-quality readings' },
    { key: 'anomalies', label: 'Anomalies Flagged', value: byFamily.water?.needsAttention ?? 0, unit: '', sub: 'Readings needing attention' },
  ],
  habitat: (impact, byFamily) => [
    { key: 'sites', label: 'Sites Monitored', value: byFamily.habitat?.total ?? 0, unit: '', sub: 'Habitat sites reported' },
    { key: 'conditionChanges', label: 'Condition Changes', value: byFamily.habitat?.addressed ?? 0, unit: '', sub: 'Condition changes recorded' },
  ],
  conditions: (impact, byFamily) => [
    { key: 'readings', label: 'Readings Submitted', value: byFamily.conditions?.total ?? 0, unit: '', sub: 'Condition readings' },
    { key: 'changes', label: 'Changes Flagged', value: byFamily.conditions?.needsAttention ?? 0, unit: '', sub: 'Changes needing attention' },
  ],
  human_action: (impact) => [
    { key: 'actions', label: 'Actions Completed', value: impact.actionsCompleted ?? 0, unit: '', sub: 'Actions completed' },
    { key: 'locations', label: 'Locations Affected', value: impact.locationsAffected ?? 0, unit: '', sub: 'Locations affected' },
  ],
};

export function dominantSubjectFamily(byFamily) {
  const entries = Object.entries(byFamily || {});
  if (entries.length === 0) return 'pollution_waste';
  return entries.reduce(
    (best, [family, counts]) => (counts.total > (byFamily[best]?.total ?? -1) ? family : best),
    entries[0][0]
  );
}

export function adaptiveImpactMetrics(impact) {
  const byFamily = impact?.byFamily || {};
  const family = dominantSubjectFamily(byFamily);
  const fn = FAMILY_IMPACT_METRICS[family] || FAMILY_IMPACT_METRICS.pollution_waste;
  return fn(impact || {}, byFamily);
}
