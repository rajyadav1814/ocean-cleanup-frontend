import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { eventApi, activityApi } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { eventStateMeta, verificationStateMeta, provenanceMeta } from '../eventMeta';
import { fileToDataUrl } from '../../../utils/file';

function fmt(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const RELATIONSHIP_LABEL = {
  observed_at: 'observed at', affects: 'affects', affected_by: 'affected by',
  caused_by: 'caused by', possibly_caused_by: 'possibly caused by', corroborates: 'corroborates',
  duplicate_of: 'duplicate of', follow_up_to: 'follow-up to', responds_to: 'responds to',
  removed: 'removed', restored: 'restored', rescued: 'rescued', verifies: 'verifies',
  disputes: 'disputes', predicted_to_affect: 'predicted to affect', supersedes: 'supersedes'
};

// One representative icon per subject family (spec §7 taxonomy) rather
// than one per individual code — this is a detail-page header glyph, not
// a full icon library, so a family-level approximation is enough to give
// the event a face without a many-dozen-entry icon map.
const FAMILY_ICONS = {
  pollution_waste: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6M10 2v5l-5 11a2 2 0 001.8 3h10.4a2 2 0 001.8-3l-5-11V2" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  ),
  water: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 8 5 11.5 5 15a7 7 0 0014 0c0-3.5-3-7-7-13z" />
    </svg>
  ),
  life: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20c8-1 14-7 15-15-8 1-14 7-15 15z" /><path d="M6.5 17.5C10 14 12.5 11 15 8" />
    </svg>
  ),
  habitat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8" /><path d="M6 10.5V20h12v-9.5" />
    </svg>
  ),
  conditions: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="13" /><line x1="10" y1="21" x2="10" y2="7" /><line x1="16" y1="21" x2="16" y2="11" /><line x1="22" y1="21" x2="22" y2="3" />
    </svg>
  ),
  human_action: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.2" /><path d="M5 21c0-4 3-6.5 7-6.5S19 17 19 21" />
    </svg>
  ),
};

// Confidence signals (spec §14) carry a direction, never a weight — the
// spec explicitly rules out a fake precise score, so these read as
// "supports / look closer / context" rather than as points toward a total.
const SIGNAL_STANCE_META = {
  supports: { label: 'Supports',    color: '#10b981', glyph: '✓' },
  weakens:  { label: 'Look closer', color: '#f59e0b', glyph: '!' },
  neutral:  { label: 'Context',     color: '#8299a0', glyph: '·' },
};

const EVIDENCE_TAG = {
  photo: { icon: '📷', label: 'Photo' },
  video: { icon: '🎥', label: 'Video' },
  audio: { icon: '🎙', label: 'Audio' },
  contributor_statement: { icon: '📝', label: 'Statement' },
  document: { icon: '📄', label: 'Document' },
};

const Card = ({ children, style }) => (
  <div style={{
    position: 'relative', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)',
    padding: '1.35rem 1.5rem', fontFamily: 'var(--font-sans)', boxShadow: '0 1px 3px rgba(10, 30, 48, 0.05)',
    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', ...style
  }}>
    {children}
  </div>
);

const SectionLabel = ({ icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)',
    textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.9rem' }}>
    {icon && <span style={{ display: 'flex', color: 'var(--primary)', flexShrink: 0 }}>{icon}</span>}
    {children}
  </div>
);

// An outlined checkmark chip rather than a filled background pill — reads
// as "this claim has been confirmed" (corroborated / supported / verified)
// rather than as a generic status label the way the flat StatePill used
// elsewhere in the app does.
const CheckPill = ({ label, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.7rem',
    borderRadius: '999px', border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
    background: `color-mix(in srgb, ${color} 8%, transparent)`, color,
    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap'
  }}>
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    {label}
  </span>
);

const HistoryIcon = ({ field }) => (
  <span style={{
    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: field === 'event_state' ? 'color-mix(in srgb, #10b981 16%, transparent)' : 'color-mix(in srgb, #378add 16%, transparent)',
    color: field === 'event_state' ? '#10b981' : '#378add'
  }}>
    {field === 'event_state' ? (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ) : (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5z" />
      </svg>
    )}
  </span>
);

// Decorative header art — a soft circular badge with a rising sparkline,
// echoing the "this report moved things forward" arc of the page (state →
// corroborated → addressed) without needing real chart data.
const HeaderArt = () => (
  <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true" style={{ position: 'absolute', top: '1rem', right: '1.25rem', opacity: 0.85 }}>
    <circle cx="44" cy="44" r="40" fill="color-mix(in srgb, var(--primary) 10%, transparent)" />
    <path d="M22 52l12-14 9 8 15-18" stroke="color-mix(in srgb, var(--primary) 55%, transparent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="58" cy="28" r="2.6" fill="color-mix(in srgb, var(--primary) 65%, transparent)" />
  </svg>
);

// Shared with the header's activity-proof badge (spec §21) — same visual
// language for both proof kinds, since to the viewer they mean the same
// thing: "this record is independently checkable on-chain."
const ProofBadge = ({ proof }) => {
  if (!proof?.recorded) return null;
  const color = proof.hashMatches ? '#10b981' : '#8299a0';
  return (
    <a href={proof.explorerUrl} target="_blank" rel="noopener noreferrer" title="Tamper-evident proof of this record, independently checkable on-chain"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.28rem 0.7rem', borderRadius: '999px',
        border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
        color, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap', textDecoration: 'none' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      {proof.hashMatches ? 'Tamper-proof' : 'Proof recorded'}
    </a>
  );
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isContributor = user?.role === 'contributor';
  const isVerifier = user?.role === 'verifier' || user?.role === 'admin';
  // Action routes (.../events/:id) stay under /contributor for every
  // non-citizen role — that's the actual page component being rendered
  // (see AppRouter.jsx's shared allowedRoles for this route). Only the
  // "back to overview" link needs a role-correct destination, since
  // verifiers have their own overview at /verifier/pending, not
  // /contributor/overview.
  const basePath = user?.role === 'citizen' ? '/citizen' : '/contributor';
  const overviewPath = user?.role === 'citizen' ? '/citizen/overview'
    : user?.role === 'verifier' ? '/verifier/pending'
    : '/contributor/overview';

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [actionSubjects, setActionSubjects] = useState([]);
  const [planOpen, setPlanOpen] = useState(false);
  const [planSubjectCode, setPlanSubjectCode] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState('');

  const [completeOpen, setCompleteOpen] = useState(false);
  const [kgRemoved, setKgRemoved] = useState('');
  const [completeNote, setCompleteNote] = useState('');
  const [completePhotos, setCompletePhotos] = useState([]); // [{file, dataUrl}]
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const [relateOpen, setRelateOpen] = useState(false);
  const [relateTargetId, setRelateTargetId] = useState('');
  const [relateType, setRelateType] = useState('duplicate_of');
  const [relating, setRelating] = useState(false);
  const [relateError, setRelateError] = useState('');

  const [relatedExpanded, setRelatedExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [proof, setProof] = useState(null);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const res = await eventApi.getById(id);
    if (!res.ok) {
      setLoadError(res.error || 'Event not found');
      setEvent(null);
    } else {
      setEvent(res.event);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  useEffect(() => {
    if (!isContributor) return;
    eventApi.listSubjects('human_action').then((res) => { if (res.ok) setActionSubjects(res.subjects); });
  }, [isContributor]);

  // spec §21: the only blockchain-facing thing a user ever sees is this
  // tamper-evident proof, fetched quietly and shown only once it exists —
  // no wallet, no gas, no chain jargon. This is the original submission's
  // proof specifically — not every event has a legacy activity (action
  // events created via Plan Action don't), so it's simply absent for
  // those; they get their own proof per verification below instead.
  useEffect(() => {
    if (!event?.legacyActivityId) { setProof(null); return; }
    let cancelled = false;
    activityApi.getProof(event.legacyActivityId).then((res) => {
      if (!cancelled && res.ok) setProof(res.proof);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [event?.legacyActivityId]);

  // Each verifier attestation gets its own on-chain proof (spec §21) —
  // fetched per verification rather than assumed present, since older
  // verifications recorded before this existed have none. This is what
  // actually gives an action-event a proof at all: it has no legacy
  // activity, so the effect above never fires for it.
  const [verificationProofs, setVerificationProofs] = useState({});
  useEffect(() => {
    const ids = (event?.verifications || []).map((v) => v.verificationId);
    if (ids.length === 0) { setVerificationProofs({}); return; }
    let cancelled = false;
    Promise.all(ids.map((id) => eventApi.getVerificationProof(id).then((res) => [id, res.ok ? res.proof : null])))
      .then((entries) => { if (!cancelled) setVerificationProofs(Object.fromEntries(entries)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [event?.verifications]);

  async function handlePlanAction() {
    if (!planSubjectCode) return;
    setPlanning(true);
    setPlanError('');
    const res = await eventApi.planAction(id, { subjectCode: planSubjectCode, description: planDescription.trim() || undefined });
    setPlanning(false);
    if (!res.ok) {
      setPlanError(res.error || 'Failed to plan action.');
      return;
    }
    navigate(`${basePath}/events/${res.event.eventId}`);
  }

  async function handleCompletePhotosSelected(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const withDataUrls = await Promise.all(
      files.map(async (file) => ({ file, dataUrl: await fileToDataUrl(file) }))
    );
    setCompletePhotos((prev) => [...prev, ...withDataUrls]);
    e.target.value = '';
  }

  function removeCompletePhoto(index) {
    setCompletePhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleComplete() {
    setCompleting(true);
    setCompleteError('');
    const res = await eventApi.complete(id, {
      kgRemoved: kgRemoved ? Number(kgRemoved) : undefined,
      note: completeNote.trim() || undefined,
      imageUrls: completePhotos.length > 0 ? JSON.stringify(completePhotos.map((p) => p.dataUrl)) : undefined
    });
    setCompleting(false);
    if (!res.ok) {
      setCompleteError(res.error || 'Failed to complete action.');
      return;
    }
    setCompleteOpen(false);
    setKgRemoved('');
    setCompleteNote('');
    setCompletePhotos([]);
    loadEvent();
  }

  async function handleVerify(outcome) {
    setVerifying(true);
    setVerifyError('');
    const res = await eventApi.verify(id, { outcome, notes: verifyNotes.trim() || undefined });
    setVerifying(false);
    if (!res.ok) {
      setVerifyError(res.error || 'Failed to record verification.');
      return;
    }
    setVerifyOpen(false);
    setVerifyNotes('');
    loadEvent();
  }

  async function handleRelate() {
    if (!relateTargetId.trim()) return;
    setRelating(true);
    setRelateError('');
    const res = await eventApi.relate(id, { toEventId: relateTargetId.trim(), relationshipType: relateType });
    setRelating(false);
    if (!res.ok) {
      setRelateError(res.error || 'Failed to create relationship.');
      return;
    }
    setRelateOpen(false);
    setRelateTargetId('');
    loadEvent();
  }

  if (loading) return <LoadingSpinner />;

  if (loadError || !event) {
    return (
      <section style={{ maxWidth: '640px', fontFamily: 'var(--font-sans)' }}>
        <Link to={`${overviewPath}`} style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>← Back to overview</Link>
        <Card style={{ marginTop: '1rem' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>{loadError || 'This event could not be found.'}</p>
        </Card>
      </section>
    );
  }

  const stateMeta = eventStateMeta(event.eventState);
  const verMeta = verificationStateMeta(event.verificationState);
  const subjectLabel = event.subjects.map((s) => s.label).join(', ') || 'Unclassified event';
  const isAction = event.relationships.some((r) => r.relationshipType === 'responds_to' && r.direction === 'outgoing');
  const canComplete = isContributor && isAction && event.eventState !== 'addressed';
  const canPlanAction = isContributor && !isAction && event.eventState !== 'addressed';
  const primaryFamily = event.subjects[0]?.family;
  const headerIcon = FAMILY_ICONS[primaryFamily] || FAMILY_ICONS.pollution_waste;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem', maxWidth: '1320px', fontFamily: 'var(--font-sans)' }}>
      <style>{`.ed-select {
        appearance: none; -webkit-appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%237b8fa1' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat; background-position: right 0.7rem center;
      }
      .ed-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 1.25rem; align-items: flex-start; }
      .ed-col { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }
      @media (max-width: 900px) { .ed-grid { grid-template-columns: 1fr; } }
      `}</style>

      <Link to={`${overviewPath}`} style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-start',
        fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none'
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to overview
      </Link>

      <div className="ed-grid">
      <div className="ed-col">

      <Card style={{ overflow: 'hidden' }}>
        <HeaderArt />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <CheckPill label={stateMeta.label} color={stateMeta.color} />
            <CheckPill label={verMeta.label} color={verMeta.color} />
            {isAction && <CheckPill label="Action" color="#7f77dd" />}
            <ProofBadge proof={proof} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
            <span style={{
              width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'color-mix(in srgb, var(--primary) 16%, transparent)', color: 'var(--primary)'
            }}>
              {headerIcon}
            </span>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {event.title || subjectLabel}
              </h1>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem 0.5rem', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {event.locationLabel || 'Location unspecified'}
                </span>
                ·
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {fmt(event.occurredAt || event.createdAt)}
                </span>
              </p>
              {/* spec §18 — admin_area/country/water_body only ever show up once
                  the background reverse-geocode enrichment resolves (can be a
                  few seconds after the event is created), and accuracy/capture
                  method only when the device itself supplied them. */}
              {(event.adminArea || event.country || event.waterBody || event.locationAccuracyM != null || event.locationCaptureMethod) && (
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {[event.waterBody, event.adminArea, event.country].filter(Boolean).join(', ')}
                  {/* These place names come from a reverse-geocode lookup, not
                      from the contributor — spec §17 says that difference has to
                      stay visible, not be quietly presented as what they typed. */}
                  {['admin_area', 'country', 'water_body'].some((f) => event.locationProvenance?.[f] === 'external_enrichment') && (
                    <span title="Place names resolved automatically from the coordinates, not entered by the contributor"> (auto-derived)</span>
                  )}
                  {event.locationAccuracyM != null && (
                    <span> · ±{Math.round(event.locationAccuracyM)}m accuracy</span>
                  )}
                  {event.locationCaptureMethod === 'manual_pin' && <span> · manually placed</span>}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {event.subjects.length > 0 && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.2" /><path d="M5 21c0-4 3-6.5 7-6.5S19 17 19 21" />
            </svg>
          }>Subjects</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'flex-start' }}>
            {event.subjects.map((s) => {
              const attributes = s.attributes || {};
              // The ontology's controlled vocabulary (spec §7.3-7.4 life/
              // habitat condition, §7.1 pollution severity/hazard) is worth
              // showing plainly whenever it's present — unlike quantity,
              // which the Impact card already covers once an action closes
              // it out, condition/severity/hazard have nowhere else to
              // appear on this page.
              const ontologyKeys = ['condition', 'severity', 'hazard'].filter((key) => attributes[key]);
              // The subject-level `source` badge above is the fallback for
              // every other attribute; only give a field its own provenance
              // badge when it actually differs (spec §17's example: a
              // contributor-corrected quantity on an otherwise AI-inferred
              // subject) — condition/severity/hazard are shown above instead
              // once already, so they're excluded here to avoid a duplicate.
              const overridden = Object.entries(attributes)
                .filter(([key]) => !ontologyKeys.includes(key)
                  && s.attributeProvenance?.[key] && s.attributeProvenance[key] !== s.source);
              return (
                <div key={s.eventSubjectId} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.8rem',
                    borderRadius: '999px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', fontSize: '0.85rem'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.label}</span>
                    {ontologyKeys.length > 0 && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {ontologyKeys.map((key) => String(attributes[key]).replace(/_/g, ' ')).join(' · ')}
                      </span>
                    )}
                    {s.confidence != null && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{Math.round(s.confidence * 100)}%</span>}
                    <span style={{ fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.03em', color: 'var(--primary)' }}>{s.source.replace('_', ' ')}</span>
                  </span>
                  {overridden.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', paddingLeft: '0.5rem' }}>
                      {overridden.map(([key, value]) => {
                        const pm = provenanceMeta(s.attributeProvenance[key]);
                        return (
                          <span key={key}
                            title={`${key.replace(/_/g, ' ')} was recorded separately from this subject's overall source`}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.55rem',
                              borderRadius: '999px', border: `1px solid color-mix(in srgb, ${pm.color} 40%, transparent)`,
                              background: `color-mix(in srgb, ${pm.color} 8%, transparent)`,
                              fontSize: '0.68rem', fontWeight: 600, color: pm.color
                            }}>
                            {key.replace(/_/g, ' ')}: {String(value)} · {pm.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {event.description && (
            <p style={{ margin: '0.9rem 0 0', fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>&ldquo;{event.description}&rdquo;</p>
          )}
        </Card>
      )}

      {event.measurements.length > 0 && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="13" /><line x1="10" y1="21" x2="10" y2="7" /><line x1="16" y1="21" x2="16" y2="11" /><line x1="22" y1="21" x2="22" y2="3" />
            </svg>
          }>Measurements</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {event.measurements.map((m, i, arr) => (
              <div key={m.measurementId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                padding: '0.6rem 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                    {m.parameter.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {[m.method === 'instrument' ? (m.instrument || 'Instrument reading') : 'Informal observation', m.notes].filter(Boolean).join(' — ')}
                  </div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', flexShrink: 0 }}>
                  {m.value}{m.unit ? ` ${m.unit}` : ''}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(canPlanAction || canComplete) && (
        <Card style={{ background: 'color-mix(in srgb, var(--primary) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
          {canPlanAction && !planOpen && (
            <button type="button" onClick={() => setPlanOpen(true)}
              style={{ background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                padding: '0.6rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              Plan Action →
            </button>
          )}
          {canPlanAction && planOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <SectionLabel icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 20c8-1 14-7 15-15-8 1-14 7-15 15z" /><path d="M6.5 17.5C10 14 12.5 11 15 8" />
                </svg>
              }>Plan an action responding to this</SectionLabel>
              <select className="ed-select" value={planSubjectCode} onChange={(e) => setPlanSubjectCode(e.target.value)}
                style={{ padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem' }}>
                <option value="">What kind of action?</option>
                {actionSubjects.map((s) => <option key={s.subjectId} value={s.code}>{s.label}</option>)}
              </select>
              <textarea value={planDescription} onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="What's the plan? (optional)" rows={2}
                style={{ padding: '0.65rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem', resize: 'vertical' }} />
              {planError && <div style={{ fontSize: '0.78rem', color: '#ef4444' }}>{planError}</div>}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" onClick={handlePlanAction} disabled={!planSubjectCode || planning}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                    padding: '0.55rem 1.2rem', cursor: planSubjectCode ? 'pointer' : 'default', opacity: planSubjectCode ? 1 : 0.6, font: 'inherit', fontSize: '0.85rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {planning ? 'Planning…' : 'Confirm'}
                </button>
                <button type="button" onClick={() => setPlanOpen(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-muted)',
                    padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {canComplete && !completeOpen && (
            <button type="button" onClick={() => setCompleteOpen(true)}
              style={{ background: '#10b981', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                padding: '0.6rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              ✓ Mark Complete
            </button>
          )}
          {canComplete && completeOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <SectionLabel icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }>Log what happened</SectionLabel>
              <input type="number" min="0" step="0.5" value={kgRemoved} onChange={(e) => setKgRemoved(e.target.value)}
                placeholder="kg removed (optional)"
                style={{ width: '180px', padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem' }} />
              <textarea value={completeNote} onChange={(e) => setCompleteNote(e.target.value)}
                placeholder="Any notes? (optional)" rows={2}
                style={{ padding: '0.65rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem', resize: 'vertical' }} />

              <div>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer',
                  padding: '0.5rem 0.9rem', borderRadius: '999px', border: '1px dashed var(--border-light)',
                  color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Add photos of the completed work
                  <input type="file" accept="image/*" multiple onChange={handleCompletePhotosSelected} style={{ display: 'none' }} />
                </label>
                {completePhotos.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.6rem' }}>
                    {completePhotos.map((p, i) => (
                      <div key={i} style={{ position: 'relative', width: '64px', height: '64px' }}>
                        <img src={p.dataUrl} alt={`Completion evidence ${i + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                        <button type="button" onClick={() => removeCompletePhoto(i)} aria-label="Remove photo"
                          style={{
                            position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '999px',
                            background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', lineHeight: 1,
                          }}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {completeError && <div style={{ fontSize: '0.78rem', color: '#ef4444' }}>{completeError}</div>}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" onClick={handleComplete} disabled={completing}
                  style={{ background: '#10b981', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                    padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                  {completing ? 'Saving…' : 'Confirm complete'}
                </button>
                <button type="button" onClick={() => setCompleteOpen(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-muted)',
                    padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {isVerifier && event.verificationState !== 'verified' && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
            </svg>
          }>Verify this event</SectionLabel>
          <p style={{ margin: '0 0 0.7rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Review the evidence above and record an outcome. Verifying an action closes out the report(s) it responds to — this is a separate step from the team marking their own work complete.
          </p>
          {!verifyOpen && (
            <button type="button" onClick={() => setVerifyOpen(true)}
              style={{ background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                padding: '0.6rem 1.3rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              Review evidence
            </button>
          )}
          {verifyOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <textarea value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Notes (optional)" rows={2}
                style={{ padding: '0.65rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem', resize: 'vertical' }} />
              {verifyError && <div style={{ fontSize: '0.78rem', color: '#ef4444' }}>{verifyError}</div>}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleVerify('verified')} disabled={verifying}
                  style={{ background: '#10b981', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                    padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                  {verifying ? 'Saving…' : '✓ Verified'}
                </button>
                <button type="button" onClick={() => handleVerify('disputed')} disabled={verifying}
                  style={{ background: '#ef4444', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                    padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                  Disputed
                </button>
                <button type="button" onClick={() => handleVerify('unable_to_verify')} disabled={verifying}
                  style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-muted)', fontWeight: 700,
                    padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                  Unable to verify
                </button>
                <button type="button" onClick={() => setVerifyOpen(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-muted)',
                    padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {event.evidence.length > 0 && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
            </svg>
          }>Evidence</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {event.evidence.map((ev) => {
              const tag = EVIDENCE_TAG[ev.evidenceType] || { icon: '📎', label: ev.evidenceType.replace(/_/g, ' ') };
              const caption = `${ev.evidenceType.replace(/_/g, ' ').toUpperCase()}-${(ev.captureSource || 'unknown').toUpperCase()}-${fmt(ev.createdAt).toUpperCase()}`;
              return (
                <div key={ev.evidenceId} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                  {ev.evidenceType === 'photo' && ev.gatewayUrl ? (
                    <img src={ev.gatewayUrl} alt="Evidence" style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                  ) : ev.evidenceType === 'video' && ev.gatewayUrl ? (
                    <video src={ev.gatewayUrl} controls style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: '84px', height: '84px', borderRadius: 'var(--radius-md)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--surface-hover)', border: '1px solid var(--border-light)', fontSize: '1.6rem' }}>{tag.icon}</span>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {ev.evidenceType === 'contributor_statement' && ev.metadata?.text ? (
                      <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>&ldquo;{ev.metadata.text}&rdquo;</p>
                    ) : (
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem', wordBreak: 'break-word' }}>{caption}</div>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.55rem',
                      borderRadius: '999px', border: '1px solid var(--border-light)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {tag.icon} {tag.label}
                    </span>
                  </div>
                  {ev.gatewayUrl && (
                    <a href={ev.gatewayUrl} target="_blank" rel="noopener noreferrer"
                      style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.9rem',
                        borderRadius: '999px', border: '1px solid var(--border-light)', color: 'var(--text-main)', fontWeight: 700,
                        fontSize: '0.78rem', textDecoration: 'none' }}>
                      View full size
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17L17 7M7 7h10v10" />
                      </svg>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {event.relationships.length > 0 && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 4.5" /><path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07L12.5 19.5" />
            </svg>
          }>Related events</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(relatedExpanded ? event.relationships : event.relationships.slice(0, 4)).map((r, i, arr) => (
              <Link key={r.relationshipId} to={`${basePath}/events/${r.otherEventId}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem',
                  padding: '0.65rem 0', textDecoration: 'none', color: 'inherit',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <span style={{ fontSize: '0.83rem' }}>
                  {r.direction === 'outgoing' ? 'This ' : ''}
                  <strong>{RELATIONSHIP_LABEL[r.relationshipType] || r.relationshipType}</strong>
                  {r.direction === 'incoming' ? ' this' : ''} — {r.otherEventTitle || eventStateMeta(r.otherEventState).label}
                </span>
                <CheckPill label={eventStateMeta(r.otherEventState).label} color={eventStateMeta(r.otherEventState).color} />
              </Link>
            ))}
          </div>
          {event.relationships.length > 4 && (
            <button type="button" onClick={() => setRelatedExpanded((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', width: '100%',
                marginTop: '0.4rem', padding: '0.55rem 0 0', borderTop: '1px solid var(--border-light)', border: 'none', borderTopWidth: '1px',
                background: 'transparent', color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', font: 'inherit' }}>
              {relatedExpanded ? 'Show less' : `View all events (${event.relationships.length})`}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: relatedExpanded ? 'rotate(180deg)' : 'none' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </Card>
      )}

      {isContributor && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 4.5" /><path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07L12.5 19.5" />
            </svg>
          }>Relate to another event</SectionLabel>
          {!relateOpen ? (
            <button type="button" onClick={() => setRelateOpen(true)}
              style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-main)',
                fontWeight: 700, padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              Link this to another event
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Copy the other event's ID from its page URL, then pick how this relates to it.
              </p>
              <input type="text" value={relateTargetId} onChange={(e) => setRelateTargetId(e.target.value)}
                placeholder="Other event's ID"
                style={{ padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem' }} />
              <select className="ed-select" value={relateType} onChange={(e) => setRelateType(e.target.value)}
                style={{ padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem' }}>
                {Object.entries(RELATIONSHIP_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>This {label} that event</option>
                ))}
              </select>
              {relateError && <div style={{ fontSize: '0.78rem', color: '#ef4444' }}>{relateError}</div>}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" onClick={handleRelate} disabled={!relateTargetId.trim() || relating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                    padding: '0.55rem 1.2rem', cursor: relateTargetId.trim() ? 'pointer' : 'default', opacity: relateTargetId.trim() ? 1 : 0.6, font: 'inherit', fontSize: '0.85rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L11.5 4.5" /><path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07L12.5 19.5" />
                  </svg>
                  {relating ? 'Linking…' : 'Confirm link'}
                </button>
                <button type="button" onClick={() => setRelateOpen(false)}
                  style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-muted)',
                    padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {event.impact.length > 0 && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="13" /><line x1="10" y1="21" x2="10" y2="7" /><line x1="16" y1="21" x2="16" y2="11" /><line x1="22" y1="21" x2="22" y2="3" />
            </svg>
          }>Impact</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.75rem' }}>
            {event.impact.map((i) => (
              <div key={i.impactId}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>{i.value} {i.unit}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.03em' }}>
                  {i.metric.replace(/_/g, ' ')} ({i.unit})
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      </div>

      <div className="ed-col">

      {event.confidenceSignals.length > 0 && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5z" /><path d="M9 12l2 2 4-4" />
            </svg>
          }>Why this confidence level</SectionLabel>
          <p style={{ margin: '-0.4rem 0 0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            The signals behind &ldquo;{verMeta.label}&rdquo;. These aren&rsquo;t scored or weighted — they&rsquo;re shown so you can weigh them yourself.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {event.confidenceSignals.map((s) => {
              const meta = SIGNAL_STANCE_META[s.stance] || SIGNAL_STANCE_META.neutral;
              return (
                <div key={s.signal} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <span aria-hidden="true" style={{
                    flexShrink: 0, width: '18px', height: '18px', borderRadius: '50%', marginTop: '0.05rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700,
                    background: `color-mix(in srgb, ${meta.color} 15%, transparent)`, color: meta.color
                  }}>{meta.glyph}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.45 }}>{s.detail}</div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: meta.color, marginTop: '0.1rem' }}>
                      {meta.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {event.stateHistory.length > 0 && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" />
            </svg>
          }>History</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(historyExpanded ? event.stateHistory : event.stateHistory.slice(0, 4)).map((h) => (
              <div key={h.historyId} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
                <HistoryIcon field={h.field} />
                <div style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <strong>{h.field === 'event_state' ? 'State' : 'Verification'}</strong>: {h.oldValue || 'new'} → {h.newValue}
                  {h.note && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>{h.note}</div>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{fmt(h.changedAt)}</div>
              </div>
            ))}
          </div>
          {event.stateHistory.length > 4 && (
            <button type="button" onClick={() => setHistoryExpanded((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', width: '100%',
                marginTop: '1rem', padding: '0.55rem 0 0', borderTop: '1px solid var(--border-light)', border: 'none', borderTopWidth: '1px',
                background: 'transparent', color: 'var(--primary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', font: 'inherit' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" />
              </svg>
              {historyExpanded ? 'Show less' : 'View full history'}
            </button>
          )}
        </Card>
      )}

      {event.verifications.length > 0 && (
        <Card>
          <SectionLabel icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5z" />
            </svg>
          }>Verifications</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {event.verifications.map((v, i, arr) => (
              <div key={v.verificationId} style={{ padding: '0.55rem 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize' }}>{v.outcome.replace(/_/g, ' ')}</div>
                  <ProofBadge proof={verificationProofs[v.verificationId]} />
                </div>
                {v.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{v.notes}</div>}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{fmt(v.createdAt)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      </div>
      </div>
    </section>
  );
}
