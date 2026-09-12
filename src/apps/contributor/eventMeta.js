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

// What an event is *about*, for the one-line places that can only show a
// single subject (the hero, card titles).
//
// `subjects[0]` was wrong twice over: the list payload aggregates subjects
// with json_agg(DISTINCT ...), which orders by the jsonb value rather than
// insertion, so "first" was effectively arbitrary — and it could land on the
// human_action subject, producing "the Cleanup / removal you reported was
// resolved". A cleanup is what people *did* about the event; the ghost net
// is what the event is. Human action is therefore the last resort, used only
// when an event has nothing else on it.
const SUBJECT_PRIORITY = ['pollution_waste', 'life', 'habitat', 'water', 'conditions', 'human_action'];

export function primarySubject(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) return null;
  for (const family of SUBJECT_PRIORITY) {
    const match = subjects.find((s) => s?.family === family);
    if (match) return match;
  }
  return subjects[0];
}

export function primarySubjectLabel(subjects, fallback = 'issue') {
  return primarySubject(subjects)?.label || fallback;
}

// Turns an event_impact row into the "86 kg was removed" beat of the story
// (spec §4). Shared by EventDetail's narrative and the dashboard's "What
// Changed Because of You" card so the same outcome never gets worded two
// different ways. The generic fallback keeps this open to any metric the
// backend records — impact is deliberately an open ledger, not a kg column.
const IMPACT_PHRASES = {
  debris_removed_kg: (v, u) => `${v}${u ? ` ${u}` : ''} removed`,
};

export function formatImpactPhrase({ metric, value, unit }) {
  const phrase = IMPACT_PHRASES[metric];
  if (phrase) return phrase(value, unit);
  return `${value}${unit ? ` ${unit}` : ''} ${String(metric).replace(/_/g, ' ')}`;
}

// Adaptive "Your Impact" metrics (spec §8): which numbers a contributor's
// dashboard leads with, chosen by whichever subject family dominates their
// events — a wildlife observer sees rescues, a water-quality contributor
// sees anomalies, not everyone forced into "cleanup actions completed" /
// "kg removed". Shared between ContributorOverview's dashboard cards and
// the dedicated MyImpact page so the two never disagree about what a
// contributor's numbers mean.
//
// Each family returns THREE metrics, matching spec §8's own per-type
// examples. The dashboard destructures only the first two (it has exactly
// two adaptive card slots); MyImpact spreads all of them, so the third is
// extra depth on the dedicated page rather than pressure on the overview.
export const FAMILY_IMPACT_METRICS = {
  pollution_waste: (impact, byFamily) => [
    { key: 'actions', label: 'Actions Completed', value: impact.actionsCompleted ?? 0, unit: '', sub: 'Cleanup actions completed' },
    { key: 'waste', label: 'Waste Removed', value: impact.kgRemoved ?? 0, unit: 'kg', sub: 'Total waste removed' },
    { key: 'recurring', label: 'Recurring Sites', value: byFamily.pollution_waste?.recurring ?? 0, unit: '', sub: 'Places pollution keeps returning' },
  ],
  life: (impact, byFamily) => [
    { key: 'observations', label: 'Wildlife Observations', value: byFamily.life?.total ?? 0, unit: '', sub: 'Life subjects reported' },
    { key: 'rescues', label: 'Rescues', value: byFamily.life?.addressed ?? 0, unit: '', sub: 'Individuals rescued or resolved' },
    { key: 'confirmedSpecies', label: 'Confirmed Observations', value: byFamily.life?.verified ?? 0, unit: '', sub: 'Species observations verified' },
  ],
  water: (impact, byFamily) => [
    { key: 'measurements', label: 'Measurements Submitted', value: byFamily.water?.total ?? 0, unit: '', sub: 'Water-quality readings' },
    { key: 'anomalies', label: 'Anomalies Flagged', value: byFamily.water?.needsAttention ?? 0, unit: '', sub: 'Readings needing attention' },
    { key: 'recurringChanges', label: 'Recurring Changes', value: byFamily.water?.recurring ?? 0, unit: '', sub: 'Changes that keep coming back' },
  ],
  habitat: (impact, byFamily) => [
    { key: 'sites', label: 'Sites Monitored', value: byFamily.habitat?.total ?? 0, unit: '', sub: 'Habitat sites reported' },
    { key: 'conditionChanges', label: 'Condition Changes', value: byFamily.habitat?.addressed ?? 0, unit: '', sub: 'Condition changes recorded' },
    // Counts every action this contributor completed, not only habitat ones
    // — event_impact has no per-family split. Honest for a restoration-
    // dominant contributor; revisit if mixed-family contributors find it odd.
    { key: 'restorationActions', label: 'Restoration Actions', value: impact.actionsCompleted ?? 0, unit: '', sub: 'Actions you completed' },
  ],
  conditions: (impact, byFamily) => [
    { key: 'readings', label: 'Readings Submitted', value: byFamily.conditions?.total ?? 0, unit: '', sub: 'Condition readings' },
    { key: 'changes', label: 'Changes Flagged', value: byFamily.conditions?.needsAttention ?? 0, unit: '', sub: 'Changes needing attention' },
    { key: 'corroborated', label: 'Corroborated', value: byFamily.conditions?.corroborated ?? 0, unit: '', sub: 'Readings others confirmed' },
  ],
  human_action: (impact, byFamily) => [
    { key: 'actions', label: 'Actions Completed', value: impact.actionsCompleted ?? 0, unit: '', sub: 'Actions completed' },
    { key: 'locations', label: 'Locations Affected', value: impact.locationsAffected ?? 0, unit: '', sub: 'Locations affected' },
    { key: 'corroborated', label: 'Corroborated', value: byFamily.human_action?.corroborated ?? 0, unit: '', sub: 'Actions others confirmed' },
  ],
};

// spec §8's research contributor. Keyed off contribution *shape*, not
// subject family — a researcher's dataset is still about water or life, so
// byFamily can never identify one. These are the three metrics the spec
// names for this type.
export const RESEARCH_IMPACT_METRICS = (impact, byFamily) => {
  const corroborated = Object.values(byFamily || {}).reduce((n, c) => Math.max(n, c.corroborated ?? 0), 0);
  return [
    { key: 'datasets', label: 'Datasets Contributed', value: impact.datasetsContributed ?? 0, unit: '', sub: 'Reports and datasets uploaded' },
    { key: 'corroborated', label: 'Observations Corroborated', value: corroborated, unit: '', sub: 'Observations others confirmed' },
    { key: 'connected', label: 'Records Connected', value: impact.connectedEvents ?? 0, unit: '', sub: 'Records linked to other events' },
  ];
};

// A contributor reads as "research" when uploaded datasets/documents are
// how they mostly work. Deliberately a majority test rather than "has ever
// uploaded" — one spreadsheet from a cleanup crew shouldn't retitle their
// whole dashboard.
export function isResearchContributor(impact) {
  const datasets = impact?.datasetsContributed ?? 0;
  const total = impact?.contributions ?? 0;
  return datasets > 0 && total > 0 && datasets / total > 0.5;
}

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
  if (isResearchContributor(impact)) return RESEARCH_IMPACT_METRICS(impact || {}, byFamily);
  const family = dominantSubjectFamily(byFamily);
  const fn = FAMILY_IMPACT_METRICS[family] || FAMILY_IMPACT_METRICS.pollution_waste;
  return fn(impact || {}, byFamily);
}
