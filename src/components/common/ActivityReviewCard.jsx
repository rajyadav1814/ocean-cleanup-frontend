import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import NoImagePlaceholder from './NoImagePlaceholder';
import { formatActivityDate } from '../../utils/formatters';

// Same three checks environmentalEventService's runIntakePipeline/
// listEvents compute server-side (spec §20) — a verifier-facing label per
// flag so "this report is thin" is visible at a glance instead of only
// showing up as a longer review once opened.
const SANITY_FLAG_META = {
  missing_location: 'No location',
  no_evidence: 'No evidence',
  no_subject: 'Unclassified',
};

/**
 * Shared verifier-style activity card (image + gallery/IPFS badge, location
 * header, StatusBadge, Category/Waste/GPS/Volunteers/Submitted/Debris
 * source/Survey/Weather rows). Used by PendingQueue, and — via
 * ActivitiesByStatus — ActivityReview and RejectedActivity.
 *
 * Props:
 *   activity            – the activity record
 *   onImageClick({images, startAt}) – open the image gallery modal
 *   showActions         – render Approve/Reject buttons (PendingQueue only)
 *   onApprove / onReject / busy – action handlers + per-card busy state
 *   reviewMeta          – render the reject-reason / approved-on callout
 *   showExtendedFields  – render Debris source / Survey / Weather rows.
 *                         Defaults to true; RejectedActivity passes false to
 *                         preserve its pre-existing (narrower) field set.
 *   signal              – this activity's linked event's verification
 *                         signals (spec §20), keyed by activity.environmentalEventId:
 *                         { corroborationCount, sanityFlags, eventState, verificationState }.
 *                         Absent (not just empty) while signals are still
 *                         loading or the activity has no linked event yet.
 */
export default function ActivityReviewCard({
  activity,
  onImageClick,
  showActions = false,
  onApprove,
  onReject,
  busy,
  reviewMeta = false,
  showExtendedFields = true,
  signal,
}) {
  const urls = Array.isArray(activity.imageGatewayUrl)
    ? activity.imageGatewayUrl
    : activity.imageGatewayUrl
      ? [activity.imageGatewayUrl]
      : [];
  const firstUrl = urls[0];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: busy ? 0.8 : 1, transition: 'opacity 0.2s' }}>

      {/* Evidence Image */}
      <div style={{ background: 'var(--surface-hover)', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden', position: 'relative' }}>
        {firstUrl ? (
          <>
            <img
              src={firstUrl}
              alt="Cleanup evidence"
              onClick={() => onImageClick && onImageClick({ images: urls, startAt: 0 })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onImageClick && onImageClick({ images: urls, startAt: 0 });
                }
              }}
              role="button"
              tabIndex={0}
              title="Click to view photos"
              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
            />
            {urls.length > 1 && (
              <span style={{
                position: 'absolute', top: '0.4rem', left: '0.4rem',
                background: 'rgba(0,0,0,0.65)', color: 'white',
                fontSize: '0.7rem', padding: '0.15rem 0.45rem',
                borderRadius: '999px', fontWeight: 600, backdropFilter: 'blur(4px)'
              }}>{urls.length} photos</span>
            )}
          </>
        ) : (
          <NoImagePlaceholder />
        )}

        {/* IPFS badge overlay */}
        {Array.isArray(activity.imageCid) && activity.imageCid.length > 0 && (
          <a
            href={activity.imageGatewayUrl[0]}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'absolute', bottom: '0.5rem', right: '0.5rem',
              background: 'rgba(0,0,0,0.6)', color: '#0ea5e9',
              fontSize: '0.7rem', padding: '0.2rem 0.5rem',
              borderRadius: '0.375rem', backdropFilter: 'blur(4px)',
              textDecoration: 'none', fontWeight: 600
            }}
          >
            IPFS ↗
          </a>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '1.5rem' }}>
        <div className="flex-between mb-4">
          <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', flex: 1, marginRight: '0.5rem' }}>
            {activity.location || 'Unknown location'}
          </h4>
          <StatusBadge status={activity.status} />
        </div>

        {signal && (signal.corroborationCount > 0 || signal.sanityFlags.length > 0 || activity.environmentalEventId) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
            {signal.corroborationCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px',
                background: 'rgba(16,185,129,.12)', color: 'var(--success)', fontSize: '0.7rem', fontWeight: 700
              }} title="Independently reported by this many other nearby events">
                ✓ Corroborated ×{signal.corroborationCount}
              </span>
            )}
            {signal.sanityFlags.map((flag) => (
              <span key={flag} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px',
                background: 'rgba(245,158,11,.12)', color: 'var(--warning)', fontSize: '0.7rem', fontWeight: 700
              }}>
                ⚠ {SANITY_FLAG_META[flag] || flag}
              </span>
            ))}
            {activity.environmentalEventId && (
              <Link to={`/contributor/events/${activity.environmentalEventId}`} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', borderRadius: '999px',
                  border: '1px solid var(--border-light)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700, textDecoration: 'none'
                }}>
                View full event ↗
              </Link>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <div className="flex-between">
            <span>Category</span>
            <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{activity.category}</strong>
          </div>
          <div className="flex-between">
            <span>Waste collected</span>
            <strong style={{ color: 'var(--text-main)' }}>{activity.quantity} kg</strong>
          </div>
          {activity.gps && (
            <div className="flex-between">
              <span>GPS</span>
              <strong style={{ color: 'var(--text-main)', fontSize: '0.8rem' }}>{activity.gps}</strong>
            </div>
          )}
          <div className="flex-between">
            <span>Volunteers</span>
            <strong style={{ color: 'var(--text-main)' }}>
              {activity.volunteers != null && activity.volunteers !== 0 ? activity.volunteers : '—'}
            </strong>
          </div>
          <div className="flex-between">
            <span>Submitted</span>
            <strong style={{ color: 'var(--text-main)' }}>{activity.timestamp ? formatActivityDate(activity.timestamp) : '—'}</strong>
          </div>
          {showExtendedFields && activity.debrisSource && (
            <div className="flex-between">
              <span>Debris source</span>
              <strong style={{ color: 'var(--text-main)' }}>{activity.debrisSource}</strong>
            </div>
          )}
          {showExtendedFields && (activity.surveyLengthM || activity.surveyAreaSqm || (activity.surveyMethod && activity.surveyMethod !== 'Not measured')) && (
            <div className="flex-between">
              <span>Survey</span>
              <strong style={{ color: 'var(--text-main)' }}>
                {[
                  activity.surveyLengthM ? `${activity.surveyLengthM} m` : null,
                  activity.surveyAreaSqm ? `${activity.surveyAreaSqm} m²` : null,
                  activity.surveyMethod && activity.surveyMethod !== 'Not measured' ? activity.surveyMethod : null
                ].filter(Boolean).join(' · ')}
              </strong>
            </div>
          )}
          {showExtendedFields && (activity.weatherConditions || activity.daysSinceRain != null || activity.windSpeedKmh != null) && (
            <div className="flex-between">
              <span>Weather</span>
              <strong style={{ color: 'var(--text-main)' }}>
                {[
                  activity.weatherConditions,
                  activity.daysSinceRain != null ? `${activity.daysSinceRain}d since rain` : null,
                  activity.windSpeedKmh != null ? `${activity.windSpeedKmh} km/h wind` : null
                ].filter(Boolean).join(' · ')}
              </strong>
            </div>
          )}

          {reviewMeta && activity.status === 'rejected' && activity.reviewNote && (
            <div style={{
              marginTop: '0.25rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(239,68,68,0.1)',
              borderRadius: '0.5rem',
              borderLeft: '3px solid var(--danger)',
              fontSize: '0.8rem',
              color: '#f87171'
            }}>
              <strong>Reason: </strong>{activity.reviewNote}
            </div>
          )}

          {reviewMeta && activity.status === 'approved' && activity.reviewedAt && (
            <div style={{
              marginTop: '0.25rem',
              padding: '0.5rem 0.75rem',
              background: 'rgba(16,185,129,0.1)',
              borderRadius: '0.5rem',
              borderLeft: '3px solid var(--success)',
              fontSize: '0.8rem',
              color: 'var(--success)'
            }}>
              Approved on {formatActivityDate(activity.reviewedAt)}
            </div>
          )}
        </div>

        {showActions && (
          <div className="mt-6" style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="success"
              disabled={!!busy}
              onClick={onApprove}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.65rem' }}
            >
              {busy === 'approving' ? (
                <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {busy === 'approving' ? 'Approving…' : 'Approve'}
            </button>
            <button
              className="danger"
              disabled={!!busy}
              onClick={onReject}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.65rem' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
