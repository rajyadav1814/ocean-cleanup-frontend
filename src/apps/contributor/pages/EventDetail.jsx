import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { eventApi } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { eventStateMeta, verificationStateMeta } from '../eventMeta';

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

const Card = ({ children, style }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)',
    padding: '1.25rem 1.5rem', fontFamily: 'var(--font-sans)', ...style
  }}>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '0.6rem' }}>
    {children}
  </div>
);

const StatePill = ({ label, color }) => (
  <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
    background: `${color}1F`, color, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
    {label}
  </span>
);

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isContributor = user?.role === 'contributor';
  const basePath = user?.role === 'citizen' ? '/citizen' : '/contributor';

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
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const [relateOpen, setRelateOpen] = useState(false);
  const [relateTargetId, setRelateTargetId] = useState('');
  const [relateType, setRelateType] = useState('duplicate_of');
  const [relating, setRelating] = useState(false);
  const [relateError, setRelateError] = useState('');

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

  async function handleComplete() {
    setCompleting(true);
    setCompleteError('');
    const res = await eventApi.complete(id, {
      kgRemoved: kgRemoved ? Number(kgRemoved) : undefined,
      note: completeNote.trim() || undefined
    });
    setCompleting(false);
    if (!res.ok) {
      setCompleteError(res.error || 'Failed to complete action.');
      return;
    }
    setCompleteOpen(false);
    setKgRemoved('');
    setCompleteNote('');
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
        <Link to={`${basePath}/overview`} style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>← Back to overview</Link>
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

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem', maxWidth: '720px', fontFamily: 'var(--font-sans)' }}>
      <Link to={`${basePath}/overview`} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none' }}>← Back to overview</Link>

      <div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <StatePill label={stateMeta.label} color={stateMeta.color} />
          <StatePill label={verMeta.label} color={verMeta.color} />
          {isAction && <StatePill label="Action" color="#7f77dd" />}
        </div>
        <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
          {event.title || subjectLabel}
        </h1>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {event.locationLabel || 'Location unspecified'} · {fmt(event.occurredAt || event.createdAt)}
        </p>
      </div>

      {event.subjects.length > 0 && (
        <Card>
          <SectionLabel>Subjects</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {event.subjects.map((s) => (
              <span key={s.eventSubjectId} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.7rem',
                borderRadius: '999px', background: 'var(--surface-hover)', border: '1px solid var(--border-light)', fontSize: '0.8rem'
              }}>
                {s.label}
                {s.confidence != null && <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>{Math.round(s.confidence * 100)}%</span>}
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.source.replace('_', ' ')}</span>
              </span>
            ))}
          </div>
          {event.description && (
            <p style={{ margin: '0.9rem 0 0', fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>&ldquo;{event.description}&rdquo;</p>
          )}
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
              <SectionLabel>Plan an action responding to this</SectionLabel>
              <select value={planSubjectCode} onChange={(e) => setPlanSubjectCode(e.target.value)}
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
                  style={{ background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                    padding: '0.55rem 1.2rem', cursor: planSubjectCode ? 'pointer' : 'default', opacity: planSubjectCode ? 1 : 0.6, font: 'inherit', fontSize: '0.85rem' }}>
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
              <SectionLabel>Log what happened</SectionLabel>
              <input type="number" min="0" step="0.5" value={kgRemoved} onChange={(e) => setKgRemoved(e.target.value)}
                placeholder="kg removed (optional)"
                style={{ width: '180px', padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem' }} />
              <textarea value={completeNote} onChange={(e) => setCompleteNote(e.target.value)}
                placeholder="Any notes? (optional)" rows={2}
                style={{ padding: '0.65rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem', resize: 'vertical' }} />
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

      {event.evidence.length > 0 && (
        <Card>
          <SectionLabel>Evidence</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {event.evidence.map((ev) => (
              <div key={ev.evidenceId}>
                {ev.evidenceType === 'photo' && ev.gatewayUrl && (
                  <img src={ev.gatewayUrl} alt="Evidence" style={{ maxWidth: '280px', borderRadius: 'var(--radius-md)' }} />
                )}
                {ev.evidenceType === 'video' && ev.gatewayUrl && (
                  <video src={ev.gatewayUrl} controls style={{ maxWidth: '280px', borderRadius: 'var(--radius-md)' }} />
                )}
                {ev.evidenceType === 'audio' && ev.gatewayUrl && (
                  <audio src={ev.gatewayUrl} controls />
                )}
                {ev.evidenceType === 'contributor_statement' && ev.metadata?.text && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>&ldquo;{ev.metadata.text}&rdquo;</p>
                )}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', textTransform: 'uppercase' }}>
                  {ev.evidenceType} · {ev.captureSource || 'unknown source'} · {fmt(ev.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {event.relationships.length > 0 && (
        <Card>
          <SectionLabel>Related events</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {event.relationships.map((r, i, arr) => (
              <Link key={r.relationshipId} to={`${basePath}/events/${r.otherEventId}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.6rem',
                  padding: '0.65rem 0', textDecoration: 'none', color: 'inherit',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <span style={{ fontSize: '0.83rem' }}>
                  {r.direction === 'outgoing' ? 'This ' : ''}
                  <strong>{RELATIONSHIP_LABEL[r.relationshipType] || r.relationshipType}</strong>
                  {r.direction === 'incoming' ? ' this' : ''} — {r.otherEventTitle || eventStateMeta(r.otherEventState).label}
                </span>
                <StatePill label={eventStateMeta(r.otherEventState).label} color={eventStateMeta(r.otherEventState).color} />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {isContributor && (
        <Card>
          <SectionLabel>Relate to another event</SectionLabel>
          {!relateOpen ? (
            <button type="button" onClick={() => setRelateOpen(true)}
              style={{ background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '999px', color: 'var(--text-main)',
                fontWeight: 700, padding: '0.55rem 1.2rem', cursor: 'pointer', font: 'inherit', fontSize: '0.85rem' }}>
              Link this to another event
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Copy the other event's ID from its page URL, then pick how this event relates to it.
              </p>
              <input type="text" value={relateTargetId} onChange={(e) => setRelateTargetId(e.target.value)}
                placeholder="Other event's ID"
                style={{ padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem' }} />
              <select value={relateType} onChange={(e) => setRelateType(e.target.value)}
                style={{ padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)',
                  background: 'var(--surface-hover)', color: 'var(--text-main)', font: 'inherit', fontSize: '0.85rem' }}>
                {Object.entries(RELATIONSHIP_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>This {label} that event</option>
                ))}
              </select>
              {relateError && <div style={{ fontSize: '0.78rem', color: '#ef4444' }}>{relateError}</div>}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button type="button" onClick={handleRelate} disabled={!relateTargetId.trim() || relating}
                  style={{ background: 'var(--primary)', border: 'none', borderRadius: '999px', color: '#fff', fontWeight: 700,
                    padding: '0.55rem 1.2rem', cursor: relateTargetId.trim() ? 'pointer' : 'default', opacity: relateTargetId.trim() ? 1 : 0.6, font: 'inherit', fontSize: '0.85rem' }}>
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
          <SectionLabel>Impact</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {event.impact.map((i) => (
              <div key={i.impactId}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-hover)' }}>{i.value} {i.unit}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{i.metric.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {event.stateHistory.length > 0 && (
        <Card>
          <SectionLabel>History</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {event.stateHistory.map((h, i, arr) => (
              <div key={h.historyId} style={{ display: 'flex', gap: '0.6rem', padding: '0.55rem 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ flex: 1, fontSize: '0.82rem' }}>
                  <strong>{h.field === 'event_state' ? 'State' : 'Verification'}</strong>: {h.oldValue || 'new'} → {h.newValue}
                  {h.note && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.15rem' }}>{h.note}</div>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{fmt(h.changedAt)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {event.verifications.length > 0 && (
        <Card>
          <SectionLabel>Verifications</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {event.verifications.map((v, i, arr) => (
              <div key={v.verificationId} style={{ padding: '0.55rem 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize' }}>{v.outcome.replace(/_/g, ' ')}</div>
                {v.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{v.notes}</div>}
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{fmt(v.createdAt)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
}
