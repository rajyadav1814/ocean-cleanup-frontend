import NoImagePlaceholder from './NoImagePlaceholder';
import { formatActivityDate } from '../../utils/formatters';

/**
 * Shared contributor-facing activity card (badge + date, location title,
 * Category/Quantity, optional reviewNote block). Used by ApprovedActivities
 * and RejectedActivities. `status` drives the badge class + whether the
 * review-note block renders.
 */
export default function ActivityListCard({ activity, onImageClick }) {
  const status = activity.status;
  const urls = Array.isArray(activity.imageGatewayUrl)
    ? activity.imageGatewayUrl
    : activity.imageGatewayUrl
      ? [activity.imageGatewayUrl]
      : [];
  const firstUrl = urls[0];

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div style={{ background: 'var(--surface-hover)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden', position: 'relative' }}>
        {firstUrl ? (
          <>
            <img
              src={firstUrl}
              alt="Cleanup evidence"
              onClick={() => onImageClick && onImageClick({ images: urls, startAt: 0 })}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onImageClick && onImageClick({ images: urls, startAt: 0 }); } }}
              role="button"
              tabIndex={0}
              title="Click to view photos"
              style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
            />
            {urls.length > 1 && (
              <span style={{
                position: 'absolute', top: '0.4rem', right: '0.4rem',
                background: 'rgba(0,0,0,0.65)', color: 'white',
                fontSize: '0.7rem', padding: '0.15rem 0.45rem',
                borderRadius: '999px', fontWeight: 600, backdropFilter: 'blur(4px)'
              }}>+{urls.length - 1} more</span>
            )}
          </>
        ) : (
          <NoImagePlaceholder />
        )}
      </div>

      <div style={{ padding: '1.25rem' }}>
        <div className="flex-between mb-4" style={{ gap: '0.75rem' }}>
          <span className={`badge ${status}`}>{status === 'approved' ? 'Approved' : 'Rejected'}</span>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>{formatActivityDate(activity.reviewedAt || activity.timestamp || Date.now())}</span>
        </div>

        <h4 style={{ color: 'var(--primary-hover)' }}>{activity.location}</h4>

        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="flex-between">
            <span className="text-muted">Category:</span>
            <strong style={{ textTransform: 'capitalize' }}>{activity.category}</strong>
          </div>
          <div className="flex-between">
            <span className="text-muted">Quantity:</span>
            <strong>{activity.quantity} kg</strong>
          </div>
          {status === 'rejected' && activity.reviewNote && (
            <div style={{ marginTop: '0.75rem' }}>
              <div className="text-muted" style={{ marginBottom: '0.25rem' }}>Reviewer note:</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{activity.reviewNote}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
